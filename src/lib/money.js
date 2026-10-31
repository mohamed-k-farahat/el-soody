// Prices are stored in piasters (1 EGP = 100) and shown in Egyptian pounds.

export function egp(piasters, lang = 'ar') {
  if (piasters == null) return '';
  const pounds = piasters / 100;
  const n = Number.isInteger(pounds) ? String(pounds) : pounds.toFixed(2);
  return lang === 'ar' ? `${n} ج.م` : `EGP ${n}`;
}

/** "75" or "75.5" from a form field to piasters; null for empty, NaN for invalid */
export function toPiasters(value) {
  const s = String(value ?? '').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN;
}
