import type { Context, Config } from '@netlify/functions';
import { configReady, json, registry, sign, storage } from './_shared/runtime.mts';

export default async (_request: Request, context: Context) => {
  if (!configReady(context)) { console.log('Source monitor inactive: enable production monitoring and configure MONITOR_TOKEN.'); return json({ status: 'inactive' }); }
  const runId = new Date().toISOString().slice(0, 7);
  const store = storage();
  const outcomes = await Promise.all(registry.jurisdictions.map(async jurisdiction => {
    const body = JSON.stringify({ runId, jurisdiction, issuedAt: Date.now() });
    const key = `dispatch/${runId}/${jurisdiction}`;
    try {
      await store.set(key, { status: 'dispatching', at: new Date().toISOString() });
      const response = await fetch(new URL('/.netlify/functions/source-monitor-worker-background', context.site.url), {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Monitor-Signature': sign(body) }, body,
        signal: AbortSignal.timeout(15000), redirect: 'error'
      });
      if (response.status !== 202) throw new Error(`Worker returned HTTP ${response.status}`);
      await store.set(key, { status: 'accepted', at: new Date().toISOString() });
      return { jurisdiction, status: 'accepted' };
    } catch (error) {
      await store.set(key, { status: 'failed', at: new Date().toISOString(), detail: String(error).slice(0, 200) });
      return { jurisdiction, status: 'failed' };
    }
  }));
  console.log(JSON.stringify({ runId, outcomes }));
  if (outcomes.some(x => x.status === 'failed')) throw new Error('Some monitoring batches were not dispatched; see the monitoring report and rerun this function.');
  return json({ runId, outcomes });
};

// 06:00 UTC on the first day of every month; scheduled functions run only in production.
export const config: Config = { schedule: '0 6 1 * *' };
