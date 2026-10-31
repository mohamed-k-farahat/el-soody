// Promo codes and the welcome offer (a customer's first delivery order has free delivery).
//
// The rules are checked twice: once for the checkout preview (quote) and again when the
// order is placed. Placing an order also *claims* the offer in the same database batch as
// the order, guarded by unique keys, so two orders sent at the same moment can't both get
// the same one-time benefit. Cancelled orders, and online orders never paid, give it back.
import { env } from 'cloudflare:workers';
import { DB } from './db.js';

const DIGITS = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };
const latinDigits = (s) => String(s ?? '').replace(/[٠-٩۰-۹]/g, (d) => DIGITS[d]);

export const PROMO_KINDS = ['percent', 'fixed', 'delivery'];

/** "  soody 50 " -> "SOODY50"; '' when it can't be a code */
export function normalizeCode(input) {
  const c = latinDigits(input).toUpperCase().replace(/[\s_-]/g, '');
  return /^[A-Z0-9]{3,20}$/.test(c) ? c : '';
}

/** Same address typed slightly differently gives the same key */
export function addressKey(address) {
  return latinDigits(address)
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ؤ]/g, 'و').replace(/[ئ]/g, 'ي')
    .replace(/[ً-ْـ]/g, '')          // harakat and tatweel
    .replace(/[^\p{L}\p{N}]/gu, '');
}

/** Today in Cairo as YYYY-MM-DD */
export const cairoToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());

export async function getPromoByCode(code) {
  return code ? DB().prepare('SELECT * FROM promos WHERE code = ?').bind(code).first() : null;
}

async function promoUsesByPhone(promoId, phone) {
  const { results } = await DB().prepare('SELECT slot FROM promo_uses WHERE promo_id = ? AND phone = ?').bind(promoId, phone).all();
  return results.map((r) => r.slot);
}

async function welcomeTaken(phone, addrKey, device) {
  const row = await DB().prepare('SELECT 1 FROM welcome_claims WHERE phone = ? OR address_key = ? OR device = ? LIMIT 1').bind(phone, addrKey, device).first();
  return !!row;
}

/**
 * Works out discounts for a priced cart.
 * cart: result of priceCart(); ctx: { fulfilment, phone (normalized or null), address, code, device (id or null) }
 * Returns { discount, deliveryFee, deliveryWaived, welcome, promo, promoError, promoMin, slot, total }
 */
export async function applyOffers(cart, { fulfilment, phone, address, code, device }) {
  const s = cart.settings;
  const out = { discount: 0, deliveryFee: cart.deliveryFee, deliveryWaived: 0, welcome: false, promo: null, promoError: '', promoMin: 0, slot: null };

  // 1. welcome: first delivery order per phone, per address and per device, only when there is a fee to waive.
  //    No device cookie (blocked cookies, scripts) means no welcome.
  const addrKey = addressKey(address);
  if (s.welcome_enabled === '1' && fulfilment === 'delivery' && cart.deliveryFee > 0 && phone && addrKey.length >= 4 && device
      && !(await welcomeTaken(phone, addrKey, device))) {
    out.welcome = true;
    out.deliveryWaived = cart.deliveryFee;
    out.deliveryFee = 0;
  }

  // 2. promo code (one per order)
  const normalized = normalizeCode(code);
  if (code && String(code).trim()) {
    const p = await getPromoByCode(normalized);
    const today = cairoToday();
    let err = '';
    if (!p || !p.active) err = 'unknown';
    else if (p.starts_on && today < p.starts_on) err = 'notyet';
    else if (p.ends_on && today > p.ends_on) err = 'expired';
    else if (p.max_uses > 0 && p.uses >= p.max_uses) err = 'usedup';
    else if (p.min_subtotal > 0 && cart.subtotal < p.min_subtotal) { err = 'min'; out.promoMin = p.min_subtotal; }
    else if (p.kind === 'delivery' && fulfilment !== 'delivery') err = 'pickup';
    else if (p.kind === 'delivery' && out.deliveryFee === 0) err = 'alreadyfree';
    else if (phone && p.per_customer > 0) {
      const taken = new Set(await promoUsesByPhone(p.id, phone));
      const free = Array.from({ length: p.per_customer }, (_, i) => i + 1).find((n) => !taken.has(n));
      if (!free) err = 'yours';
      else out.slot = free;
    }

    if (err) out.promoError = err;
    else {
      out.promo = p;
      if (p.kind === 'percent') {
        // whole pounds only, rounded down
        let d = Math.floor((cart.subtotal * p.value) / 100 / 100) * 100;
        if (p.max_discount > 0) d = Math.min(d, p.max_discount);
        out.discount = d;
      } else if (p.kind === 'fixed') {
        out.discount = Math.min(p.value, cart.subtotal);
      } else {
        out.deliveryWaived += out.deliveryFee;
        out.deliveryFee = 0;
      }
    }
  }

  out.addressKey = addrKey;
  out.total = cart.subtotal - out.discount + out.deliveryFee;
  return out;
}

