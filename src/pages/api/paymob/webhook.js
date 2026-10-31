// POST /api/paymob/webhook: Paymob's server to server "transaction processed" callback.
// Only HMAC verified transactions change an order.
import { verifyTransaction, applyTransaction } from '../../../lib/paymob.js';

export async function POST({ request, url }) {
  let body;
  try { body = await request.json(); } catch { return new Response('bad json', { status: 400 }); }
  if (body?.type && body.type !== 'TRANSACTION') return new Response('ignored', { status: 200 });

  const obj = body?.obj;
  if (!(await verifyTransaction(obj, url.searchParams.get('hmac')))) {
    return new Response('bad signature', { status: 401 });
  }
  const status = await applyTransaction(obj);
  return new Response(status ? `ok ${status}` : 'no matching order', { status: 200 });
}
