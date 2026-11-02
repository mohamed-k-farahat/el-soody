// The orders behind the dashboard, as a CSV file that opens in Excel (same period and filters).
import { DB } from '../../lib/db.js';
import { readFilters, exportQuery } from '../../lib/dashboard.js';
import { STATUS_AR, PAY_AR } from '../../lib/admin.js';

const when = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const cairo = (sqlUtc) => when.format(new Date(`${sqlUtc.replace(' ', 'T')}Z`)).replace(',', '');
const pounds = (p) => (p || 0) / 100;
// a cell starting with = + - @ would run as a formula in Excel, so it gets a leading apostrophe
const cell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
// phone numbers stay text in Excel so the leading 0 isn't dropped (they are digits only, checked at checkout)
const phone = (p) => (/^\d+$/.test(p) ? `"=""${p}"""` : cell(p));

export async function GET({ url }) {
  const { f, r } = await readFilters(url.searchParams);
  const sql = exportQuery(f, r);
  const [orders, items] = await DB().batch([
    DB().prepare(sql),
    DB().prepare(`SELECT order_id, name, details, size, qty FROM order_items WHERE order_id IN (SELECT id FROM (${sql})) ORDER BY id`),
  ]);
  const lines = new Map();
  for (const it of items.results) {
    if (!lines.has(it.order_id)) lines.set(it.order_id, []);
    lines.get(it.order_id).push(`${it.qty} × ${it.name} ${it.size} جم${it.details ? ` (${it.details})` : ''}`);
  }

  const head = ['رقم الطلب', 'الوقت', 'الحالة', 'الاستلام', 'فرع الاستلام', 'الدفع', 'حالة الدفع', 'الاسم', 'الموبايل', 'العنوان',
    'الأصناف', 'كود الخصم', 'الخصم', 'التوصيل', 'الإجمالي', 'ملاحظات'];
  const rows = orders.results.map((o) => [
    o.code, cairo(o.created_at), STATUS_AR[o.status] || o.status, o.fulfilment === 'delivery' ? 'توصيل' : 'من المحل', o.branch_name || '',
    o.payment_method === 'cod' ? 'كاش' : 'أونلاين', PAY_AR[o.payment_status] || o.payment_status, o.name, o.phone, o.address,
    (lines.get(o.id) || []).join('، '), o.promo_code || (o.welcome ? 'توصيل مجاني لأول طلب' : ''), pounds(o.discount), pounds(o.delivery_fee), pounds(o.total), o.notes,
  ]);
  // the BOM tells Excel the file is UTF-8, so Arabic shows correctly
  const csv = '﻿' + [head.map(cell), ...rows.map((row) => row.map((v, i) => (i === 8 ? phone(v) : cell(v))))].map((row) => row.join(',')).join('\r\n');
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="el-soody-orders-${r.a}-to-${r.b}.csv"`,
    },
  });
}
