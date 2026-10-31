// Creating and reading orders.
import { DB, getSettings } from './db.js';
import { priceCart } from './cart.js';

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

  const cart = await priceCart(input.lines, { fulfilment, lang });
  if (!cart.lines.length) return { error: 'empty' };
  if (cart.problems.length) return { error: 'changed' };

  const counter = await DB()
    .prepare("UPDATE settings SET value = CAST(value AS INTEGER) + 1 WHERE key = 'next_order_number' RETURNING value")
    .first();
  const code = `S${Number(counter.value) - 1}`;
  const token = crypto.randomUUID().replace(/-/g, '');

  const insertOrder = DB().prepare(`
    INSERT INTO orders (code, token, fulfilment, payment_method, payment_status, name, phone, address, notes, lang, subtotal, delivery_fee, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(code, token, fulfilment, payment, payment === 'online' ? 'pending' : 'unpaid',
      name, phone, fulfilment === 'delivery' ? address : '', notes, lang,
      cart.subtotal, cart.deliveryFee, cart.total);
  const insertItem = DB().prepare(`
    INSERT INTO order_items (order_id, product_id, item_id, name, details, size, qty, unit_price, line_total)
    VALUES ((SELECT id FROM orders WHERE token = ?), ?, ?, ?, ?, ?, ?, ?, ?)`);
  // one transaction: the order and all its lines are saved together or not at all
  await DB().batch([
    insertOrder,
    ...cart.lines.map((l) => insertItem.bind(token, l.productId, l.item, l.name, l.details, l.size, l.qty, l.unit, l.total)),
  ]);

  return { order: await getOrderByToken(token) };
}

export async function getOrderByToken(token) {
  if (!/^[a-f0-9]{32}$/.test(String(token))) return null;
  const order = await DB().prepare('SELECT * FROM orders WHERE token = ?').bind(token).first();
  if (!order) return null;
  const { results } = await DB().prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').bind(order.id).all();
  return { ...order, items: results };
}

export async function getOrderById(id) {
  const order = await DB().prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  if (!order) return null;
  const { results } = await DB().prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').bind(order.id).all();
  return { ...order, items: results };
}
