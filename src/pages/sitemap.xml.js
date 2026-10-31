// GET /sitemap.xml: every public page in both languages, plus every product on sale
import { DB } from '../lib/db.js';
import { href } from '../lib/i18n.js';

const STATIC = ['/', '/store', '/stories', '/menu', '/shop', '/contact', '/issues', '/suggestions', '/policies'];

export async function GET({ url }) {
  const origin = url.origin;
  const { results } = await DB().prepare(`
    SELECT p.slug, p.updated_at FROM products p
    WHERE p.active = 1 AND EXISTS (SELECT 1 FROM items i WHERE i.product_id = p.id AND i.available = 1)
    ORDER BY p.sort`).all();

  const entry = (path, lastmod) => {
    const ar = `${origin}${href('ar', path)}`;
    const en = `${origin}${href('en', path)}`;
    const alt = `<xhtml:link rel="alternate" hreflang="ar" href="${ar}"/><xhtml:link rel="alternate" hreflang="en" href="${en}"/>`;
    const mod = lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : '';
    return `<url><loc>${ar}</loc>${mod}${alt}</url><url><loc>${en}</loc>${mod}${alt}</url>`;
  };

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${STATIC.map((p) => entry(p)).join('\n')}
${results.map((p) => entry(`/store/${p.slug}`, p.updated_at)).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
