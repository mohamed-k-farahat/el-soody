// GET /robots.txt
export function GET({ url }) {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /checkout',
    'Disallow: /en/checkout',
    'Disallow: /order/',
    'Disallow: /en/order/',
    'Disallow: /pay/',
    '',
    `Sitemap: ${url.origin}/sitemap.xml`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
