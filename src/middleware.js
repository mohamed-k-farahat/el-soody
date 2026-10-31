// Locks the admin panel behind the owner's login, and blocks forged cross-site form posts.
// Logged in means one of: the admin password cookie, a Cloudflare Access login (if configured later),
// or the local development bypass.
import { defineMiddleware } from 'astro:middleware';
import { adminUser } from './lib/access.js';
import { sessionValid } from './lib/auth.js';

const isAdminPath = (p) => p === '/admin' || p.startsWith('/admin/');
const LOGIN = '/admin/login';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request } = context;
  if (!isAdminPath(url.pathname)) return next();

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) return new Response('Bad origin', { status: 403 });
    if (!origin && !(request.headers.get('referer') || '').startsWith(url.origin)) return new Response('Bad origin', { status: 403 });
  }

  const user = (await adminUser(request, url)) || ((await sessionValid(request)) ? { email: 'owner' } : null);

  if (url.pathname === LOGIN) {
    if (user && request.method === 'GET') return context.redirect('/admin', 303);
  } else if (!user) {
    if (request.method === 'GET') {
      const back = url.pathname + url.search;
      return context.redirect(`${LOGIN}?next=${encodeURIComponent(back)}`, 303);
    }
    return new Response('Not logged in', { status: 403 });
  }

  context.locals.admin = user;
  const response = await next();
  response.headers.set('x-robots-tag', 'noindex');
  response.headers.set('cache-control', 'no-store');
  return response;
});
