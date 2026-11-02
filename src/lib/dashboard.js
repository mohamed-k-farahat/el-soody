// The admin dashboard: sales for a date range, sliced by the filters on the page.
// Days and hours are Cairo time; orders are stored in UTC (SQLite datetime('now')).
// Every filter value is checked against a fixed list or the database before it goes into SQL.
import { DB } from './db.js';
import { normalizeCode } from './offers.js';
import { t } from './i18n.js';
import { STATUS_AR } from './admin.js';

const DAY = 86400000;

export const PRESETS = {
  today: 'النهارده', yesterday: 'امبارح', '7d': 'آخر 7 أيام', '30d': 'آخر 30 يوم', '90d': 'آخر 90 يوم',
  month: 'الشهر ده', lastmonth: 'الشهر اللي فات', year: 'السنة دي', all: 'من أول يوم', custom: 'فترة تختارها',
};
export const MEASURES = { rev: 'المبيعات', orders: 'عدد الطلبات', kg: 'الكمية (كيلو)' };
export const SCOPES = {
  valid: { label: 'كل الطلبات ماعدا الملغية', sql: "o.status != 'cancelled' AND NOT (o.payment_method = 'online' AND o.payment_status IN ('pending', 'failed'))" },
  completed: { label: 'اللي اتسلمت بس', sql: "o.status = 'completed'" },
  open: { label: 'اللي لسه شغالين عليها', sql: "o.status IN ('new', 'confirmed', 'preparing', 'ready', 'out')" },
  cancelled: { label: 'الملغية بس', sql: "o.status = 'cancelled'" },
  all: { label: 'كل الطلبات حتى الملغية', sql: '1 = 1' },
};
export const FULFILMENT = { pickup: 'استلام من المحل', delivery: 'توصيل' };
export const PAYMENT = { cod: 'كاش', online: 'أونلاين' };
export const SIZES = { 125: 'تُمن (125 جم)', 250: 'ربع (250 جم)', 1000: 'كيلو' };
export const SECTIONS = ['plain', 'spiced', 'french'];
export const ROASTS = ['light', 'medium', 'dark'];
// the Egyptian week starts on Saturday
export const WEEKDAYS = ['السبت', 'الحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة'];
const WD = { Sat: 0, Sun: 1, Mon: 2, Tue: 3, Wed: 4, Thu: 5, Fri: 6 };

