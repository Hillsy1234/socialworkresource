import type { Context, Config } from '@netlify/functions';
import { runJurisdiction } from '../../monitoring/lib/engine.mjs';
import { configReady, registry, storage, verify } from './_shared/runtime.mts';

export default async (request: Request, context: Context) => {
  // Background endpoints acknowledge before execution, so reject before any storage or source access.
  if (request.method !== 'POST' || !configReady(context)) return;
  if (Number(request.headers.get('content-length')) > 2048) return;
  const body = await request.text();
  if (body.length > 2048 || !verify(body, request.headers.get('X-Monitor-Signature') ?? '')) return;
  let input;
  try { input = JSON.parse(body); } catch { return; }
  const { runId, jurisdiction, issuedAt } = input;
  if (typeof issuedAt !== 'number' || Math.abs(Date.now() - issuedAt) > 10 * 60 * 1000 || !registry.jurisdictions.includes(jurisdiction) || runId !== new Date(issuedAt).toISOString().slice(0, 7)) return;
  const store = storage();
  if ((await store.get(`reports/${runId}/${jurisdiction}`))?.status === 'complete') return;
  const key = `leases/${jurisdiction}`;
  const current = await store.raw.getWithMetadata(key, { type: 'json' });
  if (current && current.data.expiresAt > Date.now()) return;
  const lock = await store.raw.setJSON(key, { runId, expiresAt: Date.now() + 14 * 60 * 1000 }, current ? { onlyIfMatch: current.etag } : { onlyIfNew: true });
  if (!lock.modified) return;
  try {
    const report = await runJurisdiction({ registry, jurisdiction, runId, store, fetchImpl: fetch });
    console.log(JSON.stringify({ runId, jurisdiction, summary: report.summary }));
  } catch (error) {
    await store.set(`errors/${runId}/${jurisdiction}`, { at: new Date().toISOString(), detail: 'Monitoring batch interrupted; rerun the monthly function to resume saved checkpoints.' });
    throw error;
  } finally {
    await store.raw.setJSON(key, { runId, expiresAt: 0 }, { onlyIfMatch: lock.etag });
  }
};

export const config = { background: true } satisfies Config;
