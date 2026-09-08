import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalUrl, locations, searchPage, searchPlans, runDiscovery, MAX_MONTHLY_REQUESTS } from '../lib/discovery.mjs';
import { discoveryConfiguration } from '../../netlify/functions/_shared/discovery-runtime.mts';
import worker from '../../netlify/functions/source-discovery-worker-background.mts';
const values = new Map();
globalThis.Netlify = { env: { get: key => values.get(key) } };
const production = { deploy: { context: 'production', published: true } };
const registry = { jurisdictions: ['wales'], sources: [{ id: 'existing', url: 'https://gov.wales/existing', jurisdictions: ['wales'] }] };
const fixture = (url = 'https://gov.wales/new', atLimit = false) => new Response(JSON.stringify({ results: Array.from({length:atLimit ? 20 : 1}, () => ({ url, title: '<b>Example guidance</b>', content: 'A search lead, not a confirmed change.', published_date: '2026-09-01' })), usage: {credits:1} }));
function setup() {
  const data = new Map();
  const store = { get: async key => structuredClone(data.get(key)), set: async (key, value) => data.set(key, structuredClone(value)) };
  return { data, store, args: { registry, runId: '2026-09', store, apiKey: 'test-only-search-key', pause: async () => {}, now: () => '2026-09-09T10:00:00Z' } };
}
test('all 12 locations have six recent and two undated searches, with local targeting', () => {
  assert.equal(Object.keys(locations).length, 12);
  for (const id of Object.keys(locations)) {
    const plans = searchPlans(id, '2026-09', '2026-09-09T10:00:00Z');
    assert.equal(plans.length, 8); assert.equal(plans.filter(p => p.freshness).length, 6);
    assert.ok(plans.every(p => p.jurisdiction === id && p.query.length < 400));
    assert.equal(plans[0].freshness, '2026-06-11to2026-09-09');
  }
  assert.match(searchPlans('canada-ontario', '2026-09')[0].query, /^"Ontario" /);
  assert.throws(() => searchPlans('../escape', '2026-09'), /Invalid/);
  assert.throws(() => searchPlans('wales', '2026-13'), /Invalid/);
});
test('only public HTTPS result links survive; fragments and tracking links deduplicate', () => {
  for (const url of ['javascript:alert(1)', 'http://gov.wales/a', 'https://127.0.0.1/x', 'https://[::1]/x', 'https://user:pass@gov.wales/a', 'https://host.local/a', 'https://example.com:8443/a']) assert.equal(canonicalUrl(url), null);
  assert.equal(canonicalUrl('https://gov.wales/a?utm_source=search&b=2&a=1#part'), 'https://gov.wales/a?a=1&b=2');
});
test('provider request has fixed host, secret header, country and date filter; text is bounded', async () => {
  let requested;
  const result = await searchPage(searchPlans('wales', '2026-09')[0], 0, { apiKey: 'private-test', fetchImpl: async (url, options) => { requested = { url, options }; return fixture(); } });
  const body = JSON.parse(requested.options.body);
  assert.equal(requested.url, 'https://api.tavily.com/search'); assert.equal(body.country, 'united kingdom');
  assert.equal(body.search_depth, 'basic'); assert.equal(body.auto_parameters, false); assert.equal(body.include_answer, false);
  assert.equal(body.max_results, 20); assert.equal(body.start_date, '2026-06-03');
  assert.equal(requested.options.headers.Authorization, 'Bearer private-test'); assert.equal(requested.options.redirect, 'error');
  assert.ok(!requested.url.includes('private-test')); assert.equal(result.results[0].title, 'Example guidance');
});
test('provider failures and malformed payloads never become successful empty searches', async () => {
  for (const fetchImpl of [async () => { throw new Error('private-test credential'); }, async () => new Response('secret error', { status: 429 }), async () => new Response('{}'), async () => new Response('invalid'), async () => new Response('large', { headers: { 'content-length': '3000000' } })]) {
    await assert.rejects(searchPage(searchPlans('wales', '2026-09')[0], 0, { apiKey: 'private-test', fetchImpl }), error => !error.message.includes('private-test') && !error.message.includes('secret error'));
  }
});
test('empty successful results are distinct from missing result sets', async () => {
  const result = await searchPage(searchPlans('wales', '2026-09')[0], 0, { apiKey: 'test', fetchImpl: async () => new Response(JSON.stringify({ results: [] })) });
  assert.equal(result.results.length, 0);
});
test('repeat URLs merge evidence; monthly reruns use checkpoints and keep first-seen dates', async () => {
  const { args } = setup(); let calls = 0;
  const fetchImpl = async () => { calls++; return fixture('https://gov.wales/new?utm_source=example'); };
  const [report] = await runDiscovery({ ...args, fetchImpl });
  assert.equal(report.status, 'complete'); assert.equal(calls, 8);
  assert.equal(report.candidates.length, 1); assert.equal(report.candidates[0].queryIds.length, 8);
  assert.equal(report.candidates[0].needsReview, true); assert.equal(report.candidates[0].publisherKnown, true);
  await runDiscovery({ ...args, fetchImpl }); assert.equal(calls, 8);
  const [next] = await runDiscovery({ ...args, runId: '2026-10', now: () => '2026-10-01T06:00:00Z', fetchImpl });
  assert.equal(next.candidates[0].firstSeenAt, report.candidates[0].firstSeenAt);
  assert.equal(next.candidates[0].needsReview, true);
});
test('one request per query and capped coverage are explicitly reported', async () => {
  const { args } = setup(); let calls = 0;
  const [report] = await runDiscovery({ ...args, fetchImpl: async () => { calls++; return fixture('https://gov.wales/existing', true); } });
  assert.equal(calls, 8); assert.ok(report.queries.every(q => q.limited));
  assert.deepEqual(report.candidates[0].registeredSourceIds, ['existing']);
});
test('failed page resumes without repeating successful pages or losing candidates', async () => {
  const { args } = setup(); let calls = 0;
  const [first] = await runDiscovery({ ...args, fetchImpl: async () => { calls++; return calls === 2 ? new Response('', { status: 500 }) : fixture(); } });
  assert.equal(first.status, 'partial'); assert.equal(first.candidates.length, 1);
  const [resumed] = await runDiscovery({ ...args, fetchImpl: async () => { calls++; return fixture(); } });
  assert.equal(resumed.status, 'complete'); assert.equal(calls, 9);
});
test('rate limits stop remaining requests; retries have a persistent ceiling', async () => {
  const { args } = setup(); let calls = 0;
  const fetchImpl = async () => { calls++; return new Response('', { status: 429 }); };
  const [first] = await runDiscovery({ ...args, fetchImpl });
  assert.equal(calls, 1); assert.equal(first.status, 'partial'); assert.equal(first.queries[1].status, 'not-run');
  // No page can be requested more than three times, even across manual retries.
  for (let i = 0; i < 26; i++) await runDiscovery({ ...args, fetchImpl });
  assert.equal(calls, 24);
});
test('time budget pauses honestly and stores reports for every location', async () => {
  const { args } = setup(); let calls = 0;
  const reports = await runDiscovery({ ...args, registry: { ...registry, jurisdictions: ['wales', 'england'] }, budgetMs: -1, fetchImpl: async () => { calls++; return fixture(); } });
  assert.equal(calls, 0); assert.equal(reports.length, 2); assert.ok(reports.every(r => r.status === 'partial'));
});
test('storage interruptions resume fetched pages without paying for them twice', async () => {
  const { args, store } = setup(); let fail = true, calls = 0;
  const unstable = { ...store, set: async (key, value) => { if (key.startsWith('discovery/seen/') && fail) { fail = false; throw new Error('Storage interrupted'); } return store.set(key, value); } };
  const fetchImpl = async () => { calls++; return fixture(); };
  await assert.rejects(runDiscovery({ ...args, store: unstable, fetchImpl }), /Storage interrupted/);
  await runDiscovery({ ...args, fetchImpl }); assert.equal(calls, 8);
});
test('disabled, unconfigured, unsigned and preview execution cannot search or store', async () => {
  assert.equal(discoveryConfiguration().status, 'disabled');
  values.set('DISCOVERY_ENABLED', 'true'); assert.equal(discoveryConfiguration().ready, false);
  values.set('TAVILY_API_KEY', 'test-only'); assert.equal(discoveryConfiguration().ready, true);
  values.set('MONITOR_TOKEN', 'test-token-'.repeat(8)); values.set('MONITOR_ENABLED', 'true');
  assert.equal(await worker(new Request('https://example.com/worker', { method: 'POST', body: '{}' }), production), undefined);
  assert.equal(await worker(new Request('https://example.com/worker', { method: 'POST', body: '{}' }), { deploy: { context: 'deploy-preview', published: false } }), undefined);
});

test('quota errors stop requests and the monthly cap cannot be bypassed by reruns', async () => {
  for (const status of [432,433]) {
    const {args}=setup();let calls=0;
    const [report]=await runDiscovery({...args,fetchImpl:async()=>{calls++;return new Response('',{status});}});
    assert.equal(calls,1);assert.equal(report.status,'partial');assert.equal(report.queries[1].status,'not-run');
  }
  const {args,data}=setup();data.set('discovery/usage/2026-09',{attempts:MAX_MONTHLY_REQUESTS});let calls=0;
  for(let i=0;i<2;i++) await runDiscovery({...args,fetchImpl:async()=>{calls++;return fixture();}});
  assert.equal(calls,0);
});
test('targeted searches pass domain filters and reject unsupported extra pages', async () => {
  let body;
  await searchPage(searchPlans('wales','2026-09')[6],0,{apiKey:'test',fetchImpl:async(url,options)=>{body=JSON.parse(options.body);return fixture();}});
  assert.deepEqual(body.include_domains,['gov.wales']);assert.equal(body.start_date,undefined);
  await assert.rejects(searchPage(searchPlans('wales','2026-09')[0],1,{apiKey:'test'}),/pagination/);
});
