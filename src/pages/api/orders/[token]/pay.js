// POST /api/orders/<token>/pay: start a new online payment for an order whose payment failed
import { getOrderByToken } from '../../../../lib/orders.js';
import { startPayment } from '../../../../lib/paymob.js';
import { href } from '../../../../lib/i18n.js';

export async function POST({ params, request, redirect }) {
  const order = await getOrderByToken(params.token);
  if (!order) return new Response('not found', { status: 404 });
  const back = href(order.lang, `/order/${order.token}`);
  if (order.payment_method !== 'online' || order.payment_status === 'paid' || order.status === 'cancelled') return redirect(back, 303);

  const pay = await startPayment(order, new URL(request.url).origin);
  return redirect(pay.url || back, 303);
}
