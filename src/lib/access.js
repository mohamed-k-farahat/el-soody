// Admin login check. In production Cloudflare Access sits in front of /admin and signs a JWT for the
// logged in owner; we verify that JWT here too, so the admin stays locked even if Access were misconfigured.
import { env } from 'cloudflare:workers';

let jwksCache = { at: 0, keys: [] };

const b64urlToBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
const b64urlJson = (s) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

async function getKeys(team) {
  if (Date.now() - jwksCache.at < 10 * 60 * 1000 && jwksCache.keys.length) return jwksCache.keys;
  const res = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error('could not load Access keys');
  const { keys } = await res.json();
  jwksCache = { at: Date.now(), keys };
  return keys;
}

async function verifyAccessJwt(token) {
  const team = env.ACCESS_TEAM_DOMAIN;
  const aud = env.ACCESS_AUD;
  if (!team || !aud || !token) return null;

  const [h, p, s] = token.split('.');
  if (!h || !p || !s) return null;
  const header = b64urlJson(h);
  const payload = b64urlJson(p);
  if (header.alg !== 'RS256') return null;

  const jwk = (await getKeys(team)).find((k) => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) return null;

  const now = Math.floor(Date.now() / 1000);
  const audOk = Array.isArray(payload.aud) ? payload.aud.includes(aud) : payload.aud === aud;
  if (!audOk || payload.iss !== `https://${team}` || !(payload.exp > now)) return null;
  return { email: payload.email || 'owner' };
}

/** Returns { email } for an allowed admin request, or null */
export async function adminUser(request, url) {
  // local development only: ADMIN_DEV=1 in .dev.vars, and only on this computer
  if (env.ADMIN_DEV === '1' && ['localhost', '127.0.0.1'].includes(url.hostname)) return { email: 'dev@localhost' };

  const cookie = request.headers.get('cookie') || '';
  const token = request.headers.get('cf-access-jwt-assertion') || (cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/) || [])[1];
  try {
    return await verifyAccessJwt(token);
  } catch (e) {
    console.error('access check failed', e);
    return null;
  }
}
