import { getUser } from '@netlify/identity';
import type { Config, Context } from '@netlify/functions';

const ALLOWED_ACTIONS = new Set(['parking', 'months', 'records']);

export default async (request: Request, _context: Context) => {
  const user = await getUser();
  if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const endpoint = Netlify.env.get('GOOGLE_APPS_SCRIPT_URL');
  const proxySecret = Netlify.env.get('GOOGLE_APPS_SCRIPT_SECRET');
  if (!endpoint || !proxySecret) return Response.json({ ok: false, error: 'Server configuration is incomplete' }, { status: 500 });
  try {
    if (request.method === 'GET') {
      const incoming = new URL(request.url);
      const action = incoming.searchParams.get('action') || '';
      if (!ALLOWED_ACTIONS.has(action)) return Response.json({ ok: false, error: 'Invalid action' }, { status: 400 });
      const target = new URL(endpoint);
      target.searchParams.set('action', action);
      target.searchParams.set('proxySecret', proxySecret);
      if (action === 'records') {
        const month = incoming.searchParams.get('month') || '';
        if (!/^\d{4}-\d{2}$/.test(month)) return Response.json({ ok: false, error: 'Invalid month' }, { status: 400 });
        target.searchParams.set('month', month);
      }
      const response = await fetch(target, { redirect: 'follow' });
      return new Response(await response.text(), { status: response.ok ? 200 : 502, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    if (request.method === 'POST') {
      const contentLength = Number(request.headers.get('content-length') || 0);
      if (contentLength > 20000) return Response.json({ ok: false, error: 'Request too large' }, { status: 413 });
      const body = await request.json() as Record<string, unknown>;
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...body, proxySecret }), redirect: 'follow' });
      return new Response(await response.text(), { status: response.ok ? 200 : 502, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET, POST' } });
  } catch {
    return Response.json({ ok: false, error: 'Backend service unavailable' }, { status: 502 });
  }
};

export const config: Config = {
  path: '/api/google',
  rateLimit: { windowLimit: 120, windowSize: 60, aggregateBy: ['ip', 'domain'] }
};
