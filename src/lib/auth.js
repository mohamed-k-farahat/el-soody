// Admin password login.
// The password is stored only as a PBKDF2 hash in settings.admin_password_hash ("pbkdf2$<iterations>$<salt>$<hash>").
// A signed cookie keeps the owner logged in; changing the password logs every device out.
import { env } from 'cloudflare:workers';
import { DB } from './db.js';

export const COOKIE = 'soody_admin';
const ITERATIONS = 100000;          // the most Cloudflare Workers allow for PBKDF2
const SESSION_DAYS = 14;
const MAX_FAILS = 5;
const LOCK_SECONDS = 15 * 60;

const enc = new TextEncoder();
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0));

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERATIONS}$${b64url(salt)}$${b64url(await pbkdf2(password, salt, ITERATIONS))}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, iter, salt, hash] = String(stored || '').split('$');
  if (scheme !== 'pbkdf2' || !salt || !hash) return false;
  const got = b64url(await pbkdf2(password, fromB64url(salt), Number(iter)));
  return safeEqual(got, hash);
}

export async function storedHash() {
  const row = await DB().prepare("SELECT value FROM settings WHERE key = 'admin_password_hash'").first();
  return row?.value || '';
}

export async function setPasswordHash(hash) {
  await DB().prepare("INSERT INTO settings (key, value) VALUES ('admin_password_hash', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .bind(hash).run();
}

async function sign(text) {
  const secret = env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set');
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(text)));
}

// part of the password hash goes into the cookie, so a new password invalidates old cookies
const version = (hash) => hash.split('$')[2]?.slice(0, 10) || '';

export async function makeSessionCookie(hash, secure) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  const body = `${exp}.${version(hash)}`;
  const value = `${body}.${await sign(body)}`;
  return `${COOKIE}=${value}; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}${secure ? '; Secure' : ''}`;
}

export const clearSessionCookie = (secure) => `${COOKIE}=; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;

export async function sessionValid(request) {
  const cookie = request.headers.get('cookie') || '';
  const value = (cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`)) || [])[1];
  if (!value || !env.ADMIN_SESSION_SECRET) return false;
  const [exp, ver, sig] = value.split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const hash = await storedHash();
  if (!hash || ver !== version(hash)) return false;
  return safeEqual(await sign(`${exp}.${ver}`), sig);
}

/* ---- slow down password guessing: 5 wrong tries per connection, then 15 minutes locked ---- */
const failKey = (request) => `login-fail:${request.headers.get('cf-connecting-ip') || 'local'}`;

export async function lockedOut(request) {
  return Number((await env.SESSION.get(failKey(request))) || 0) >= MAX_FAILS;
}
export async function recordFailure(request) {
  const key = failKey(request);
  const n = Number((await env.SESSION.get(key)) || 0) + 1;
  await env.SESSION.put(key, String(n), { expirationTtl: LOCK_SECONDS });
}
export async function clearFailures(request) {
  await env.SESSION.delete(failKey(request));
}
