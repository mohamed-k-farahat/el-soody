// Language helpers. Arabic lives at "/", English at "/en/".
import { STRINGS } from './strings.js';

export const LANGS = ['ar', 'en'];

export const t = (lang, key) => STRINGS[lang]?.[key] ?? STRINGS.ar[key] ?? key;

/** "/menu" -> "/en/menu" for English, unchanged for Arabic */
export function href(lang, path = '/') {
  if (lang === 'ar') return path;
  return path === '/' ? '/en/' : `/en${path}`;
}

/** Strip the "/en" prefix so a path can be rebuilt for the other language */
export function basePath(pathname) {
  const p = pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  return p.length > 1 ? p.replace(/\/$/, '') : p;
}

export const dir = (lang) => (lang === 'ar' ? 'rtl' : 'ltr');

export const num = (lang, n) => (lang === 'ar' ? Number(n).toLocaleString('ar-EG') : String(n));
