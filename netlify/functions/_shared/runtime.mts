import { getStore } from '@netlify/blobs';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Context } from '@netlify/functions';
import registry from '../../../monitoring/sources.json' with { type: 'json' };

export { registry };
export function configReady(context: Context) {
  return context.deploy.context === 'production' && context.deploy.published && Netlify.env.get('MONITOR_ENABLED') === 'true' && (Netlify.env.get('MONITOR_TOKEN')?.length ?? 0) >= 32;
}
export function authorized(request: Request) {
  const expected = Netlify.env.get('MONITOR_TOKEN');
  return Boolean(expected && expected.length >= 32 && equal(request.headers.get('authorization') ?? '', `Bearer ${expected}`));
}
function equal(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function sign(body: string) {
  return createHmac('sha256', Netlify.env.get('MONITOR_TOKEN') ?? '').update(body).digest('hex');
}
export function verify(body: string, signature: string) { return equal(sign(body), signature); }
export function storage() {
  const raw = getStore({ name: 'social-work-source-monitor-v1', consistency: 'strong' });
  return { raw, get: (key: string) => raw.get(key, { type: 'json' }), set: (key: string, value: unknown) => raw.setJSON(key, value) };
}
export function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff' } });
}
