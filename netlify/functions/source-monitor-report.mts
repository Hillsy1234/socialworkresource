import type { Context, Config } from '@netlify/functions';
import { authorized, configReady, json, registry, storage } from './_shared/runtime.mts';

export default async (request: Request, context: Context) => {
  if (!authorized(request)) return json({ error: 'A valid monitoring access key is required.' }, 401);
  if (!configReady(context)) return json({ error: 'Production monitoring is not enabled on this deploy.' }, 503);
  const runId = new URL(request.url).searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(runId)) return json({ error: 'Invalid month.' }, 400);
  const store = storage();
  const reports = await Promise.all(registry.jurisdictions.map(async jurisdiction => {
    const [report, dispatch, error] = await Promise.all([store.get(`reports/${runId}/${jurisdiction}`), store.get(`dispatch/${runId}/${jurisdiction}`), store.get(`errors/${runId}/${jurisdiction}`)]);
    const item = report ?? { runId, jurisdiction, status: 'not-run', total: registry.sources.filter(s => s.jurisdictions.includes(jurisdiction)).length, results: [] };
    const stalled = item.status === 'running' && Date.now() - Date.parse(item.updatedAt) > 16 * 60 * 1000;
    const unstarted = item.status === 'not-run' && dispatch && Date.now() - Date.parse(dispatch.at) > 16 * 60 * 1000;
    return { ...item, status: stalled || unstarted ? 'interrupted' : item.status, dispatch, error: item.status === 'complete' ? null : error };
  }));
  return json({ runId, generatedAt: new Date().toISOString(), sourceCount: registry.sources.length, scope: 'Selected sources only; automated monitoring is separate from professional review.', reports });
};
export const config: Config = { method: 'GET' };
