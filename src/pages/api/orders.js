// POST /api/orders: place an order from the checkout page
import { createOrder } from '../../lib/orders.js';
import { href, t } from '../../lib/i18n.js';
import { egp } from '../../lib/money.js';
import { deviceId } from '../../lib/device.js';
import { startPayment } from '../../lib/paymob.js';
import { notifyNewOrder } from '../../lib/notify.js';

export async function POST({ request, locals, cookies, url }) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'generic' }, { status: 400 }); }

  // the device comes from the site's own cookie, never from the request body
  const device = deviceId({ cookies, url });
  const result = await createOrder({ ...body, device: device.isNew ? null : device.id });
  if (result.error) {
    if (result.error === 'promo') {
      const lang = body.lang === 'en' ? 'en' : 'ar';
      result.text = t(lang, `checkout.promo.err.${result.reason}`).replace('{min}', egp(result.min || 0, lang));
    }
    return Response.json(result, { status: 422 });
  }

  const { order } = result;
  locals.cfContext?.waitUntil?.(notifyNewOrder(order, new URL(request.url).origin));

  if (order.payment_method === 'online') {
    const pay = await startPayment(order, new URL(request.url).origin);
    if (pay.error) return Response.json({ error: 'payment', redirect: href(order.lang, `/order/${order.token}`) }, { status: 502 });
    return Response.json({ redirect: pay.url, token: order.token });
  }
  return Response.json({ redirect: href(order.lang, `/order/${order.token}`), token: order.token });
}
