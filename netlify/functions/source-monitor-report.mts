import { discoveryConfiguration } from './_shared/discovery-runtime.mts';
import type { Context, Config } from '@netlify/functions';
import { authorized, configReady, json, registry, storage } from './_shared/runtime.mts';

export default async (request: Request, context: Context) => {
  if (!authorized(request)) return json({ error: 'A valid monitoring access key is required.' }, 401);
  if (!configReady(context)) return json({ error: 'Production monitoring is not enabled on this deploy.' }, 503);
  const runId = new URL(request.url).searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(runId)) return json({ error: 'Invalid month.' }, 400);
  const store = storage();
  const discoveryLocation = new URL(request.url).searchParams.get('discoveryLocation');
  if (discoveryLocation !== null) {
    if (!registry.jurisdictions.includes(discoveryLocation)) return json({ error: 'Invalid discovery location.' }, 400);
    const item = await store.get(`discovery/reports/${runId}/${discoveryLocation}`);
    return json({ runId, jurisdiction: discoveryLocation, candidates: item?.candidates || [] });
  }
  const reports = await Promise.all(registry.jurisdictions.map(async jurisdiction => {
    const [report, dispatch, error] = await Promise.all([store.get(`reports/${runId}/${jurisdiction}`), store.get(`dispatch/${runId}/${jurisdiction}`), store.get(`errors/${runId}/${jurisdiction}`)]);
    const item = report ?? { runId, jurisdiction, status: 'not-run', total: registry.sources.filter(s => s.jurisdictions.includes(jurisdiction)).length, results: [] };
    const stalled = item.status === 'running' && Date.now() - Date.parse(item.updatedAt) > 16 * 60 * 1000;
    const unstarted = item.status === 'not-run' && dispatch && Date.now() - Date.parse(dispatch.at) > 16 * 60 * 1000;
    return { ...item, status: stalled || unstarted ? 'interrupted' : item.status, dispatch, error: item.status === 'complete' ? null : error };
  }));
  const [discoveryReports, discoveryDispatch, discoveryRun] = await Promise.all([
    Promise.all(registry.jurisdictions.map(async jurisdiction => {
      const item = await store.get(`discovery/reports/${runId}/${jurisdiction}`);
      if (!item) return { jurisdiction, status: 'not-run', queries: [], candidates: [] };
      return { ...item, candidateCount: item.candidates.length, candidates: item.candidates.slice(0, 50), status: item.status === 'running' && Date.now() - Date.parse(item.updatedAt) > 16 * 60 * 1000 ? 'interrupted' : item.status };
    })),
    store.get(`discovery/dispatch/${runId}`), store.get(`discovery/run/${runId}`)
  ]);
  const discovery = { ...discoveryConfiguration(), dispatch: discoveryDispatch, run: discoveryRun, reports: discoveryReports };
  return json({ discovery, runId, generatedAt: new Date().toISOString(), sourceCount: registry.sources.length, scope: 'Selected sources only; automated monitoring is separate from professional review.', reports });
};
export const config: Config = { method: 'GET' };
