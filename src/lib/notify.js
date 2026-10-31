// New order alert for the owner.
// Uses Cloudflare Email Routing (a "send_email" binding named ORDER_MAIL) once the shop's domain is on Cloudflare.
// Until then this does nothing; new orders still show with a badge in the admin panel.
import { env } from 'cloudflare:workers';
import { getSettings } from './db.js';
import { egp } from './money.js';

export async function notifyNewOrder(order) {
  try {
    const settings = await getSettings();
    if (!env.ORDER_MAIL || !settings.order_email || !env.ORDER_MAIL_FROM) return;

    const lines = order.items.map((i) => `${i.qty} × ${i.name} (${i.details}) ${i.size} g = ${egp(i.line_total, 'en')}`);
    const text = [
      `New order ${order.code}`,
      `${order.name}  ${order.phone}`,
      order.fulfilment === 'delivery' ? `Delivery to: ${order.address}` : `Pickup at the shop${order.branch_name_en ? `: ${order.branch_name_en} (${order.branch_name_ar})` : ''}`,
      `Payment: ${order.payment_method === 'cod' ? 'cash on delivery' : 'online'}`,
      '',
      ...lines,
      '',
      ...(order.discount ? [`Discount (${order.promo_code}): ${egp(order.discount, 'en')}`] : []),
      ...(order.welcome ? ['Free delivery: first delivery order'] : order.delivery_waived ? [`Free delivery with code ${order.promo_code}`] : []),
      `Total: ${egp(order.total, 'en')}`,
      order.notes ? `Notes: ${order.notes}` : '',
    ].join('\n');

    const { EmailMessage } = await import('cloudflare:email');
    const raw = [
      `From: El Soody Store <${env.ORDER_MAIL_FROM}>`,
      `To: ${settings.order_email}`,
      `Subject: New order ${order.code}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      text,
    ].join('\r\n');
    await env.ORDER_MAIL.send(new EmailMessage(env.ORDER_MAIL_FROM, settings.order_email, raw));
  } catch (e) {
    console.error('order email failed', e);
  }
}