/**
 * Reserves a promo use against the overall limit before the order is written.
 * Atomic: two orders can't take the last use. Returns false when it's used up.
 */
export async function reservePromo(promoId) {
  const row = await DB().prepare(
    'UPDATE promos SET uses = uses + 1 WHERE id = ? AND active = 1 AND (max_uses = 0 OR uses < max_uses) RETURNING id',
  ).bind(promoId).first();
  return !!row;
}

export const unreservePromo = (promoId) =>
  DB().prepare('UPDATE promos SET uses = MAX(uses - 1, 0) WHERE id = ?').bind(promoId).run();

/**
 * Gives an order's welcome claim and code use back (order cancelled or never paid),
 * so the customer can use them on a later order. Safe to call twice.
 */
export async function releasePerks(orderId) {
  const claimed = await DB().prepare(
    "UPDATE orders SET perks_released = 1 WHERE id = ? AND perks_released = 0 AND (welcome = 1 OR promo_code != '') RETURNING id",
  ).bind(orderId).first();
  if (!claimed) return;
  await DB().batch([
    DB().prepare('UPDATE promos SET uses = MAX(uses - 1, 0) WHERE id IN (SELECT promo_id FROM promo_uses WHERE order_id = ?)').bind(orderId),
    DB().prepare('DELETE FROM promo_uses WHERE order_id = ?').bind(orderId),
    DB().prepare('DELETE FROM welcome_claims WHERE order_id = ?').bind(orderId),
  ]);
}

/**
 * An order taken back out of "cancelled": claim its offers again if nobody else took them meanwhile.
 * Best effort; the order keeps the price it was placed at either way.
 */
export async function reclaimPerks(order) {
  if (!order.perks_released) return;
  const stmts = [DB().prepare('UPDATE orders SET perks_released = 0 WHERE id = ?').bind(order.id)];
  if (order.welcome) {
    stmts.push(DB().prepare('INSERT OR IGNORE INTO welcome_claims (phone, address_key, device, order_id) VALUES (?, ?, ?, ?)')
      .bind(order.phone, addressKey(order.address), order.device || null, order.id));
  }
  if (order.promo_code) {
    const p = await getPromoByCode(order.promo_code);
    if (p) {
      stmts.push(DB().prepare('INSERT INTO promo_uses (promo_id, order_id, phone, slot) VALUES (?, ?, ?, NULL)').bind(p.id, order.id, order.phone));
      stmts.push(DB().prepare('UPDATE promos SET uses = uses + 1 WHERE id = ?').bind(p.id));
    }
  }
  await DB().batch(stmts);
}

/** Online orders still unpaid after 2 hours give their offers back */
export async function releaseAbandoned() {
  const { results } = await DB().prepare(`
    SELECT id FROM orders
    WHERE payment_method = 'online' AND payment_status IN ('pending', 'failed') AND perks_released = 0
      AND (welcome = 1 OR promo_code != '') AND created_at < datetime('now', '-2 hours')
    LIMIT 20`).all();
  for (const r of results) await releasePerks(r.id);
}

// Simple brake on guessing codes: 20 wrong codes from one address in 15 minutes
const LIMIT = 20;
export async function promoGuessBlocked(ip) {
  if (!ip) return false;
  return Number((await env.SESSION?.get(`promo-miss:${ip}`)) || 0) >= LIMIT;
}
export async function recordPromoMiss(ip) {
  if (!ip) return;
  const key = `promo-miss:${ip}`;
  const n = Number((await env.SESSION?.get(key)) || 0) + 1;
  await env.SESSION?.put(key, String(n), { expirationTtl: 900 });
}
