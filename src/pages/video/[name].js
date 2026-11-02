// The site's videos, with seeking. Cloudflare's static files ignore "Range" requests (they always send the
// whole file), so a browser can't jump into the middle of a video (it starts over) and iPhones may refuse to
// play it. This route answers a range with just that part of the file, streamed from the static copy.
import { env } from 'cloudflare:workers';

const FILES = { 'promo.mp4': '/media/promo.mp4', 'hero.mp4': '/media/hero.mp4' };

/** Only the bytes start..end (inclusive) of a stream */
function part(body, start, end) {
  let pos = 0;
  return body.pipeThrough(new TransformStream({
    transform(chunk, ctl) {
      const from = Math.max(start - pos, 0), to = Math.min(end + 1 - pos, chunk.length);
      if (from < to) ctl.enqueue(chunk.subarray(from, to));
      pos += chunk.length;
      if (pos > end) ctl.terminate(); // the rest isn't needed
    },
  }));
}

async function serve({ params, request, url }, head) {
  const path = FILES[params.name];
  if (!path) return new Response('Not found', { status: 404 });
  const file = await env.ASSETS.fetch(new URL(path, url));
  if (!file.ok) return file;
  let size = Number(file.headers.get('content-length'));
  let body = file.body;
  if (!size) {
    // on Cloudflare the static copy can come without its length: read it (a few MB) to know the size
    const bytes = new Uint8Array(await file.arrayBuffer());
    size = bytes.length;
    body = new Response(bytes).body;
  }

  const headers = {
    'content-type': 'video/mp4', 'accept-ranges': 'bytes',
    'cache-control': 'public, max-age=86400', etag: file.headers.get('etag') || '',
  };
  const m = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '');
  if (!m || (!m[1] && !m[2])) {
    if (head) body?.cancel();
    return new Response(head ? null : body, { headers: { ...headers, 'content-length': String(size) } });
  }
  // "bytes=500-" (from 500 on), "bytes=500-999", or "bytes=-500" (the last 500)
  const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
  const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  if (start >= size || start > end) {
    body?.cancel();
    return new Response(null, { status: 416, headers: { ...headers, 'content-range': `bytes */${size}` } });
  }
  if (head) body?.cancel();
  return new Response(head ? null : part(body, start, end), {
    status: 206,
    headers: { ...headers, 'content-range': `bytes ${start}-${end}/${size}`, 'content-length': String(end - start + 1) },
  });
}

export const GET = (ctx) => serve(ctx, false);
export const HEAD = (ctx) => serve(ctx, true);
