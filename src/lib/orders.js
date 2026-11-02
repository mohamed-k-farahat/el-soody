// Creating and reading orders.
import { DB, getSettings } from './db.js';
import { priceCart } from './cart.js';
import { applyOffers, reservePromo, unreservePromo, releasePerks, reclaimPerks, releaseAbandoned } from './offers.js';

export const STATUSES = ['new', 'confirmed', 'preparing', 'ready', 'out', 'completed', 'cancelled'];
export const PAY_STATUSES = ['unpaid', 'pending', 'paid', 'failed', 'refunded'];

const DIGITS = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };

/** Egyptian mobile in the 01XXXXXXXXX form, or null */
export function normalizePhone(input) {
  let p = String(input || '').replace(/[٠-٩۰-۹]/g, (d) => DIGITS[d]).replace(/[^\d+]/g, '');
  if (p.startsWith('+20')) p = '0' + p.slice(3);
  else if (p.startsWith('0020')) p = '0' + p.slice(4);
  else if (p.startsWith('20') && p.length === 12) p = '0' + p.slice(2);
  return /^01[0125]\d{8}$/.test(p) ? p : null;
}

const clean = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/**
 * Validates the checkout form and cart, then stores the order.
 * Returns { order } or { error, field? }.
 */
export async function createOrder(input) {
  const lang = input.lang === 'en' ? 'en' : 'ar';
  const settings = await getSettings();
  const fulfilment = input.fulfilment === 'delivery' ? 'delivery' : 'pickup';
  const payment = input.payment === 'online' ? 'online' : 'cod';

  if ((fulfilment === 'pickup' && !settings.pickup) || (fulfilment === 'delivery' && !settings.delivery)) return { error: 'closed' };
  if ((payment === 'cod' && !settings.cod) || (payment === 'online' && !settings.online)) return { error: 'closed' };

  const name = clean(input.name, 80);
  const phone = normalizePhone(input.phone);
  const address = clean(input.address, 300);
  const notes = clean(input.notes, 500);
  if (name.length < 2) return { error: 'name', field: 'name' };
  if (!phone) return { error: 'phone', field: 'phone' };
  if (fulfilment === 'delivery' && address.length < 5) return { error: 'address', field: 'address' };

  // pickup: which branch (chosen by the customer when there is more than one)
  let branchId = null;
  if (fulfilment === 'pickup') {
    const { results: pickupBranches } = await DB().prepare('SELECT id FROM branches WHERE active = 1 AND pickup = 1').all();
    if (pickupBranches.length === 1) branchId = pickupBranches[0].id;
    else if (pickupBranches.length > 1) {
      branchId = pickupBranches.find((b) => b.id === Number(input.branch))?.id ?? null;
      if (!branchId) return { error: 'branch', field: 'branch' };
    }
  }

  const cart = await priceCart(input.lines, { fulfilment, lang });
  if (!cart.lines.length) return { error: 'empty' };
  if (cart.problems.length) return { error: 'changed' };

  // offers: what the customer saw at checkout must still hold now
  await releaseAbandoned();
  const device = /^[a-f0-9]{32}$/.test(String(input.device || '')) ? input.device : null;
  const offers = await applyOffers(cart, { fulfilment, phone, address, code: input.promo, device });
  if (offers.promoError) return { error: 'promo', reason: offers.promoError, min: offers.promoMin };
  if (Number.isInteger(input.expectTotal) && input.expectTotal !== offers.total) return { error: 'offer' };
  const promo = offers.promo;
  if (promo && !(await reservePromo(promo.id))) return { error: 'promo', reason: 'usedup' };

  const counter = await DB()
    .prepare("UPDATE settings SET value = CAST(value AS INTEGER) + 1 WHERE key = 'next_order_number' RETURNING value")
    .first();
  const code = `S${Number(counter.value) - 1}`;
  const token = crypto.randomUUID().replace(/-/g, '');
  const orderId = '(SELECT id FROM orders WHERE token = ?)';

  const insertOrder = DB().prepare(`
    INSERT INTO orders (code, token, fulfilment, payment_method, payment_status, name, phone, address, notes, lang,
                        subtotal, delivery_fee, total, discount, delivery_waived, promo_code, welcome, device, branch_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(code, token, fulfilment, payment, payment === 'online' ? 'pending' : 'unpaid',
      name, phone, fulfilment === 'delivery' ? address : '', notes, lang,
      cart.subtotal, offers.deliveryFee, offers.total, offers.discount, offers.deliveryWaived, promo?.code || '', offers.welcome ? 1 : 0, device || '', branchId);
  const insertItem = DB().prepare(`
    INSERT INTO order_items (order_id, product_id, item_id, name, details, size, qty, unit_price, line_total, section, roast, grind_id, spice)
    VALUES (${orderId}, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  // one transaction: the order, its lines and its offer claims are saved together or not at all.
  // The claims hit unique keys if another order took the same one-time offer a moment earlier.
  const claims = [];
  if (offers.welcome) {
    claims.push(DB().prepare(`INSERT INTO welcome_claims (phone, address_key, device, order_id) VALUES (?, ?, ?, ${orderId})`).bind(phone, offers.addressKey, device, token));
  }
  if (promo) {
    claims.push(DB().prepare(`INSERT INTO promo_uses (promo_id, order_id, phone, slot) VALUES (?, ${orderId}, ?, ?)`).bind(promo.id, token, phone, offers.slot));
  }
  try {
    await DB().batch([
      insertOrder,
      ...cart.lines.map((l) => insertItem.bind(token, l.productId, l.item, l.name, l.details, l.size, l.qty, l.unit, l.total, l.section || '', l.roast || '', l.grind || 0, l.spice || 0)),
      ...claims,
    ]);
  } catch (e) {
    if (promo) await unreservePromo(promo.id);
    if (/UNIQUE/i.test(String(e?.message))) return { error: 'offer' };
    throw e;
  }

  return { order: await getOrderByToken(token) };
}

/** Changes an order's status; cancelling gives its offers back, un-cancelling takes them again */
export async function setOrderStatus(order, status) {
  await DB().prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").bind(status, order.id).run();
  if (status === 'cancelled') await releasePerks(order.id);
  else if (order.status === 'cancelled') await reclaimPerks(order);
}

const ORDER_SELECT = `
  SELECT o.*, b.name_ar AS branch_name_ar, b.name_en AS branch_name_en, b.address_ar AS branch_address_ar,
         b.address_en AS branch_address_en, b.lat AS branch_lat, b.lng AS branch_lng
  FROM orders o LEFT JOIN branches b ON b.id = o.branch_id`;

export async function getOrderByToken(token) {
  if (!/^[a-f0-9]{32}$/.test(String(token))) return null;
  const order = await DB().prepare(`${ORDER_SELECT} WHERE o.token = ?`).bind(token).first();
  if (!order) return null;
  const { results } = await DB().prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').bind(order.id).all();
  return { ...order, items: results };
}

export async function getOrderById(id) {
  const order = await DB().prepare(`${ORDER_SELECT} WHERE o.id = ?`).bind(id).first();
  if (!order) return null;
  const { results } = await DB().prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').bind(order.id).all();
  return { ...order, items: results };
}
