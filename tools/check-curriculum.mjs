import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const normalize=s=>s.replace(/^\s*-\s+/gm,'').replace(/\s+/g,' ');
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const coverage=await json('docs/COUNTRY_CURRICULUM_COVERAGE.json');
const registry=await json('monitoring/sources.json');
const sources=new Map(registry.sources.map(s=>[s.url,s]));
const topics=['foundations','care-support','mca','dols','mha','safeguarding','children','rights'];
const locations=registry.jurisdictions.filter(id=>id!=='england');
assert.equal(coverage.topics.length,locations.length*topics.length);
for(const id of locations){
 const m=await json(`content/${id}/manifest.json`);
 const rows=coverage.topics.filter(t=>t.jurisdiction===id);
 assert.deepEqual(rows.map(t=>t.topic).sort(),[...topics].sort(),`${id}: eight distinct lessons`);
 for(const row of rows){
  const resource=m.resources.find(r=>r.id===row.topic);
  assert.equal(resource.path,row.path);
  const lesson=await readFile(row.path,'utf8');
  const deck=m.flashcardDecks.find(d=>d.id===row.topic);
  assert.equal(deck.cards.length,5);
  for(const card of deck.cards) assert.ok(normalize(lesson).includes(normalize(card.answer)),`${id}/${row.topic}: flashcard matches lesson`);
  const scenario=m.scenarioWorkouts.find(s=>s.title===resource.title);
  assert.ok(lesson.includes(scenario.summary)&&lesson.includes(scenario.reveal),`${id}/${row.topic}: case matches lesson`);
  assert.ok(m.studentPathwaySteps.some(s=>s.resource===row.topic),`${id}: linked pathway`);
  assert.ok(m.routeDetails[row.topic]?.action);
  assert.equal(resource.editorialExpandedAt,coverage.editorialDate);
  assert.equal(resource.practiceReviewedAt,null);
  for(const url of row.sourceUrls){
   assert.ok(lesson.includes(url),`${id}/${row.topic}: source in lesson`);
   assert.ok(sources.get(url)?.references.some(r=>r.jurisdiction===id&&r.id===row.topic),`${id}/${row.topic}: source monitored`);
  }
 }
}
console.log(`Curriculum coherence passed: ${coverage.topics.length} lessons, linked cases, cards, pathways and monitored sources.`);
