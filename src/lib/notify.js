// New order alert for the owner, sent to every address in the "order_email" setting (comma separated).
// Sent through Resend (secret RESEND_API_KEY, optionally RESEND_API_KEY_2). Without a verified domain, Resend only delivers to the
// address the Resend account was opened with; the other addresses start working once the shop's domain is
// verified there (then set ORDER_MAIL_FROM to an address on that domain).
// Alternative: Cloudflare Email Routing (a "send_email" binding named ORDER_MAIL plus ORDER_MAIL_FROM).
// If neither is set this does nothing; new orders still show with a badge in the admin panel.
import { env } from 'cloudflare:workers';
import { getSettings } from './db.js';
import { egp } from './money.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// lower case: Resend matches an account's own address case-sensitively, and email addresses don't care
export function orderEmailList(value) {
  return String(value || '').toLowerCase().split(/[\s,;]+/).filter((a) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a));
}

function compose(order, origin) {
  const where = order.fulfilment === 'delivery'
    ? `توصيل إلى: ${order.address}`
    : `استلام من المحل${order.branch_name_ar ? `: ${order.branch_name_ar}` : ''}`;
  const pay = order.payment_method === 'cod' ? 'كاش عند الاستلام' : 'أونلاين (مستني الدفع)';
  const items = order.items.map((i) => `${i.qty} × ${i.name} (${i.details}) ${i.size} جم = ${egp(i.line_total, 'ar')}`);
  const extras = [
    ...(order.discount ? [`خصم (${order.promo_code}): ${egp(order.discount, 'ar')}`] : []),
    ...(order.welcome ? ['توصيل مجاني: أول طلب توصيل'] : order.delivery_waived ? [`توصيل مجاني بكود ${order.promo_code}`] : []),
    ...(order.fulfilment === 'delivery' && order.delivery_fee && !order.welcome && !order.delivery_waived ? [`التوصيل: ${egp(order.delivery_fee, 'ar')}`] : []),
  ];
  const link = origin ? `${origin}/admin/orders/${order.id}` : '';
  const head = [`طلب جديد ${order.code}`, `${order.name}  ${order.phone}`, where, `الدفع: ${pay}`];

  const text = [
    ...head, '', ...items, '', ...extras, `الإجمالي: ${egp(order.total, 'ar')}`,
    ...(order.notes ? [`ملاحظات: ${order.notes}`] : []),
    ...(link ? ['', `افتح الطلب: ${link}`] : []),
  ].join('\n');

  const row = (s) => `<p style="margin:.2em 0">${esc(s)}</p>`;
  const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:15px;line-height:1.6;color:#2b1a10">
<h2 style="margin:0 0 .4em;color:#a8541c">طلب جديد ${esc(order.code)}</h2>
${row(`${order.name}  `)}<p style="margin:.2em 0" dir="ltr" align="right"><a href="tel:${esc(order.phone)}">${esc(order.phone)}</a></p>
${row(where)}${row(`الدفع: ${pay}`)}
<hr style="border:0;border-top:1px solid #e5d6c0">
${items.map(row).join('')}
<hr style="border:0;border-top:1px solid #e5d6c0">
${extras.map(row).join('')}<p style="margin:.2em 0;font-weight:bold">الإجمالي: ${esc(egp(order.total, 'ar'))}</p>
${order.notes ? row(`ملاحظات: ${order.notes}`) : ''}
${link ? `<p style="margin:1em 0 0"><a href="${esc(link)}" style="background:#a8541c;color:#fff;padding:.5em 1.2em;border-radius:6px;text-decoration:none">افتح الطلب</a></p>` : ''}
</div>`;

  return { subject: `طلب جديد ${order.code}: ${egp(order.total, 'ar')}`, text, html };
}

// Without a domain each Resend account only delivers to its own address, so with one account per address
// (RESEND_API_KEY, RESEND_API_KEY_2) an address one account refuses (403) is tried with the next.
async function sendResend(to, mail) {
  const keys = [env.RESEND_API_KEY, env.RESEND_API_KEY_2].filter(Boolean);
  for (const [n, key] of keys.entries()) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: `El Soody Store <${env.ORDER_MAIL_FROM || 'onboarding@resend.dev'}>`, to: [to], ...mail }),
    });
    if (res.ok) return;
    if (res.status === 403 && n < keys.length - 1) continue;
    console.error('order email failed', to, res.status, await res.text());
    return;
  }
}

async function sendCloudflare(to, mail) {
  const { EmailMessage } = await import('cloudflare:email');
  const raw = [
    `From: El Soody Store <${env.ORDER_MAIL_FROM}>`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(mail.subject)))}?=`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    mail.text,
  ].join('\r\n');
  await env.ORDER_MAIL.send(new EmailMessage(env.ORDER_MAIL_FROM, to, raw));
}

export async function notifyNewOrder(order, origin) {
  try {
    const to = orderEmailList((await getSettings()).order_email);
    const send = env.RESEND_API_KEY ? sendResend : env.ORDER_MAIL && env.ORDER_MAIL_FROM ? sendCloudflare : null;
    if (!send || !to.length) return;
    const mail = compose(order, origin);
    // one email per address, so an address the sender can't reach yet doesn't block the others
    await Promise.all(to.map((a) => send(a, mail).catch((e) => console.error('order email failed', a, e))));
  } catch (e) {
    console.error('order email failed', e);
  }
}