// ---------- Cairo time ----------
const partsFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short',
});
export function cairoParts(ms) {
  const p = Object.fromEntries(partsFmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { ymd: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, wd: WD[p.weekday] };
}
/** The UTC instant a Cairo day starts (Egypt is UTC+2, or +3 in summer time) */
function cairoMidnight(ymd) {
  const base = Date.parse(`${ymd}T00:00:00Z`);
  for (const off of [2, 3]) {
    const ms = base - off * 3600000;
    const p = cairoParts(ms);
    if (p.ymd === ymd && p.hour === 0) return ms;
  }
  return base - 2 * 3600000; // summer time starts at midnight, so that day starts at 01:00
}
const sqlTime = (ms) => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
export const addDays = (ymd, n) => new Date(Date.parse(`${ymd}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);
const isYmd = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !Number.isNaN(Date.parse(s));

function dateRange(f, today, firstDay) {
  let a = today, b = today;
  switch (f.range) {
    case 'today': break;
    case 'yesterday': a = b = addDays(today, -1); break;
    case '7d': a = addDays(today, -6); break;
    case '90d': a = addDays(today, -89); break;
    case 'month': a = `${today.slice(0, 8)}01`; break;
    case 'lastmonth': b = addDays(`${today.slice(0, 8)}01`, -1); a = `${b.slice(0, 8)}01`; break;
    case 'year': a = `${today.slice(0, 4)}-01-01`; break;
    case 'all': a = firstDay && firstDay < today ? firstDay : today; break;
    case 'custom':
      a = isYmd(f.from) ? f.from : addDays(today, -29);
      b = isYmd(f.to) ? f.to : today;
      if (b > today) b = today;
      if (a > b) [a, b] = [b, a];
      break;
    default: a = addDays(today, -29);
  }
  const days = daysBetween(a, b) + 1;
  const pa = addDays(a, -days), pb = addDays(a, -1);
  return {
    a, b, days, pa, pb,
    start: sqlTime(cairoMidnight(a)), end: sqlTime(cairoMidnight(addDays(b, 1))), prevStart: sqlTime(cairoMidnight(pa)),
    grain: days <= 2 ? 'hour' : days <= 92 ? 'day' : 'month',
  };
}

// ---------- filters ----------
/** Reads the filters from the page URL; anything unknown is dropped */
export async function readFilters(sp) {
  const [branches, products, grinds, promos, first] = await DB().batch([
    DB().prepare('SELECT id, name_ar FROM branches ORDER BY sort, id'),
    DB().prepare('SELECT id, name_ar, kind FROM products ORDER BY kind, sort, id'),
    DB().prepare('SELECT id, name_ar FROM grinds ORDER BY sort, id'),
    DB().prepare("SELECT DISTINCT promo_code AS code FROM orders WHERE promo_code != '' ORDER BY code"),
    DB().prepare('SELECT MIN(created_at) AS t FROM orders'),
  ]);
  const opts = { branches: branches.results, products: products.results, grinds: grinds.results, promos: promos.results.map((r) => r.code) };
  const int = (k, list) => { const n = Number(sp.get(k)); return list.some((x) => x.id === n) ? n : null; };
  const pick = (k, allowed) => (allowed.includes(sp.get(k)) ? sp.get(k) : '');
  const promoRaw = sp.get('promo') || '';
  const code = normalizeCode(promoRaw);
  const f = {
    range: PRESETS[sp.get('range')] ? sp.get('range') : '30d',
    from: sp.get('from') || '', to: sp.get('to') || '',
    m: MEASURES[sp.get('m')] ? sp.get('m') : 'rev',
    status: SCOPES[sp.get('status')] ? sp.get('status') : 'valid',
    fulfilment: pick('fulfilment', Object.keys(FULFILMENT)),
    payment: pick('payment', Object.keys(PAYMENT)),
    branch: int('branch', opts.branches),
    product: int('product', opts.products),
    section: pick('section', SECTIONS),
    size: Number(pick('size', Object.keys(SIZES))) || null,
    grind: int('grind', opts.grinds),
    roast: pick('roast', ROASTS),
    promo: ['any', 'none', 'welcome'].includes(promoRaw) ? promoRaw : opts.promos.includes(code) ? code : '',
  };
  const today = cairoParts(Date.now()).ymd;
  const firstDay = first.results[0]?.t ? cairoParts(Date.parse(`${first.results[0].t.replace(' ', 'T')}Z`)).ymd : null;
  return { f, opts, r: dateRange(f, today, firstDay), today };
}

/** The filters as URL parameters, with some changed (null removes one) */
export function filterQuery(f, changes = {}) {
  const all = { ...f, ...changes };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(all)) {
    if (v === null || v === '' || v === undefined) continue;
    if ((k === 'from' || k === 'to') && all.range !== 'custom') continue;
    if ((k === 'range' && v === '30d') || (k === 'm' && v === 'rev') || (k === 'status' && v === 'valid')) continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// ---------- SQL ----------
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const and = (c) => (c.length ? c.join(' AND ') : '1 = 1');

/** Conditions on an order line (alias oi); `skip` leaves one filter out, so a breakdown isn't filtered by itself */
function lineConds(f, skip) {
  const c = [];
  if (f.product && skip !== 'product') c.push(`oi.product_id = ${f.product}`);
  if (f.section && skip !== 'section') c.push(`oi.section = ${q(f.section)}`);
  if (f.size && skip !== 'size') c.push(`oi.size = ${f.size}`);
  if (f.grind && skip !== 'grind') c.push(`oi.grind_id = ${f.grind}`);
  if (f.roast && skip !== 'roast') c.push(`oi.roast = ${q(f.roast)}`);
  return c;
}
function orderConds(f, skip, withLines = true) {
  const c = [];
  if (skip !== 'status') c.push(`(${SCOPES[f.status].sql})`);
  if (f.fulfilment && skip !== 'fulfilment') c.push(`o.fulfilment = ${q(f.fulfilment)}`);
  if (f.payment && skip !== 'payment') c.push(`o.payment_method = ${q(f.payment)}`);
  if (f.branch && skip !== 'branch') c.push(`o.branch_id = ${f.branch}`);
  if (f.promo && skip !== 'promo') {
    c.push(f.promo === 'any' ? "o.promo_code != ''" : f.promo === 'none' ? "o.promo_code = ''" : f.promo === 'welcome' ? 'o.welcome = 1' : `o.promo_code = ${q(f.promo)}`);
  }
  const lc = lineConds(f, skip);
  if (withLines && lc.length) c.push(`EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND ${and(lc)})`);
  return c;
}
/** An order's sales: its total, or only its matching lines while a product, style, weight, grind or roast is picked */
function revenue(f, skip) {
  const lc = lineConds(f, skip);
  return lc.length ? `(SELECT COALESCE(SUM(oi.line_total), 0) FROM order_items oi WHERE oi.order_id = o.id AND ${and(lc)})` : 'o.total';
}
const grams = (f, skip) => `(SELECT COALESCE(SUM(oi.qty * oi.size), 0) FROM order_items oi WHERE oi.order_id = o.id AND ${and(lineConds(f, skip))})`;

export const lineFilterActive = (f) => lineConds(f).length > 0;

/** Orders for the CSV export: the same orders the dashboard counts */
export function exportQuery(f, r) {
  return `SELECT o.*, b.name_ar AS branch_name FROM orders o LEFT JOIN branches b ON b.id = o.branch_id
    WHERE o.created_at >= ${q(r.start)} AND o.created_at < ${q(r.end)} AND ${and(orderConds(f))} ORDER BY o.id`;
}

export async function loadDashboard(sp) {
  const { f, opts, r, today } = await readFilters(sp);
  const cur = `o.created_at >= ${q(r.start)} AND o.created_at < ${q(r.end)}`;
  const both = `o.created_at >= ${q(r.prevStart)} AND o.created_at < ${q(r.end)}`;
  const period = `CASE WHEN o.created_at >= ${q(r.start)} THEN 'cur' ELSE 'prev' END`;
  const rev = revenue(f), g = grams(f);

  const byOrder = (key, skip, extra = []) => `
    SELECT ${key} AS k, COUNT(*) AS orders, SUM(${revenue(f, skip)}) AS rev, SUM(${grams(f, skip)}) AS grams, SUM(o.discount) AS discount
    FROM orders o WHERE ${cur} AND ${and([...orderConds(f, skip), ...extra])} GROUP BY k`;
  const byLine = (key, skip, extra = []) => `
    SELECT ${key} AS k, COUNT(DISTINCT o.id) AS orders, SUM(oi.line_total) AS rev, SUM(oi.qty * oi.size) AS grams, SUM(oi.qty) AS units
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE ${cur} AND ${and([...orderConds(f, skip, false), ...lineConds(f, skip), ...extra])} GROUP BY k`;

  const sql = {
    kpi: `SELECT ${period} AS p, COUNT(*) AS orders, SUM(${rev}) AS rev, SUM(${g}) AS grams, COUNT(DISTINCT o.phone) AS customers,
            SUM(o.discount) AS discount, SUM(o.delivery_fee) AS fees, SUM(o.welcome) AS welcome
          FROM orders o WHERE ${both} AND ${and(orderConds(f))} GROUP BY p`,
    cancel: `SELECT ${period} AS p, COUNT(*) AS placed, SUM(o.status = 'cancelled') AS cancelled
             FROM orders o WHERE ${both} AND ${and(orderConds(f, 'status'))} GROUP BY p`,
    // customers whose first (not cancelled) order ever falls in the period
    fresh: `SELECT CASE WHEN x.first >= ${q(r.start)} THEN 'cur' ELSE 'prev' END AS p, COUNT(*) AS n
            FROM (SELECT phone, MIN(created_at) AS first FROM orders WHERE status != 'cancelled' GROUP BY phone) x
            WHERE x.first >= ${q(r.prevStart)} AND x.first < ${q(r.end)}
              AND x.phone IN (SELECT o.phone FROM orders o WHERE ${both} AND ${and(orderConds(f))}) GROUP BY p`,
    repeat: `SELECT COUNT(*) AS n FROM (SELECT o.phone FROM orders o WHERE ${cur} AND ${and(orderConds(f))} GROUP BY o.phone HAVING COUNT(*) > 1)`,
    hours: `SELECT substr(o.created_at, 1, 13) AS h, COUNT(*) AS orders, SUM(${rev}) AS rev, SUM(${g}) AS grams
            FROM orders o WHERE ${cur} AND ${and(orderConds(f))} GROUP BY h`,
    fulfilment: byOrder('o.fulfilment', 'fulfilment'),
    payment: byOrder('o.payment_method', 'payment'),
    branch: byOrder('o.branch_id', 'branch', ["o.fulfilment = 'pickup'"]),
    status: byOrder('o.status', 'status'),
    promo: byOrder("CASE WHEN o.promo_code != '' THEN o.promo_code WHEN o.welcome = 1 THEN '*welcome' ELSE '' END", 'promo'),
    product: byLine('oi.product_id', 'product'),
    section: byLine('oi.section', 'section'),
    size: byLine('oi.size', 'size'),
    grind: byLine('oi.grind_id', 'grind'),
    roast: byLine('oi.roast', 'roast'),
    spice: byLine('oi.spice', 'spice', ["oi.section = 'plain'"]), // the add-on is offered on plain coffee only
    customers: `SELECT o.phone, (SELECT o2.name FROM orders o2 WHERE o2.phone = o.phone ORDER BY o2.id DESC LIMIT 1) AS name,
                  COUNT(*) AS orders, SUM(${rev}) AS rev, SUM(${g}) AS grams, MAX(o.created_at) AS last
                FROM orders o WHERE ${cur} AND ${and(orderConds(f))} GROUP BY o.phone ORDER BY rev DESC, orders DESC LIMIT 10`,
  };
  const keys = Object.keys(sql);
  const res = await DB().batch(keys.map((k) => DB().prepare(sql[k])));
  const raw = Object.fromEntries(keys.map((k, i) => [k, res[i].results]));

  const periodRow = (rows, p) => rows.find((x) => x.p === p) || {};
  const kpi = {
    cur: periodRow(raw.kpi, 'cur'), prev: periodRow(raw.kpi, 'prev'),
    cancelCur: periodRow(raw.cancel, 'cur'), cancelPrev: periodRow(raw.cancel, 'prev'),
    freshCur: periodRow(raw.fresh, 'cur').n || 0, freshPrev: periodRow(raw.fresh, 'prev').n || 0,
    repeat: raw.repeat[0]?.n || 0,
  };

  // time series and the busy times grid, from hourly UTC buckets moved to Cairo time
  const bucketKey = (p) => (r.grain === 'hour' ? `${p.ymd} ${p.hour}` : r.grain === 'day' ? p.ymd : p.ymd.slice(0, 7));
  const series = new Map();
  if (r.grain === 'hour') for (let d = r.a; d <= r.b; d = addDays(d, 1)) for (let h = 0; h < 24; h++) series.set(`${d} ${h}`, zero());
  else if (r.grain === 'day') for (let d = r.a; d <= r.b; d = addDays(d, 1)) series.set(d, zero());
  else for (let m = r.a.slice(0, 7); m <= r.b.slice(0, 7); m = addDays(`${m}-28`, 7).slice(0, 7)) series.set(m, zero());
  const heat = Array.from({ length: 7 }, () => Array.from({ length: 24 }, zero));
  for (const row of raw.hours) {
    const p = cairoParts(Date.parse(`${row.h.replace(' ', 'T')}:00:00Z`));
    for (const target of [series.get(bucketKey(p)), heat[p.wd][p.hour]]) {
      if (!target) continue;
      target.orders += row.orders; target.rev += row.rev || 0; target.grams += row.grams || 0;
    }
  }

  // breakdown rows with names
  const names = {
    fulfilment: (k) => FULFILMENT[k] || k,
    payment: (k) => PAYMENT[k] || k,
    branch: (k) => opts.branches.find((b) => b.id === k)?.name_ar || 'فرع مش محدد',
    status: (k) => STATUS_AR[k] || k,
    promo: (k) => (k === '' ? 'من غير كود' : k === '*welcome' ? 'توصيل مجاني لأول طلب' : k),
    product: (k) => opts.products.find((p) => p.id === k)?.name_ar || 'منتج اتمسح',
    section: (k) => (k ? t('ar', `section.${k}`) : 'مش محدد'),
    size: (k) => SIZES[k] || `${k} جم`,
    grind: (k) => (k ? opts.grinds.find((x) => x.id === k)?.name_ar || 'طحنة اتمسحت' : 'من غير اختيار طحنة'),
    roast: (k) => (k ? t('ar', `roast.${k}`) : 'من غير اختيار تحميص'),
    spice: (k) => (k ? `تحويجة ${k / 100} ج.م` : 'من غير تحويجة'),
  };
  const breakdowns = Object.fromEntries(Object.keys(names).map((k) => [k, raw[k].map((row) => ({ ...row, name: names[k](row.k) }))]));

  return { f, opts, r, today, kpi, series: [...series.entries()], heat, breakdowns, customers: raw.customers };
}

function zero() { return { orders: 0, rev: 0, grams: 0 }; }
