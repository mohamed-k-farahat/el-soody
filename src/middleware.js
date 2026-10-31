// Locks the admin panel and its uploads behind the owner's login, and blocks forged cross-site form posts.
import { defineMiddleware } from 'astro:middleware';
import { adminUser } from './lib/access.js';

const isAdminPath = (p) => p === '/admin' || p.startsWith('/admin/');

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request } = context;
  if (!isAdminPath(url.pathname)) return next();

  const user = await adminUser(request, url);
  if (!user) {
    return new Response('Not allowed. Sign in through the El Soody admin login.', {
      status: 403,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex' },
    });
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) return new Response('Bad origin', { status: 403 });
    if (!origin && !(request.headers.get('referer') || '').startsWith(url.origin)) return new Response('Bad origin', { status: 403 });
  }

  context.locals.admin = user;
  const response = await next();
  response.headers.set('x-robots-tag', 'noindex');
  response.headers.set('cache-control', 'no-store');
  return response;
});
