import test from 'node:test';import assert from 'node:assert/strict';
import community from '../../netlify/functions/community.mts';
import moderator from '../../netlify/functions/community-moderate.mts';
import monthly from '../../netlify/functions/community-monthly.mts';
import {communityReady} from '../../netlify/functions/_shared/community-runtime.mts';
const values=new Map();globalThis.Netlify={env:{get:key=>values.get(key)}};
const production={deploy:{context:'production',published:true}},preview={deploy:{context:'deploy-preview',published:false}};
test('disabled deployments cannot read or write community data',async()=>{
  assert.equal(communityReady(production),false);assert.equal((await community(new Request('https://example.org/api'),production)).status,503);
  values.set('COMMUNITY_ENABLED','true');values.set('MONITOR_TOKEN','test-owner-key-'.repeat(4));assert.equal(communityReady(production),true);assert.equal(communityReady(preview),false);assert.equal((await community(new Request('https://example.org/api'),preview)).status,503);
});
test('unauthorized moderation is rejected before accessing storage and previews cannot prepare scenarios',async()=>{
  assert.equal((await moderator(new Request('https://example.org/admin'),production)).status,401);
  const request=new Request('https://example.org/admin',{headers:{Authorization:`Bearer ${values.get('MONITOR_TOKEN')}`}});assert.equal((await moderator(request,preview)).status,503);
  assert.equal((await monthly(new Request('https://example.org/monthly'),preview)).status,200);
});
