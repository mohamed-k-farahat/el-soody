// Database access (Cloudflare D1). Every query the site and admin need lives here.
import { env } from 'cloudflare:workers';

export const DB = () => env.DB;

export const ROAST_ORDER = ['light', 'medium', 'dark'];
export const SIZES = [125, 250, 1000];
export const SECTIONS = ['plain', 'spiced', 'french'];

const split = (s) => (s ? s.split(',').filter(Boolean) : []);
const parseList = (s) => { try { return JSON.parse(s || '[]'); } catch { return []; } };

export function mapProduct(r) {
  if (!r) return null;
  return {
    ...r,
    roasts: split(r.roasts),
    story_ar: parseList(r.story_ar),
    story_en: parseList(r.story_en),
    photos: parseList(r.photos),
    in_book: !!r.in_book,
    active: !!r.active,
  };
}

export function mapItem(r) {
  return {
    ...r,
    roasts: split(r.roasts),
    available: !!r.available,
    prices: { 125: r.price_125, 250: r.price_250, 1000: r.price_1000 },
  };
}

/** value of a localized column, e.g. loc(p, 'name', 'en') -> p.name_en (falls back to Arabic) */
export const loc = (row, field, lang) => row[`${field}_${lang}`] || row[`${field}_ar`] || '';

export async function getSettings() {
  const { results } = await DB().prepare('SELECT key, value FROM settings').all();
  const s = Object.fromEntries(results.map((r) => [r.key, r.value]));
  const num = (k) => Number(s[k] || 0);
  return {
    ...s,
    pickup: s.pickup_enabled === '1',
    delivery: s.delivery_enabled === '1',
    cod: s.cod_enabled === '1',
    online: s.online_enabled === '1',
    deliveryFee: num('delivery_fee'),
    freeDeliveryOver: num('free_delivery_over'),
    // spice blend add-on for plain coffee, in piasters (empty when switched off)
    spiceAddons: s.spice_addon_enabled === '1'
      ? String(s.spice_addon_prices || '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0)
      : [],
  };
}

export async function setSettings(values) {
  const stmt = DB().prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  await DB().batch(Object.entries(values).map(([k, v]) => stmt.bind(k, String(v ?? ''))));
}

export async function getProducts({ includeInactive = false } = {}) {
  const where = includeInactive ? '' : 'WHERE active = 1';
  const { results } = await DB().prepare(`SELECT * FROM products ${where} ORDER BY sort, id`).all();
  return results.map(mapProduct);
}

export async function getProduct(slugOrId, { includeInactive = false } = {}) {
  const col = typeof slugOrId === 'number' ? 'id' : 'slug';
  const row = await DB().prepare(`SELECT * FROM products WHERE ${col} = ?${includeInactive ? '' : ' AND active = 1'}`).bind(slugOrId).first();
  return mapProduct(row);
}

export async function getItems({ productId, includeUnavailable = false } = {}) {
  const conds = [];
  const binds = [];
  if (productId) { conds.push('i.product_id = ?'); binds.push(productId); }
  if (!includeUnavailable) conds.push('i.available = 1 AND p.active = 1');
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const { results } = await DB()
    .prepare(`SELECT i.* FROM items i JOIN products p ON p.id = i.product_id ${where} ORDER BY i.sort, i.id`)
    .bind(...binds).all();
  return results.map(mapItem);
}

export async function getGrinds({ includeInactive = false } = {}) {
  const { results } = await DB().prepare(`SELECT * FROM grinds ${includeInactive ? '' : 'WHERE active = 1'} ORDER BY sort, id`).all();
  return results;
}

export async function getBranches({ includeInactive = false } = {}) {
  const where = includeInactive ? '' : 'WHERE active = 1';
  return (await DB().prepare(`SELECT * FROM branches ${where} ORDER BY sort, id`).all()).results;
}

export async function getSeo(page) {
  return (await DB().prepare('SELECT * FROM seo_pages WHERE page = ?').bind(page).first()) || {};
}

/** The printed menu: every available row grouped by section, with product names. */
export async function getMenu() {
  const { results } = await DB().prepare(`
    SELECT i.*, p.slug, p.name_ar, p.name_en
    FROM items i JOIN products p ON p.id = i.product_id
    WHERE i.available = 1 AND p.active = 1
    ORDER BY i.sort, i.id`).all();
  const menu = { plain: [], spiced: [], french: [] };
  for (const r of results) (menu[r.section] ||= []).push(mapItem(r));
  return menu;
}

/** Lowest available price of a product, for "from" labels in the store. */
export function lowestPrice(items) {
  let min = null;
  for (const it of items) for (const s of SIZES) {
    const p = it.prices[s];
    if (p != null && (min === null || p < min)) min = p;
  }
  return min;
}
