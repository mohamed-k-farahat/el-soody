// Server side cart pricing. The browser only sends what was chosen; every price comes from the database.
import { DB, mapItem, getSettings, getGrinds, loc } from './db.js';
import { t } from './i18n.js';
import { egp } from './money.js';
import { imageUrl, storePhotos } from './images.js';

const MAX_QTY = 50;
const MAX_LINES = 40;

/**
 * lines: [{ item: id, size: 125|250|1000, roast: 'light'|'' , grind: id|0, qty }]
 * returns { lines, subtotal, deliveryFee, total, problems }
 */
export async function priceCart(rawLines, { fulfilment = 'pickup', lang = 'ar' } = {}) {
  const problems = [];
  const input = Array.isArray(rawLines) ? rawLines.slice(0, MAX_LINES) : [];
  const ids = [...new Set(input.map((l) => Number(l?.item)).filter(Number.isInteger))];

  const itemRows = ids.length
    ? (await DB().prepare(`
        SELECT i.*, p.slug, p.name_ar, p.name_en, p.image, p.photos, p.kind AS product_kind, p.active AS product_active, p.id AS pid
        FROM items i JOIN products p ON p.id = i.product_id
        WHERE i.id IN (${ids.map(() => '?').join(',')})`).bind(...ids).all()).results
    : [];
  const items = Object.fromEntries(itemRows.map((r) => [r.id, {
    ...mapItem(r), product_active: r.product_active, product_kind: r.product_kind,
    // the cart shows the product's store photo (the book has its own pictures)
    thumb: imageUrl(storePhotos({ image: r.image, photos: JSON.parse(r.photos || '[]') })[0]),
  }]));
  const grinds = Object.fromEntries((await getGrinds()).map((g) => [g.id, g]));
  const settings = await getSettings();

  const lines = [];
  for (const raw of input) {
    const it = items[Number(raw?.item)];
    const size = Number(raw?.size);
    const qty = Math.floor(Number(raw?.qty));
    const roast = String(raw?.roast || '');
    const grindId = Number(raw?.grind || 0);
    const spice = Number(raw?.spice || 0);
    const key = `${raw?.item}|${size}|${roast}|${grindId}|${spice}`;

    if (!it || !it.available || !it.product_active) { problems.push({ key, reason: 'unavailable' }); continue; }
    const unit = it.prices[size];
    if (unit == null) { problems.push({ key, reason: 'size' }); continue; }
    if (it.roasts.length ? !it.roasts.includes(roast) : roast !== '') { problems.push({ key, reason: 'roast' }); continue; }
    if (grindId && !grinds[grindId]) { problems.push({ key, reason: 'grind' }); continue; }
    if (!(qty >= 1 && qty <= MAX_QTY)) { problems.push({ key, reason: 'qty' }); continue; }
    // the spice blend add-on: plain coffee only, one of the amounts set in admin, any weight
    if (spice && !(it.section === 'plain' && it.product_kind === 'coffee' && settings.spiceOptions.includes(spice))) { problems.push({ key, reason: 'spice' }); continue; }

    const details = [
      t(lang, `section.${it.section}`),
      loc(it, 'label', lang),
      roast && t(lang, `roast.${roast}`),
      grindId ? loc(grinds[grindId], 'name', lang) : '',
      spice ? t(lang, 'spice.addon').replace('{p}', egp(spice, lang)) : '',
    ].filter(Boolean).join(lang === 'ar' ? '، ' : ', ');

    lines.push({
      key, item: it.id, productId: it.pid, slug: it.slug, image: it.thumb, section: it.section,
      name: loc(it, 'name', lang), details, size, roast, grind: grindId, spice,
      qty, unit: unit + spice, total: (unit + spice) * qty,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  let deliveryFee = 0;
  if (fulfilment === 'delivery') {
    const free = settings.freeDeliveryOver > 0 && subtotal >= settings.freeDeliveryOver;
    deliveryFee = free ? 0 : settings.deliveryFee;
  }
  return { lines, subtotal, deliveryFee, total: subtotal + deliveryFee, problems, settings };
}
