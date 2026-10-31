// Paymob online payments (Intention API + Unified Checkout).
// PAYMOB_MODE: "mock" shows a local fake payment page; "test" / "live" use real Paymob keys.
import { env } from 'cloudflare:workers';
import { DB } from './db.js';
import { href } from './i18n.js';

const API = 'https://accept.paymob.com';

// Fields Paymob signs, in the exact order it concatenates them (transaction callback)
const HMAC_FIELDS = [
  'amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction', 'id',
  'integration_id', 'is_3d_secure', 'is_auth', 'is_capture', 'is_refunded', 'is_standalone_payment',
  'is_voided', 'order.id', 'owner', 'pending', 'source_data.pan', 'source_data.sub_type', 'source_data.type', 'success',
];

// mock (fake payment page) is only ever set in .dev.vars for local development
export const paymobMode = () => env.PAYMOB_MODE || 'off';
const hmacSecret = () => env.PAYMOB_HMAC_SECRET || (paymobMode() === 'mock' ? 'mock-hmac-secret' : '');

/** true when online payment can actually run (keys present, or mock mode) */
export function paymobReady() {
  if (paymobMode() === 'off') return false;
  if (paymobMode() === 'mock') return true;
  return Boolean(env.PAYMOB_SECRET_KEY && env.PAYMOB_PUBLIC_KEY && env.PAYMOB_HMAC_SECRET && env.PAYMOB_INTEGRATION_IDS);
}

/** Creates a payment for the order and returns { url } to send the customer to, or { error } */
export async function startPayment(order, origin) {
  if (!paymobReady()) return { error: 'not configured' };

  const returnUrl = `${origin}${href(order.lang, `/order/${order.token}`)}`;
  if (paymobMode() === 'mock') {
    await DB().prepare("UPDATE orders SET paymob_order_id = ?, payment_status = 'pending', updated_at = datetime('now') WHERE id = ?")
      .bind(`mock-${order.id}-${Date.now()}`, order.id).run();
    return { url: `/pay/mock?token=${order.token}` };
  }

  const [first, ...rest] = order.name.split(' ');
  const items = order.items.map((i) => ({
    name: i.name.slice(0, 50),
    amount: i.unit_price,
    description: (i.details || i.name).slice(0, 255),
    quantity: i.qty,
  }));
  if (order.delivery_fee) items.push({ name: 'Delivery', amount: order.delivery_fee, description: 'Delivery fee', quantity: 1 });
  // Paymob wants the items to add up to the amount; with a discount send the order as one line
  if (order.discount) items.splice(0, items.length, { name: `Order ${order.code}`, amount: order.total, description: `El Soody order ${order.code}`, quantity: 1 });

  const res = await fetch(`${API}/v1/intention/`, {
    method: 'POST',
    headers: { Authorization: `Token ${env.PAYMOB_SECRET_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      amount: order.total,
      currency: 'EGP',
      payment_methods: env.PAYMOB_INTEGRATION_IDS.split(',').map((s) => Number(s.trim())).filter(Boolean),
      items,
      billing_data: {
        first_name: first || 'Customer',
        last_name: rest.join(' ') || 'NA',
        phone_number: `+2${order.phone}`,
        email: `order-${order.code.toLowerCase()}@${new URL(origin).hostname}`,
        country: 'EG',
        city: 'NA',
        street: order.address || 'Pickup',
        building: 'NA', floor: 'NA', apartment: 'NA',
      },
      // unique per attempt so a retry after a failed payment gets a fresh intention
      special_reference: `${order.code}-${Date.now()}`,
      notification_url: `${origin}/api/paymob/webhook`,
      redirection_url: returnUrl,
    }),
  });
  if (!res.ok) {
    console.error('paymob intention failed', res.status, await res.text());
    return { error: 'paymob' };
  }
  const data = await res.json();
  await DB().prepare("UPDATE orders SET paymob_order_id = ?, payment_status = 'pending', updated_at = datetime('now') WHERE id = ?")
    .bind(String(data.intention_order_id), order.id).run();
  return { url: `${API}/unifiedcheckout/?publicKey=${encodeURIComponent(env.PAYMOB_PUBLIC_KEY)}&clientSecret=${encodeURIComponent(data.client_secret)}` };
}

const pick = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
const asText = (v) => (v === undefined || v === null ? '' : String(v));

async function hmacHex(message) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(hmacSecret()), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** HMAC of a transaction object (webhook body "obj") */
export const signTransaction = (obj) => hmacHex(HMAC_FIELDS.map((f) => asText(pick(obj, f))).join(''));

export async function verifyTransaction(obj, hmac) {
  if (!hmacSecret() || !obj || !hmac) return false;
  return safeEqual(await signTransaction(obj), String(hmac).toLowerCase());
}

/** The browser return link carries the same fields flattened as query params ("order" instead of "order.id") */
export async function verifyRedirect(params) {
  const obj = {};
  for (const f of HMAC_FIELDS) {
    const key = f === 'order.id' ? 'order' : f;
    const v = params.get(key);
    const parts = f.split('.');
    if (parts.length === 2) (obj[parts[0]] ||= {})[parts[1]] = v;
    else obj[f] = v;
  }
  return (await verifyTransaction(obj, params.get('hmac'))) ? obj : null;
}

/** Applies a verified transaction to its order. Returns the new payment status, or null if no order matched. */
export async function applyTransaction(obj) {
  const paymobOrderId = asText(pick(obj, 'order.id'));
  const order = await DB().prepare('SELECT id, total, payment_status FROM orders WHERE paymob_order_id = ?').bind(paymobOrderId).first();
  if (!order) return null;

  const success = asText(obj.success) === 'true';
  const pending = asText(obj.pending) === 'true';
  const refunded = asText(obj.is_refunded) === 'true';
  const amountOk = Number(obj.amount_cents) === order.total;

  let status = order.payment_status;
  if (refunded) status = 'refunded';
  else if (success && !pending && amountOk) status = 'paid';
  else if (pending) status = order.payment_status === 'paid' ? 'paid' : 'pending';
  else if (order.payment_status !== 'paid') status = 'failed';

  await DB().prepare("UPDATE orders SET payment_status = ?, paymob_txn_id = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(status, asText(obj.id), order.id).run();
  return status;
}
