import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSource, extractDocument, runJurisdiction, summarize } from '../lib/engine.mjs';
const source = { id: 'source-1', url: 'https://official.example/guidance', title: 'Official guidance', publisher: 'Regulator', category: 'policy', kind: 'document', jurisdictions: ['wales'], references: [], coverageNote: 'Selected source only.' };
const content = 'Social workers must consider the relevant statutory framework and record the basis for their decisions. This guidance describes the assessment and review process in detail.';
const html = (text = content, extras = '') => `<html><head><title>Guidance</title></head><body><nav>Menu ${extras}</nav><main><h1>Guidance</h1><p>${text}</p><a href="/code">Code</a></main><footer>${extras}</footer></body></html>`;
const response = (text = content) => async () => new Response(html(text), { headers: { 'content-type': 'text/html' } });
const now = '2026-09-08T10:00:00.000Z';
test('first check establishes a baseline; subsequent meaningful edit raises a pending change', async () => {
  const baseline = await checkSource(source, null, { fetchImpl: response(), now });
  assert.equal(baseline.result.status, 'baseline');
  assert.equal(baseline.result.needsReview, false);
  const change = await checkSource(source, baseline.state, { fetchImpl: response(content + ' Reviews must now take place every six months.'), now });
  assert.equal(change.result.status, 'changed'); assert.equal(change.result.needsReview, true);
  assert.match(change.result.change.afterExcerpt, /six months/);
  const unchanged = await checkSource(source, change.state, { fetchImpl: response(content + ' Reviews must now take place every six months.'), now });
  assert.equal(unchanged.result.status, 'unchanged'); assert.equal(unchanged.result.needsReview, true);
  assert.equal(unchanged.state.pendingChange.count, 1);
});
test('navigation, scripts and whitespace do not create changes; body dates and links do', () => {
  const doc = raw => extractDocument(Buffer.from(raw), 'text/html', source.url);
  assert.equal(doc(html()).hash, doc(html(content.replaceAll(' ', '  '), 'new menu <script>dynamic()</script>')).hash);
  assert.notEqual(doc(html()).hash, doc(html().replace('/code', '/new-code')).hash);
  assert.notEqual(doc(html()).hash, doc(html(content + ' Effective 1 October 2026.')).hash);
});
test('government ASP.NET forms preserve their article text', () => {
  const raw = `<body><form id="Form"><main><h1>Guidance</h1><p>${content}</p><input value="random-token"></main></form></body>`;
  const doc = extractDocument(Buffer.from(raw), 'text/html', source.url);
  assert.ok(doc.text.includes(content)); assert.ok(!doc.text.includes('random-token'));
});
test('government forms containing a table of legal links retain their content', () => {
  const raw = `<body><form id="codetoc"><table>${Array.from({length:30}, (_,i)=>`<tr><td><a href="/law/${i}">Code ${i}</a></td></tr>`).join('')}</table></form></body>`;
  const doc = extractDocument(Buffer.from(raw), 'text/html', source.url);
  assert.equal(doc.links.length, 30);
});
test('dynamic course listings remain flagged for browser review', async () => {
  const {result} = await checkSource(source, null, {fetchImpl:response(content + ' Loading events...')});
  assert.equal(result.status, 'baseline'); assert.equal(result.needsReview, true); assert.match(result.limitation, /dynamically/);
});
test('a failed check preserves last successful snapshot and unresolved changes', async () => {
  const initial = await checkSource(source, null, { fetchImpl: response(), now });
  initial.state.pendingChange = { firstDetectedAt: now, count: 1 };
  const failure = await checkSource(source, initial.state, { fetchImpl: async () => new Response('Blocked', { status: 403 }), now: '2026-10-01T06:00:00.000Z' });
  assert.equal(failure.result.status, 'failed'); assert.equal(failure.result.lastSuccessfulCheckAt, now);
  assert.equal(failure.state.snapshot.hash, initial.state.snapshot.hash); assert.equal(failure.result.consecutiveFailures, 1);
  const again = await checkSource(source, failure.state, { fetchImpl: async () => { throw new Error('TLS error'); } });
  assert.equal(again.result.consecutiveFailures, 2); assert.equal(again.result.pendingChange.count, 1);
});
test('blocked pages, empty shells, oversized responses and unsupported files fail honestly', async () => {
  for (const fetchImpl of [
    async () => new Response('<title>Just a moment...</title>' + html(), { headers: { 'content-type': 'text/html' } }),
    async () => new Response('<html><body>Enable JavaScript</body></html>', { headers: { 'content-type': 'text/html' } }),
    async () => new Response('test', { headers: { 'content-type': 'text/html', 'content-length': '9000000' } }),
    async () => new Response('test', { headers: { 'content-type': 'application/zip' } }),
    async () => new Response('<rss><broken>', { headers: { 'content-type': 'application/xml' } }),
    async () => new Response('bad pdf', { headers: { 'content-type': 'application/pdf' } })
  ]) {
    const { result } = await checkSource(source, null, { fetchImpl }); assert.equal(result.status, 'failed'); assert.equal(result.lastSuccessfulCheckAt, null);
  }
});
test('redirect outside approved hosts is never fetched', async () => {
  const calls = [];
  const { result } = await checkSource(source, null, { fetchImpl: async url => { calls.push(url); return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/private' } }); } });
  assert.equal(calls.length, 1); assert.equal(result.status, 'failed');
});
test('same publisher redirects are followed and reported', async () => {
  const { result } = await checkSource(source, null, { fetchImpl: async url => url.endsWith('/guidance') ? new Response(null, { status: 301, headers: { location: '/new-guidance' } }) : response()() });
  assert.equal(result.status, 'baseline'); assert.equal(result.finalUrl, 'https://official.example/new-guidance');
});
test('PDF fingerprint checks always retain their manual review limitation', async () => {
  const { result } = await checkSource(source, null, { fetchImpl: async () => new Response('%PDF-1.7\nfile', { headers: { 'content-type': 'application/pdf' } }) });
  assert.equal(result.mode, 'binary'); assert.equal(result.needsReview, true); assert.match(result.limitation, /fingerprint/);
});
test('RSS ignores channel build dates but detects new entries', () => {
  const feed = (date, extra = '') => `<rss><channel><lastBuildDate>${date}</lastBuildDate><item><title>New statutory guidance</title><link>https://official.example/guidance</link><description>${content}</description></item>${extra}</channel></rss>`;
  const doc = text => extractDocument(Buffer.from(text), 'application/rss+xml', source.url);
  assert.equal(doc(feed('one')).hash, doc(feed('two')).hash);
  assert.notEqual(doc(feed('one')).hash, doc(feed('two', '<item><title>Training update</title><link>https://official.example/training</link></item>')).hash);
});
test('completed batches are idempotent and jurisdictions have isolated baselines', async () => {
  const values = new Map(); const store = { get: async key => values.get(key), set: async (key, value) => values.set(key, structuredClone(value)) };
  const registry = { version: 1, jurisdictions: ['wales', 'england'], sources: [{ ...source, jurisdictions: ['wales', 'england'] }] };
  let calls = 0; const fetchImpl = async () => { calls++; return response()(); };
  const args = { registry, jurisdiction: 'wales', runId: '2026-09', store, fetchImpl };
  await runJurisdiction(args); await runJurisdiction(args); assert.equal(calls, 1);
  const england = await runJurisdiction({ ...args, jurisdiction: 'england' }); assert.equal(england.results[0].status, 'baseline');
  const next = await runJurisdiction({ ...args, runId: '2026-10' }); assert.equal(next.results[0].status, 'unchanged');
  assert.deepEqual(summarize(next.results), { total: 1, baseline: 0, unchanged: 1, changed: 0, failed: 0, rebaseline: 0, needsReview: 0 });
});
test('interrupted state write resumes the saved checkpoint without losing evidence', async () => {
  const values = new Map(); let fail = true, calls = 0;
  const store = { get: async key => values.get(key), set: async (key, value) => { if (key.startsWith('states/') && fail) { fail = false; throw new Error('Store interrupted'); } values.set(key, structuredClone(value)); } };
  const args = { registry: { version: 1, jurisdictions: ['wales'], sources: [source] }, jurisdiction: 'wales', runId: '2026-09', store, fetchImpl: async () => { calls++; return response()(); } };
  await assert.rejects(runJurisdiction(args), /Store interrupted/);
  const report = await runJurisdiction(args); assert.equal(calls, 1); assert.equal(report.status, 'complete'); assert.equal(report.results[0].status, 'baseline');
});
test('invalid run and jurisdiction cannot form storage paths', async () => {
  await assert.rejects(runJurisdiction({ registry: { jurisdictions: ['wales'] }, jurisdiction: '../secrets', runId: '2026-09' }), /Invalid/);
});
