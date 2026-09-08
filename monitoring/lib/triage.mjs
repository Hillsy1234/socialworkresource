import {canonicalUrl} from './discovery.mjs';

const domainScopes = [
  ['gov.im', [], 'Isle of Man'],
  ['gov.wales', ['wales'], 'Wales'], ['socialcare.wales', ['wales'], 'Wales'],
  ['gov.scot', ['scotland'], 'Scotland'], ['sssc.uk.com', ['scotland'], 'Scotland'],
  ['socialworkengland.org.uk', ['england'], 'England'],
  ['health-ni.gov.uk', ['northern-ireland'], 'Northern Ireland'], ['nidirect.gov.uk', ['northern-ireland'], 'Northern Ireland'], ['niscc.info', ['northern-ireland'], 'Northern Ireland'],
  ['gov.ie', ['ireland'], 'Ireland'], ['coru.ie', ['ireland'], 'Ireland'],
  ['govt.nz', ['new-zealand'], 'New Zealand'],
  ['nsw.gov.au', ['australia-nsw'], 'New South Wales'], ['vic.gov.au', ['australia-victoria'], 'Victoria'], ['aasw.asn.au', ['australia-nsw','australia-victoria'], 'Australia'],
  ['ontario.ca', ['canada-ontario'], 'Ontario'], ['ocswssw.org', ['canada-ontario'], 'Ontario'],
  ['gov.bc.ca', ['canada-british-columbia'], 'British Columbia'], ['bccsw.ca', ['canada-british-columbia'], 'British Columbia'],
  ['ca.gov', ['united-states-california'], 'California'], ['ny.gov', ['united-states-new-york'], 'New York'], ['nysed.gov', ['united-states-new-york'], 'New York'],
  ['gov.uk', ['england','wales','scotland','northern-ireland'], 'United Kingdom']
];
const topics = [
  ['children', /\b(child(?:ren)?|famil(?:y|ies)|foster|adoption|childcare)\b/i],
  ['safeguarding', /\b(safeguard\w*|abuse|neglect|adult protection)\b/i],
  ['mca', /\b(mental capacity|incapacity|decision.making|consent|guardianship|power(?:s)? of attorney)\b/i],
  ['dols', /\b(deprivation of liberty|liberty protection|dols|restraint|restrictions)\b/i],
  ['mha', /\b(mental health|psychiatr\w*|compulsory treatment)\b/i],
  ['care-support', /\b(social care|care and support|carers?|disability|disabilities|assessment)\b/i],
  ['foundations', /\b(professional standards|registration|ethics|competenc\w*|code of practice|social work practice)\b/i],
  ['rights', /\b(human rights|privacy|data protection|equality|indigenous|maori|māori|cultural)\b/i],
  ['cpd-log', /\b(cpd|continuing education|professional development|training|webinar)\b/i]
];
const hostMatches = (host, root) => host === root || host.endsWith('.'+root);
const ranks = {'review-first':0, 'verify':1, 'background':2};
export const priorityLabels = {'review-first':'Review first', verify:'Check relevance', background:'Background / lower priority'};

