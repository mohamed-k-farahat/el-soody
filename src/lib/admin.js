// Small helpers shared by the admin pages.
import { env } from 'cloudflare:workers';
import { egp } from './money.js';

export const STATUS_AR = {
  new: 'جديد', confirmed: 'اتأكد', preparing: 'بيتجهز', ready: 'جاهز', out: 'خرج للتوصيل', completed: 'اتسلم', cancelled: 'اتلغى',
};
export const PAY_AR = { unpaid: 'لسه مادفعش', pending: 'مستني التأكيد', paid: 'مدفوع', failed: 'فشل', refunded: 'اترجع' };
export const SECTION_AR = { plain: 'سادة', spiced: 'محوّج', french: 'فرنساوي' };
export const ROAST_AR = { light: 'فاتح', medium: 'وسط', dark: 'غامق' };

/** "2026-10-31 13:05:00" (UTC from SQLite) -> Cairo time in Arabic */
export function cairoTime(sqlUtc) {
  const d = new Date(`${String(sqlUtc).replace(' ', 'T')}Z`);
  return d.toLocaleString('ar-EG', { timeZone: 'Africa/Cairo', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

/** 01001234567 -> 201001234567 for wa.me links */
export const waNumber = (phone) => `2${phone}`;

const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_IMAGE = 4 * 1024 * 1024;

/**
 * Saves an uploaded photo to Cloudflare KV. Returns { value: 'r2:<key>' }, { value: null } if no file, or { error }.
 * (The "r2:" prefix just marks an uploaded photo served by /img/<key>.)
 */
export async function saveUpload(file, prefix) {
  if (!file || typeof file === 'string' || !file.size) return { value: null };
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { error: 'الصورة لازم تكون JPG أو PNG أو WebP.' };
  if (file.size > MAX_IMAGE) return { error: 'الصورة أكبر من ٤ ميجا. صغّرها وجرّب تاني.' };
  const key = `${prefix}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  await env.MEDIA.put(key, await file.arrayBuffer(), { metadata: { contentType: file.type } });
  return { value: `r2:${key}` };
}

/** form value helpers */
export const str = (form, key, max = 500) => String(form.get(key) ?? '').trim().slice(0, max);
export const flag = (form, key) => (form.get(key) ? 1 : 0);

export const PROMO_KIND_AR = { percent: 'نسبة خصم', fixed: 'مبلغ خصم', delivery: 'توصيل مجاني' };

/** "١٥٪ خصم، لحد ١٠٠ ج.م" style summary of what a code gives */
export function promoText(p) {
  if (p.kind === 'percent') return `خصم ${p.value}٪${p.max_discount ? `، لحد ${egp(p.max_discount)}` : ''}`;
  if (p.kind === 'fixed') return `خصم ${egp(p.value)}`;
  return 'توصيل مجاني';
}

/** Where a code stands today: { label, cls } for the status pill */
export function promoState(p, today) {
  if (!p.active) return { label: 'متوقف', cls: 'cancelled' };
  if (p.ends_on && today > p.ends_on) return { label: 'انتهى', cls: 'cancelled' };
  if (p.max_uses && p.uses >= p.max_uses) return { label: 'خلص', cls: 'refunded' };
  if (p.starts_on && today < p.starts_on) return { label: 'لسه مابدأش', cls: 'ready' };
  return { label: 'شغال', cls: 'completed' };
}
