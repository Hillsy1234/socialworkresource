import test from 'node:test';
import assert from 'node:assert/strict';
import { authorized, configReady, sign, verify } from '../../netlify/functions/_shared/runtime.mts';
import report from '../../netlify/functions/source-monitor-report.mts';
import worker from '../../netlify/functions/source-monitor-worker-background.mts';
import scheduler from '../../netlify/functions/source-monitor-monthly.mts';

const values = new Map();
globalThis.Netlify = { env: { get: key => values.get(key) } };
const production = { deploy: { context: 'production', published: true } };
test('missing and short keys fail closed; valid keys and signatures are checked', () => {
  const request = token => new Request('https://example.com/report', { headers: { authorization: `Bearer ${token}` } });
  assert.equal(authorized(request('anything')), false);
  values.set('MONITOR_TOKEN', 'short'); assert.equal(authorized(request('short')), false);
  values.set('MONITOR_TOKEN', 'test-key-'.repeat(8));
  assert.equal(authorized(request('test-key-'.repeat(8))), true);
  assert.equal(authorized(request('incorrect')), false);
  const body = '{"jurisdiction":"wales"}';
  assert.equal(verify(body, sign(body)), true); assert.equal(verify(body + ' ', sign(body)), false);
});
test('only enabled published production can touch monitoring storage', () => {
  values.set('MONITOR_ENABLED', 'true');
  assert.equal(configReady(production), true);
  assert.equal(configReady({ deploy: { context: 'deploy-preview', published: false } }), false);
  assert.equal(configReady({ deploy: { context: 'production', published: false } }), false);
  values.set('MONITOR_ENABLED', 'false'); assert.equal(configReady(production), false);
});
test('report endpoint denies unauthorized requests without accessing storage', async () => {
  const response = await report(new Request('https://example.com/report'), production);
  assert.equal(response.status, 401); assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('preview scheduling and unsigned workers cannot dispatch or write', async () => {
  values.set('MONITOR_ENABLED', 'true');
  const preview = { deploy: { context: 'deploy-preview', published: false } };
  const response = await scheduler(new Request('https://example.com/schedule'), preview);
  assert.equal((await response.json()).status, 'inactive');
  assert.equal(await worker(new Request('https://example.com/worker', { method: 'POST', body: '{}' }), production), undefined);
});
