import test from 'node:test';
import assert from 'node:assert/strict';
import {triageFinding, prioritiseFindings, triageCounts} from '../lib/triage.mjs';
const registry = {sources:[{id:'care',url:'https://gov.wales/care',jurisdictions:['wales'],references:[{jurisdiction:'wales',id:'sources'}]}]};
const catalog = {wales:[{id:'sources',title:'Sources'},{id:'care-support',topicId:'care-support',title:'Care and support'},{id:'children',topicId:'children',title:'Children'}],england:[{id:'care-act',topicId:'care-support',title:'Care Act'}]};
const opts = {registry,catalog,observations:[],asOf:'2026-09-09T10:00:00Z'};
const lead = {id:'test',jurisdiction:'wales',url:'https://gov.wales/care',title:'Care and support',snippet:'',providerDate:''};
const assess = (finding={}, options={}) => triageFinding({...lead,...finding},{...opts,...options}).triage;

test('known source changes take priority, preserve evidence and do not mutate findings',()=>{
  const finding=structuredClone(lead), change={beforeExcerpt:'Old wording',afterExcerpt:'New wording'};
  const result=assess(finding,{observations:[{sourceId:'care',status:'changed',change}]});
  assert.equal(result.priority,'review-first');assert.deepEqual(result.evidence[0].change,change);
  assert.deepEqual(finding,lead);
  assert.match(result.suggestedResources.find(r=>r.id==='sources').basis,/Directly/);
  assert.match(result.suggestedResources.find(r=>r.id==='care-support').basis,/topic/);
});
test('unresolved changes remain prominent despite unchanged or failed subsequent checks',()=>{
  for(const status of ['unchanged','failed']) assert.equal(assess({}, {observations:[{sourceId:'care',status,pendingChange:{count:1}}]}).priority,'review-first');
  assert.equal(assess({}, {observations:[{sourceId:'care',status:'unchanged'}]}).priority,'background');
  assert.equal(assess({}, {observations:[{sourceId:'different',status:'changed'}]}).priority,'verify');
});
test('official change signals are leads to verify, not confirmed legislation changes',()=>{
  const result=assess({title:'Updated guidance on social care'});
  assert.equal(result.priority,'review-first'); assert.equal(result.evidence.length,0);
  assert.ok(result.reasons.some(r=>r.includes('not been verified')));
  assert.ok(result.cautions.some(r=>r.includes('search evidence only')));
  assert.equal(assess({url:'https://unknown.example/new',title:'New social care guidance'}).priority,'verify');
});
test('wrong jurisdiction and irrelevant adverts/directories stay available as background',()=>{
  for (const finding of [{url:'https://legislation.gov.im/a',jurisdiction:'ireland',title:'New legislation for children'}, {url:'https://nhsjobs.com/a',title:'Social worker'}, {title:'By Subject'}, {url:'https://unknown.example/a',title:'Garden furniture'}]) {
    assert.equal(assess(finding).priority,'background');
  }
  assert.ok(assess({url:'https://legislation.gov.im/a',jurisdiction:'ireland'}).cautions.some(c=>c.includes('Isle of Man')));
  assert.equal(assess({title:'Newsroom',snippet:'Public consultation on social care regulations'}).priority,'background');
});
test('routine consultation services and historic stakeholder consultation are not new policy consultations',()=>{
  for(const snippet of ['Ethics consultation service for social workers','Provides consultation and family violence supervision','Following consultation with stakeholders in 2019, the board approved CPD guidance']) {
    assert.equal(assess({snippet}).priority,'verify');
  }
  assert.equal(assess({title:'Public consultation on new social care regulations'}).priority,'review-first');
});
test('shared UK and Australian domains do not imply a false location mismatch',()=>{
  for (const jurisdiction of ['england','wales','scotland','northern-ireland']) assert.ok(!assess({url:'https://www.gov.uk/guidance',jurisdiction}).cautions.some(c=>c.includes('mismatch')));
  for (const jurisdiction of ['australia-nsw','australia-victoria']) assert.ok(!assess({url:'https://www.aasw.asn.au/practice',jurisdiction}).cautions.some(c=>c.includes('mismatch')));
  assert.ok(assess({url:'https://www.health-ni.gov.uk/a',jurisdiction:'england'}).cautions.some(c=>c.includes('mismatch')));
});
test('only explicit provider dates affect recency; an old Act year or first seen is not publication',()=>{
  assert.equal(assess({title:'Updated guidance: Children Act 1989',firstSeenAt:'2020-01-01'}).priority,'review-first');
  assert.equal(assess({title:'Updated guidance: Children Act 1989',providerDate:'2020-01-01'}).priority,'verify');
  assert.equal(assess({title:'Updated guidance: Children Act 1989',providerDate:'2026-09-01'}).priority,'review-first');
});
test('England topic suggestions use actual resource IDs and host matching respects domain boundaries',()=>{
  assert.equal(assess({jurisdiction:'england',title:'Social care guidance'}).suggestedResources[0].id,'care-act');
  assert.equal(assess({url:'https://gov.wales.evil.example/a',title:'Updated guidance on social care'}).priority,'verify');
  assert.equal(assess({url:'https://notgov.wales/a',title:'Updated guidance on social care'}).priority,'verify');
});
test('sorting is deterministic and preserves every candidate, including background',()=>{
  const findings=[{...lead,id:'bg',title:'By Subject'},{...lead,id:'check'}, {...lead,id:'high',title:'Updated guidance on social care'}];
  const result=prioritiseFindings(findings,opts);
  assert.deepEqual(result.map(f=>f.id),['high','check','bg']);
  assert.deepEqual(triageCounts(result),{'review-first':1,verify:1,background:1});
  assert.equal(findings[0].triage,undefined);
});
