import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(resolve(root,p),'utf8');
const packs = ['england','wales','scotland','northern-ireland','ireland','new-zealand','australia-nsw','canada-ontario','united-states-california','australia-victoria','canada-british-columbia','united-states-new-york'].map(id => JSON.parse(read(`content/${id}/manifest.json`)));
for (const pack of packs) {
  assert.equal(pack.releaseStatus, 'final', `${pack.id}: release status`);
  const ids = new Set(pack.resources.map(x=>x.id));
  assert.equal(ids.size,26); assert.equal(pack.featuredIds.length,8);
  const target = id => assert(ids.has(id),`${pack.id}: missing resource ${id}`);
  for (const resource of pack.resources) {
    assert.equal(resource.jurisdiction,pack.id);
    assert(existsSync(resolve(root,resource.path)),resource.path);
    assert(read(resource.path).trim().length > 150,`${resource.id}: empty content`);
    assert(!/being developed|still being developed|introductory module summaries/.test(resource.summary + read(resource.path)),`${resource.id}: unfinished placeholder`);
    assert(!/\bpilot\b|draft (guide|pack)/i.test(resource.title+' '+resource.summary), `${pack.id}: old release wording`);
    assert(!/ — ([^—]+) — \1$/.test(resource.title), `${pack.id}: repeated heading`);
  }
  pack.featuredIds.forEach(target);
  for (const q of pack.routeQuestions) for (const id of q.routes) {target(id);assert(pack.routeDetails[id]);}
  for (const deck of pack.flashcardDecks) {target(deck.id);assert.equal(deck.cards.length,5);for (const c of deck.cards) assert(c.prompt && c.answer);}
  for (const x of pack.glossaryTerms) target(x.link);
  for (const x of pack.theoryLenses) x.links.forEach(target);
  for (const x of pack.childPracticeModels) x.links.forEach(target);
  for (const x of pack.scenarioWorkouts) {x.routes.forEach(target);assert(x.prompts.length && x.reveal);}
  for (const x of pack.studentPathwaySteps) target(x.resource);
  for (const x of pack.hypothesisSignals) for (const id of x.theories) assert(pack.theoryLenses.some(t=>t.id===id));
  for (const x of pack.childModelSignals) for (const id of x.models) assert(pack.childPracticeModels.some(t=>t.id===id));
  if (pack.id !== 'england') {
    assert.equal(pack.scenarioWorkouts.length,8); assert.equal(pack.printableTemplates.length,10);
    const expectedCountry = {wales:'Wales',scotland:'Scotland','northern-ireland':'Northern Ireland',ireland:'Ireland','new-zealand':'Aotearoa New Zealand','australia-nsw':'New South Wales','canada-ontario':'Ontario','united-states-california':'California','australia-victoria':'Victoria','canada-british-columbia':'British Columbia','united-states-new-york':'New York'}[pack.id];
    for (const x of pack.printableTemplates) {assert(x.fileName.toLowerCase().startsWith(`${pack.id}-`));assert(x.body.includes(`${expectedCountry} practice guide`));}
    const forbidden = pack.id === 'wales' ? /Section 42|Care Act|EHCP|CQC|ASYE/ : pack.id === 'scotland' ? /Section 42|EHCP|ASYE|Wales/ : pack.id === 'northern-ireland' ? /Section 42|EHCP|ASYE|Wales|Scotland/ : pack.id === 'ireland' ? /Section 42|EHCP|ASYE|Wales|Scotland|Northern Ireland/ : /Section 42|EHCP|ASYE|Scotland|Northern Ireland|Ireland/;
    for (const key of ['routeQuestions','routeDetails','scenarioWorkouts','printableTemplates','studentPathwaySteps','theoryLenses','childPracticeModels']) assert(!forbidden.test(JSON.stringify(pack[key])),`${key}: England data leak`);
    assert(pack.resources.every(x=>x.practiceReviewedAt===null));
    if (pack.id !== 'wales') {
      const tools = JSON.stringify(Object.fromEntries(Object.entries(pack).filter(([k])=>!['resources','hero','alerts','slug'].includes(k))));
      // Match imported/fabricated bodies, not valid phrases such as the Scottish
      // Social Care (Self-directed Support) Act or an NI Health and Social Care Trust.
      assert(!/Social Services and Well-being \(|Social Care (?:Wales|Victoria|Ontario|California|British Columbia|New York)|Care Inspectorate (?:Wales|Victoria|Ontario|California|British Columbia|New York)|section 126|section 128|\bALN\b|\bIDP\b|Cheshire West|Measure 2010|gov\.(Victoria|Ontario|California)/i.test(tools), `${pack.id}: copied Welsh rule or fabricated body`);
      assert(!/Mental Capacity Act 2005|\bIMCA\b|\bAMHP\b|Article 5 consent/.test(tools), `${pack.id}: imported England/Wales tool content`);
      assert.equal(pack.glossaryTerms.length,28);
      assert(pack.professionalBody && read(pack.resources.find(r=>r.id==='sources').path).includes(pack.professionalBody));
      for(const t of pack.printableTemplates) for(const m of t.body.matchAll(/https?:\/\/\S+/g)) assert(new URL(m[0]).hostname.includes('.'));
    }
  }
  console.log(`${pack.id}: content, tools, references and jurisdiction checks passed`);
}
const index=JSON.parse(read('answer-engine-index.json'));
assert.equal(index.resources.length,312);
for (const x of index.resources) {
  assert(x.interactiveUrl.includes(`jurisdiction=${x.jurisdiction}`));
  const html=read(new URL(x.htmlUrl).pathname.slice(1));
  assert(html.includes(`jurisdiction=${x.jurisdiction}&amp;resource=${x.id}`));
  if (x.jurisdiction!=='england') {assert(!html.includes('England focus.'));assert(!html.includes('"lastReviewed"'));}
}
const sitemap=read('sitemap.xml');
for(const pack of packs) {
 const path=`learning/${pack.id==='england'?'':pack.id+'/'}index.html`;
 assert(existsSync(resolve(root,path)), `${pack.id}: static index`);
 assert(sitemap.includes(`https://social-work-resource.netlify.app/${path.replace('index.html','')}`), `${pack.id}: sitemap index missing`);
}
console.log('312 static pages and indexed country links passed');
