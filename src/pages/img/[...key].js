// GET /img/<key>: product and share photos uploaded in admin (stored in R2)
import { env } from 'cloudflare:workers';

export async function GET({ params }) {
  const key = params.key || '';
  if (!/^[a-z]+\/[\w.-]+$/.test(key)) return new Response('Not found', { status: 404 });
  const obj = await env.MEDIA.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  return new Response(obj.body, {
    headers: {
      'content-type': obj.httpMetadata?.contentType || 'application/octet-stream',
      // file names are unique per upload, so they can be cached for a long time
      'cache-control': 'public, max-age=31536000, immutable',
      etag: obj.httpEtag,
    },
  });
}
