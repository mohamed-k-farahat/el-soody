// POST /api/cart/quote: price a cart from the database (names, line totals, offers, delivery, total)
import { priceCart } from '../../../lib/cart.js';
import { applyOffers, promoGuessBlocked, recordPromoMiss } from '../../../lib/offers.js';
import { normalizePhone } from '../../../lib/orders.js';
import { t } from '../../../lib/i18n.js';
import { egp } from '../../../lib/money.js';

export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return new Response('bad json', { status: 400 }); }
  const lang = body.lang === 'en' ? 'en' : 'ar';
  const fulfilment = body.fulfilment === 'delivery' ? 'delivery' : 'pickup';
  const q = await priceCart(body.lines, { fulfilment, lang });

  const ip = request.headers.get('cf-connecting-ip') || '';
  let code = String(body.promo || '').slice(0, 40);
  let blocked = false;
  if (code.trim() && (await promoGuessBlocked(ip))) { code = ''; blocked = true; }

  const o = await applyOffers(q, { fulfilment, phone: normalizePhone(body.phone), address: String(body.address || ''), code });
  if (o.promoError === 'unknown') await recordPromoMiss(ip);
  const promoError = blocked ? 'toomany' : o.promoError;

  return Response.json({
    lines: q.lines.map((l) => ({ ...l, unitText: egp(l.unit, lang), totalText: egp(l.total, lang) })),
    problems: q.problems,
    subtotal: q.subtotal,
    deliveryFee: o.deliveryFee,
    deliveryFeeBefore: q.deliveryFee,
    discount: o.discount,
    welcome: o.welcome,
    welcomeOffered: q.settings.welcome_enabled === '1',
    promo: o.promo ? { code: o.promo.code, kind: o.promo.kind } : null,
    promoError,
    promoErrorText: promoError ? t(lang, `checkout.promo.err.${promoError}`).replace('{min}', egp(o.promoMin, lang)) : '',
    total: o.total,
    subtotalText: egp(q.subtotal, lang),
    deliveryFeeText: o.deliveryFee ? egp(o.deliveryFee, lang) : '',
    deliveryFeeBeforeText: q.deliveryFee ? egp(q.deliveryFee, lang) : '',
    discountText: o.discount ? egp(o.discount, lang) : '',
    totalText: egp(o.total, lang),
  });
}
