import { mkdir, writeFile } from 'node:fs/promises';
import registry from '../monitoring/sources.json' with { type: 'json' };
import { searchPlans } from '../monitoring/lib/discovery.mjs';
import { prioritiseFindings, triageCounts } from '../monitoring/lib/triage.mjs';
import catalog from '../monitoring/triage-catalog.json' with {type:'json'};
const runId = '2026-09';
const at = '2026-09-09T10:00:00Z';
const reports = registry.jurisdictions.map(jurisdiction => ({ jurisdiction, status: 'not-run', total: registry.sources.filter(s => s.jurisdictions.includes(jurisdiction)).length, results: [] }));
const discoveryReports = registry.jurisdictions.map(jurisdiction => ({
  jurisdiction, status: jurisdiction === 'wales' ? 'partial' : 'complete',
  queries: searchPlans(jurisdiction, runId, at).map((plan, index) => ({ ...plan, status: jurisdiction === 'wales' && index === 4 ? 'failed' : 'complete', pages: 1, limited: index === 0, ...(jurisdiction === 'wales' && index === 4 ? { error: 'Example: provider rate limit prevented this query.' } : {}) })),
  candidates: [{ id: `demo-${jurisdiction}`, jurisdiction, title: `FICTIONAL EXAMPLE — ${jurisdiction} guidance lead`, url: 'https://example.org/fictional-search-result', snippet: 'Demonstration only: this shows where a search excerpt would appear. It is not a real policy or legislation update.', firstSeenAt: at, lastSeenAt: at, providerDate: '', publisherKnown: false, registeredSourceIds: [], categories: ['guidance'], queryIds: [`${jurisdiction}-guidance`], needsReview: true }]
}));
await mkdir('output/monitoring', { recursive: true });
await writeFile('output/monitoring/discovery-demo.json', JSON.stringify({ demo: true, environment: 'local', runId, generatedAt: at, scope: 'Fictional demonstration — no web search has been run.', reports, discovery: { ready: false, status: 'demo', message: 'Fictional demonstration. Production web-search discovery is not activated.', reports: discoveryReports } }, null, 2));
console.log('Fictional discovery report written to ignored output/monitoring/discovery-demo.json');
const triageReports = structuredClone(discoveryReports);
triageReports.find(r=>r.jurisdiction==='wales').candidates.push(
  {id:'fictional-high',jurisdiction:'wales',title:'FICTIONAL EXAMPLE — updated guidance on social care',url:'https://gov.wales/fictional-example-not-a-real-publication',snippet:'Fictional classifier example only.',categories:['guidance']},
  {id:'fictional-background',jurisdiction:'wales',title:'FICTIONAL EXAMPLE — job vacancy',url:'https://example.org/fictional-vacancy',snippet:'Fictional recruitment example only.',categories:['training']}
);
for (const batch of triageReports) {
  batch.candidates=prioritiseFindings(batch.candidates,{registry,catalog,observations:[],asOf:at});
  batch.triageCounts=triageCounts(batch.candidates);
}
await writeFile('output/monitoring/triage-demo.json',JSON.stringify({demo:true,environment:'local',runId,generatedAt:at,scope:'Fictional prioritisation demonstration — no searches were run.',reports,discovery:{message:'Fictional prioritisation demonstration.',reports:triageReports}},null,2));
console.log('Fictional prioritisation report written to ignored output/monitoring/triage-demo.json');
