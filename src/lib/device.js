// A random id for the customer's browser, kept in a first party cookie for two years.
// Used only so the free first delivery works once per device. The server sets it
// (HttpOnly), so page scripts can't read it and Safari doesn't cut it short.
const COOKIE = 'soody_d';
const MAX_AGE = 60 * 60 * 24 * 365 * 2;
const VALID = /^[a-f0-9]{32}$/;

/** The device id from the request, creating and setting one when missing */
export function deviceId({ cookies, url }) {
  const current = cookies.get(COOKIE)?.value;
  if (current && VALID.test(current)) return { id: current, isNew: false };
  const id = crypto.randomUUID().replace(/-/g, '');
  cookies.set(COOKIE, id, { path: '/', httpOnly: true, sameSite: 'lax', secure: url.protocol === 'https:', maxAge: MAX_AGE });
  return { id, isNew: true };
}
