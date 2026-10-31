// POST /api/cart/quote: price a cart from the database (names, line totals, delivery, total)
import { priceCart } from '../../../lib/cart.js';
import { egp } from '../../../lib/money.js';

export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return new Response('bad json', { status: 400 }); }
  const lang = body.lang === 'en' ? 'en' : 'ar';
  const fulfilment = body.fulfilment === 'delivery' ? 'delivery' : 'pickup';
  const q = await priceCart(body.lines, { fulfilment, lang });

  return Response.json({
    lines: q.lines.map((l) => ({ ...l, unitText: egp(l.unit, lang), totalText: egp(l.total, lang) })),
    problems: q.problems,
    subtotal: q.subtotal,
    deliveryFee: q.deliveryFee,
    total: q.total,
    subtotalText: egp(q.subtotal, lang),
    deliveryFeeText: q.deliveryFee ? egp(q.deliveryFee, lang) : '',
    totalText: egp(q.total, lang),
  });
}
