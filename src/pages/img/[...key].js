// GET /img/<key>: product and share photos uploaded in admin (stored in Cloudflare KV)
import { env } from 'cloudflare:workers';

export async function GET({ params }) {
  const key = params.key || '';
  if (!/^[a-z]+\/[\w.-]+$/.test(key)) return new Response('Not found', { status: 404 });
  const { value, metadata } = await env.MEDIA.getWithMetadata(key, { type: 'stream' });
  if (!value) return new Response('Not found', { status: 404 });
  return new Response(value, {
    headers: {
      'content-type': metadata?.contentType || 'application/octet-stream',
      // file names are unique per upload, so they can be cached for a long time
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
}
