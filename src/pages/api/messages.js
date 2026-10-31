// POST /api/messages: the contact, issues and suggestions forms
import { env } from 'cloudflare:workers';
import { DB } from '../../lib/db.js';
import { normalizePhone } from '../../lib/orders.js';

const KINDS = ['contact', 'issue', 'suggestion'];
const PER_HOUR = 5;
const clean = (s, max) => String(s ?? '').replace(/[ \t]+/g, ' ').trim().slice(0, max);

export async function POST({ request }) {
  let b;
  try { b = await request.json(); } catch { return Response.json({ error: 'generic' }, { status: 400 }); }

  // bots: the hidden "website" field must stay empty, and nobody types a message in under 3 seconds
  if (b.website || !(Date.now() - Number(b.started) > 3000)) return Response.json({ ok: true });

  const kind = KINDS.includes(b.kind) ? b.kind : 'contact';
  const name = clean(b.name, 80);
  const rawPhone = clean(b.phone, 30);
  const phone = rawPhone ? normalizePhone(rawPhone) : '';
  const message = String(b.message ?? '').replace(/\r/g, '').trim().slice(0, 2000);
  const orderCode = clean(b.order, 20).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const lang = b.lang === 'en' ? 'en' : 'ar';

  // a reply needs a way to reach them: contact and issue forms ask for name and phone
  const needsContact = kind !== 'suggestion';
  if (needsContact && name.length < 2) return Response.json({ error: 'name', field: 'name' }, { status: 422 });
  if ((needsContact || rawPhone) && !phone) return Response.json({ error: 'phone', field: 'phone' }, { status: 422 });
  if (message.length < 10) return Response.json({ error: 'message', field: 'message' }, { status: 422 });

  const branchId = Number(b.branch) || null;
  const branch = branchId ? await DB().prepare('SELECT id FROM branches WHERE id = ? AND active = 1').bind(branchId).first() : null;

  const ip = request.headers.get('cf-connecting-ip') || '';
  const key = `msg:${ip}`;
  const count = ip ? Number((await env.SESSION.get(key)) || 0) : 0;
  if (count >= PER_HOUR) return Response.json({ error: 'tooMany' }, { status: 429 });
  if (ip) await env.SESSION.put(key, String(count + 1), { expirationTtl: 3600 });

  await DB().prepare('INSERT INTO messages (kind, name, phone, order_code, branch_id, message, lang) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(kind, name, phone || '', orderCode, branch?.id ?? null, message, lang).run();
  return Response.json({ ok: true });
}
