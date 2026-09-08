import type { Context, Config } from '@netlify/functions';
import { runDiscovery } from '../../monitoring/lib/discovery.mjs';
import { configReady, registry, storage, verify } from './_shared/runtime.mts';
import { discoveryConfiguration } from './_shared/discovery-runtime.mts';

export default async (request: Request, context: Context) => {
  if (request.method !== 'POST' || !configReady(context) || !discoveryConfiguration().ready) return;
  if (Number(request.headers.get('content-length')) > 2048) return;
  const body = await request.text();
  if (body.length > 2048 || !verify(body, request.headers.get('X-Monitor-Signature') ?? '')) return;
  let input;
  try { input = JSON.parse(body); } catch { return; }
  const { runId, issuedAt, kind } = input;
  if (kind !== 'web-discovery' || typeof issuedAt !== 'number' || Math.abs(Date.now() - issuedAt) > 10 * 60 * 1000 || runId !== new Date(issuedAt).toISOString().slice(0, 7)) return;
  const store = storage();
  const key = 'discovery/lease';
  const current = await store.raw.getWithMetadata(key, { type: 'json' });
  if (current && current.data.expiresAt > Date.now()) return;
  const lock = await store.raw.setJSON(key, { runId, expiresAt: Date.now() + 14 * 60 * 1000 }, current ? { onlyIfMatch: current.etag } : { onlyIfNew: true });
  if (!lock.modified) return;
  try {
    const reports = await runDiscovery({ registry, runId, store, apiKey: Netlify.env.get('TAVILY_API_KEY')! });
    await store.set(`discovery/run/${runId}`, { status: reports.every(r => r.status === 'complete') ? 'complete' : 'partial', at: new Date().toISOString() });
  } catch {
    await store.set(`discovery/run/${runId}`, { status: 'interrupted', at: new Date().toISOString(), message: 'Search batch interrupted. Rerun the monthly function to resume saved pages.' });
    throw new Error('Web discovery interrupted; inspect the private monitoring report.');
  } finally { await store.raw.setJSON(key, { runId, expiresAt: 0 }, { onlyIfMatch: lock.etag }); }
};
export const config = { background: true } satisfies Config;