export function triageFinding(finding, {registry, catalog, observations = [], asOf}) {
  const url = canonicalUrl(finding.url);
  const host = url ? new URL(url).hostname : '';
  const title = String(finding.title || '');
  const text = `${title}\n${finding.snippet || ''}`;
  const reasons = [], cautions = [];
  const matched = registry.sources.filter(s => s.jurisdictions.includes(finding.jurisdiction) && canonicalUrl(s.url) === url && url);
  const sourceIds = new Set(matched.map(s=>s.id));
  // Correlate with the selected month's observations, not a newer report or a search snippet.
  const observed = observations.filter(o => sourceIds.has(o.sourceId));
  const changed = observed.filter(o => o.status === 'changed' || o.pendingChange);
  const failed = observed.some(o=>o.status === 'failed');
  const unchanged = observed.length > 0 && observed.every(o=>o.status === 'unchanged' && !o.pendingChange);
  const scope = domainScopes.find(([domain])=>hostMatches(host, domain));
  const mismatch = Boolean(scope && !scope[1].includes(finding.jurisdiction));
  const knownPublisher = registry.sources.some(s=>s.jurisdictions.includes(finding.jurisdiction) && hostMatches(host,new URL(s.url).hostname.replace(/^www\./,'')));
  const primaryDomain = Boolean(scope && !mismatch);
  const topicIds = topics.filter(([,pattern])=>pattern.test(text)).map(([id])=>id);
  const relevant = topicIds.length > 0 || /\b(social work(?:er)?s?|legislation|statutory|regulator)\b/i.test(text);
  const changeSignal = /\b(new (?:law|legislation|guidance|requirements?|standards?|regulations?)|amend(?:ed|ment|ments)|revised|updated guidance|comes? into force|commencement|effective from|judgment|ruling|reform)\b/i.test(text) || /\b(?:(?:public|open|launched|launches) consultation|consultation (?:on|opens|closes|deadline)|consulting on|call for (?:evidence|views))\b/i.test(text);
  const job = /\b(job vacancy|vacanc(?:y|ies)|apply for (?:this|the) (?:job|role)|salary|recruitment)\b/i.test(title) || hostMatches(host,'nhsjobs.com');
  const directory = /^(search|by subject|home|homepage|about(?: us| aasw)?|latest news|newsroom|news(?: and events)?|course catalogue|continuing education providers)(?:\s*[|—–:-].*)?$/i.test(title.trim()) || (url && /^\/(search|cms\/legislation\/index)(\/|$)/.test(new URL(url).pathname));
  // Only use an explicit provider publication date; an Act's year or first-seen date is not its publication date.
  const published = /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(finding.providerDate || '') ? Date.parse(finding.providerDate) : NaN;
  const old = Number.isFinite(published) && Date.parse(asOf) - published > 365*86400000;
  if (changed.length) reasons.push('The registered-source monitor recorded a change or an unresolved change for this exact source.');
  if (primaryDomain) reasons.push(`Publisher domain is associated with ${scope[2]} government or the listed regulator/professional body.`);
  else if (knownPublisher) reasons.push('This publisher appears in the location’s source register.');
  else cautions.push('Publisher authority has not been established.');
  if (matched.length) reasons.push('This exact source is already in the source register.');
  if (topicIds.length) reasons.push('The title or search excerpt matches learning topics on the site.');
  if (changeSignal) reasons.push('The title or excerpt contains language about a possible change; it has not been verified against the full source.');
  if (mismatch) cautions.push(`Possible location mismatch: the publisher domain is associated with ${scope[2]}. Cross-border relevance needs checking.`);
  if (job) reasons.push('This appears to be a recruitment advert, rather than a practice update.');
  if (directory) reasons.push('This appears to be a general index, search page or directory.');
  if (unchanged) reasons.push('The selected month’s source check found no change in the monitored content.');
  if (failed) cautions.push('The direct source check failed; the source content needs verification.');
  if (old) cautions.push('The provider publication date is over a year old. Check whether there is a newer update.');
  if (!changed.length) cautions.push('Newly found does not mean newly published or changed; this is search evidence only.');
  let priority = 'verify';
  if (changed.length) priority = 'review-first';
  else if (job || directory || mismatch || (!relevant && !primaryDomain) || (unchanged && !changeSignal)) priority = 'background';
  else if (primaryDomain && relevant && changeSignal && !old) priority = 'review-first';
  const directRefs = matched.flatMap(s=>s.references || []).filter(r=>r.jurisdiction===finding.jurisdiction);
  const suggestedResources = (catalog[finding.jurisdiction] || []).flatMap(resource => {
    const direct = directRefs.some(ref=>ref.id===resource.id);
    if (!direct && !topicIds.includes(resource.topicId || resource.id)) return [];
    return [{id:resource.id,title:resource.title,basis:direct?'Directly references this source':'Suggested by topic match'}];
  });
  const score = (changed.length ? 100 : 0) + (primaryDomain ? 25 : knownPublisher ? 10 : 0) + (changeSignal ? 15 : 0) + (relevant ? 10 : 0) - (mismatch ? 35 : 0) - (job || directory ? 30 : 0) - (old ? 10 : 0);
  return {...finding, triage:{version:1,priority,label:priorityLabels[priority],score,reasons,cautions,suggestedResources,evidence:changed.map(o=>({sourceId:o.sourceId,status:o.status,checkedAt:o.checkedAt,change:o.change || null})),nextStep:changed.length ? 'Compare the recorded source change with the linked learning resources, then verify applicability and commencement before preparing an update.' : priority==='review-first' ? 'Open the original publication, verify what changed and when it applies, then compare the suggested learning resources.' : priority==='background' ? 'Keep for reference. Check only if there is a specific reason it may affect local practice.' : 'Check publisher authority, location and whether this is a substantive update before drafting any change.'}};
}
export function prioritiseFindings(findings, options) {
  return findings.map(f=>triageFinding(f,options)).sort((a,b)=>ranks[a.triage.priority]-ranks[b.triage.priority] || b.triage.score-a.triage.score || a.url.localeCompare(b.url));
}
export function triageCounts(findings) {
  return Object.fromEntries(Object.keys(ranks).map(priority=>[priority,findings.filter(f=>f.triage?.priority===priority).length]));
}
