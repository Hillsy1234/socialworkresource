import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {locations,submit,publicTopics,publicThread,moderationQueue,moderate,createMonthly,keyFor,resourceUrl} from '../lib/model.mjs';
import {publicApi,moderatorApi,makeChallenge,validChallenge,consumeLimit} from '../lib/http.mjs';
import {monthlyScenario} from '../lib/scenarios.mjs';
const now='2026-09-09T12:00:00.000Z',month=now.slice(0,7);
function memory(){const map=new Map();let version=0;return {map,get:async key=>structuredClone(map.get(key)||null),list:async prefix=>[...map.keys()].filter(k=>k.startsWith(prefix)),set:async(key,data,options={})=>{const old=map.get(key);if(options.onlyIfNew&&old || options.onlyIfMatch&&old?.etag!==options.onlyIfMatch)return {modified:false};const etag=String(++version);map.set(key,{data:structuredClone(data),etag});return {modified:true,etag};}};}
const topic=(location='wales',extra={})=>({kind:'topic',location,category:'general',title:'A useful learning question',body:'A fictional question about learning and reflection.',author:'Example learner',acknowledged:true,requestId:randomUUID(),...extra});
async function approve(store,kind,id,parentId=''){const record=await store.get(keyFor(kind,id,parentId));return moderate(store,{kind,id,parentId,etag:record.etag,action:'approve',note:'Checked the fictional learning contribution.',checked:true},now);}
async function published(store,location='wales'){const result=await submit(store,topic(location),{now});await approve(store,'topic',result.id);return result.id;}
test('community supports every location in the existing selector and has no separate flag mapping',async()=>{
  const code=await readFile(new URL('../../location-chooser.js',import.meta.url),'utf8');const actual=vm.runInNewContext(`${code}\npracticeLocations.map(p=>p.id)`);
  assert.deepEqual(new Set(locations),new Set(['all',...actual]));assert.equal(actual.length,12);
});
test('pending topics and injected publication status stay private until an explicit approval',async()=>{
  const store=memory(),result=await submit(store,topic('wales',{status:'approved',moderatorNote:'bypass',fictional:true}),{now,clientHash:'private'});
  assert.equal((await publicTopics(store,{month})).items.length,0);
  await assert.rejects(publicThread(store,result.id),e=>e.status===404);
  const queue=await moderationQueue(store,{month});assert.equal(queue.items.length,1);assert.equal(queue.items[0].status,'pending');assert.equal(queue.items[0].fictional,undefined);
  await assert.rejects(moderate(store,{...queue.items[0],action:'approve',note:'Valid note',checked:false},now),/Confirm/);
  await approve(store,'topic',result.id);const thread=await publicThread(store,result.id);
  assert.equal(thread.topic.body,'A fictional question about learning and reflection.');
  for(const key of ['fingerprint','moderatorNote','history','etag','status'])assert.equal(thread.topic[key],undefined);
});
test('all 12 location filters include shared topics and exclude other local topics',async()=>{
  const store=memory();await published(store,'all');for(const location of locations.slice(1))await published(store,location);
  for(const location of locations.slice(1)){const result=await publicTopics(store,{month,location});assert.equal(result.items.length,2);assert.ok(result.items.every(t=>t.location===location||t.location==='all'));}
  assert.equal((await publicTopics(store,{month,location:'all'})).items.length,13);
});
test('replies require an approved open parent and local replies inherit its jurisdiction',async()=>{
  const store=memory(),id=await published(store);const input=topic('wales',{kind:'reply',parentId:id});
  const result=await submit(store,input,{now});assert.equal((await publicThread(store,id)).items.length,0);
  await approve(store,'reply',result.id,id);assert.equal((await publicThread(store,id)).items.length,1);
  await assert.rejects(submit(store,{...input,requestId:randomUUID(),location:'england'},{now}),/location/);
  const record=await store.get(keyFor('topic',id));await moderate(store,{kind:'topic',id,etag:record.etag,action:'lock',note:'Close replies for review.'},now);
  await assert.rejects(submit(store,{...input,requestId:randomUUID()},{now}),/not accepting/);
});
test('removing a topic hides all replies and erases its text without allowing old approvals',async()=>{
  const store=memory(),id=await published(store),reply=await submit(store,topic('wales',{kind:'reply',parentId:id}),{now});await approve(store,'reply',reply.id,id);
  const record=await store.get(keyFor('topic',id));await moderate(store,{kind:'topic',id,etag:record.etag,action:'remove',note:'Remove for confidentiality review.'},now);
  assert.equal((await publicTopics(store,{month})).items.length,0);await assert.rejects(publicThread(store,id),e=>e.status===404);
  const removed=(await store.get(keyFor('topic',id))).data;for(const key of ['title','body','author','url'])assert.equal(removed[key],'');
  await assert.rejects(moderate(store,{kind:'topic',id,etag:record.etag,action:'approve',checked:true,note:'Trying an old decision.'},now),e=>e.status===409);
});
test('reports are private, targets must be public and resolving a report does not silently remove a post',async()=>{
  const store=memory(),id=await published(store);const result=await submit(store,{kind:'report',targetKind:'topic',targetId:id,reason:'unsafe-advice',body:'Please check this advice.',acknowledged:true,requestId:randomUUID()},{now});
  const queue=await moderationQueue(store,{month,status:'open'});assert.equal(queue.items.length,1);assert.equal((await publicTopics(store,{month})).items.length,1);
  await moderate(store,{kind:'report',id:result.id,etag:queue.items[0].etag,action:'resolve',note:'Checked and no removal required.'},now);
  assert.equal((await publicThread(store,id)).topic.id,id);
  const pending=await submit(store,topic(),{now});await assert.rejects(submit(store,{kind:'report',targetKind:'topic',targetId:pending.id,reason:'spam',acknowledged:true,requestId:randomUUID()},{now}),e=>e.status===404);
});
test('retrying a submission cannot duplicate it or overwrite another contribution',async()=>{
  const store=memory(),input=topic();const first=await submit(store,input,{now,clientHash:'one'});const second=await submit(store,input,{now,clientHash:'one'});assert.equal(first.id,second.id);assert.equal((await moderationQueue(store,{month})).items.length,1);
  await assert.rejects(submit(store,{...input,body:'A changed and different contribution.'},{now,clientHash:'one'}),e=>e.status===409);
});
test('queue pointers cannot collide across submission kinds or parent discussions',async()=>{
  const store=memory(),one=await published(store),two=await published(store),requestId=randomUUID();
  for(const parentId of [one,two])await submit(store,topic('wales',{kind:'reply',parentId,requestId}),{now});
  assert.equal((await moderationQueue(store,{month})).items.length,2);
});
test('scheduled and manual scenario preparation are idempotent and always start pending',async()=>{
  const store=memory(),scenario=monthlyScenario(month);const first=await createMonthly(store,scenario,now);assert.equal(first.created,true);assert.equal((await createMonthly(store,scenario,now)).created,false);assert.equal((await publicTopics(store,{month})).items.length,0);
  const item=(await moderationQueue(store,{month})).items[0];assert.equal(item.fictional,true);assert.equal(item.location,'all');await approve(store,'topic',item.id);
  await createMonthly(store,scenario,now);assert.equal((await publicTopics(store,{month})).items.length,1);
  for(let m=1;m<=12;m++)assert.match(monthlyScenario(`2026-${String(m).padStart(2,'0')}`).body,/FICTIONAL LEARNING SCENARIO/);
});
test('malformed references and unsafe resource links are rejected',async()=>{
  for(const link of ['javascript:alert(1)','http://example.com','https://127.0.0.1/x','https://169.254.169.254/','https://[::1]/','https://name:password@example.com','https://example.com:444/x'])assert.throws(()=>resourceUrl(link));
  assert.equal(resourceUrl('https://www.gov.uk/guidance#section'),'https://www.gov.uk/guidance');
  const store=memory();for(const overrides of [{location:'../x'},{category:'monthly-discussion'},{acknowledged:false},{title:'short'},{body:'a'.repeat(3001)},{category:'practice-resources',url:''}])await assert.rejects(submit(store,topic('wales',overrides),{now}));
  await assert.rejects(publicTopics(store,{month:'2026-13'}));assert.throws(()=>keyFor('reply','../../escape','other'));
});
test('public pagination, keyword search and month archives preserve filters',async()=>{
  const store=memory();for(let i=0;i<35;i++)await published(store);
  const first=await publicTopics(store,{month,location:'wales',category:'general',query:'fictional'});assert.equal(first.items.length,30);assert.ok(first.nextCursor);
  const second=await publicTopics(store,{month,location:'wales',category:'general',cursor:first.nextCursor});assert.equal(second.items.length,5);assert.equal(new Set([...first.items,...second.items].map(t=>t.id)).size,35);
  assert.equal((await publicTopics(store,{month:'2026-08'})).items.length,0);assert.equal((await publicTopics(store,{month,query:'nonexistentterm'})).items.length,0);
});
test('challenge signatures bind to client and time; atomic limits cannot be raced',async()=>{
  const secret='test'.repeat(16),ip='192.0.2.1',token=makeChallenge(secret,ip,'2026-09-09T11:59:55.000Z');
  assert.equal(validChallenge(token,secret,ip,now),true);assert.equal(validChallenge(token,secret,'different',now),false);assert.equal(validChallenge(token+'x',secret,ip,now),false);assert.equal(validChallenge(makeChallenge(secret,ip,now),secret,ip,now),false);assert.equal(validChallenge(token,secret,ip,'2026-09-09T15:00:00Z'),false);
  const store=memory();const outcomes=await Promise.allSettled(Array.from({length:15},()=>consumeLimit(store,'rate/test',5)));assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,5);assert.equal((await store.get('rate/test')).data.count,5);
});
test('HTTP rejects cross-origin, missing consent, honeypots and oversized bodies without publishing',async()=>{
  const store=memory(),secret='test'.repeat(16),ip='192.0.2.1',challenge=makeChallenge(secret,ip,'2026-09-09T11:59:55.000Z');
  const req=(input,origin='https://site.example')=>new Request('https://site.example/.netlify/functions/community',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(input)});
  const args={store,secret,ip,now};
  assert.equal((await publicApi(req({...topic(),challenge},'https://evil.example'),args)).status,403);
  assert.equal((await publicApi(req({...topic(),challenge,website:'spam'}),args)).status,400);
  assert.equal((await publicApi(req({...topic(),challenge,acknowledged:false}),args)).status,400);
  assert.equal((await publicApi(req({...topic(),challenge,body:'x'.repeat(15000)}),args)).status,413);
  assert.equal((await publicApi(req({...topic(),challenge}),args)).status,202);assert.equal((await publicTopics(store,{month})).items.length,0);
});
test('moderator API exposes review context but never the private submission fingerprint',async()=>{
  const store=memory(),id=await published(store);const response=await moderatorApi(new Request(`https://site.example/admin?action=item&kind=topic&id=${id}`),{store,now});const item=await response.json();assert.equal(item.id,id);assert.ok(item.etag);assert.equal(item.fingerprint,undefined);
});
