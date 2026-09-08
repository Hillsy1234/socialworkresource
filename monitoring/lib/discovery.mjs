import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

// Fixed public queries only: no case notes, access keys or user input go to the provider.
export const locations = {
  england: ['England', 'GB', 'gov.uk', 'socialworkengland.org.uk'],
  wales: ['Wales', 'GB', 'gov.wales', 'socialcare.wales'],
  scotland: ['Scotland', 'GB', 'gov.scot', 'sssc.uk.com'],
  'northern-ireland': ['Northern Ireland', 'GB', 'health-ni.gov.uk', 'niscc.info'],
  ireland: ['Ireland', 'IE', 'gov.ie', 'coru.ie'],
  'new-zealand': ['New Zealand', 'NZ', 'legislation.govt.nz', 'swrb.govt.nz'],
  'australia-nsw': ['New South Wales Australia', 'AU', 'nsw.gov.au', 'aasw.asn.au'],
  'australia-victoria': ['Victoria Australia', 'AU', 'vic.gov.au', 'aasw.asn.au'],
  'canada-ontario': ['Ontario Canada', 'CA', 'ontario.ca', 'ocswssw.org'],
  'canada-british-columbia': ['British Columbia Canada', 'CA', 'gov.bc.ca', 'bccsw.ca'],
  'united-states-california': ['California United States', 'US', 'ca.gov', 'bbs.ca.gov'],
  'united-states-new-york': ['New York United States', 'US', 'ny.gov', 'op.nysed.gov']
};
const topics = [
  ['legislation', 'social work safeguarding child protection mental health legislation amendments commencement updates'],
  ['policy', 'social work social care child welfare policy reforms updates'],
  ['guidance', 'social work safeguarding mental capacity statutory guidance guidelines consultations'],
  ['standards', 'social work professional standards registration ethics continuing competence changes'],
  ['training', 'social work CPD continuing education training webinars'],
  ['case-law', 'social work child protection mental health court judgments rulings case law']
];
export const MAX_PAGES = 1; // Tavily has no offset pagination; each query returns at most 20 results.
export const MAX_ATTEMPTS = 3;
export const MAX_MONTHLY_REQUESTS = 288;
const countries = { GB: 'united kingdom', IE: 'ireland', NZ: 'new zealand', AU: 'australia', CA: 'canada', US: 'united states' };
const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 32);
const clean = (value, max) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : '';
export function canonicalUrl(value) {
  try {
    if (typeof value !== 'string' || value.length > 2048) return null;
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || isIP(url.hostname) || !url.hostname.includes('.') || /(^|\.)(localhost|local|internal|test|invalid)$/.test(url.hostname)) return null;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
    url.searchParams.sort();
    return url.href;
  } catch { return null; }
}
export function searchPlans(jurisdiction, runId, asOf = `${runId}-01T00:00:00Z`) {
  if (!Object.hasOwn(locations, jurisdiction) || !/^\d{4}-(0[1-9]|1[0-2])$/.test(runId)) throw new Error('Invalid discovery location or month.');
  const [label, country, government, regulator] = locations[jurisdiction];
  const end = new Date(asOf);
  if (!Number.isFinite(end.getTime())) throw new Error('Invalid discovery date.');
  const place = `"${label.replace(/ (Australia|Canada|United States)$/, '')}"`;
  const start = new Date(end.getTime() - 90 * 86400000);
  const freshness = `${start.toISOString().slice(0, 10)}to${end.toISOString().slice(0, 10)}`;
  return [
    ...topics.map(([category, terms]) => ({ id: `${jurisdiction}-${category}`, jurisdiction, country, category, query: `${place} ${terms}`, freshness })),
    { id: `${jurisdiction}-government`, jurisdiction, country, category: 'government-discovery', query: `${place} social work safeguarding child protection mental health legislation policy guidance`, domains: [government] },
    { id: `${jurisdiction}-regulator`, jurisdiction, country, category: 'regulator-discovery', query: `${place} social workers standards registration CPD training`, domains: [regulator] }
  ];
}
export async function searchPage(plan, page, { apiKey, fetchImpl = fetch }) {
  if (!apiKey) throw new Error('Search API key is missing.');
  if (page !== 0) throw new Error('Tavily does not support offset pagination.');
  const [start_date, end_date] = plan.freshness?.split('to') || [];
  const body = {
    query: plan.query, country: countries[plan.country], topic: 'general', search_depth: 'basic',
    auto_parameters: false, max_results: 20, include_answer: false, include_raw_content: false,
    include_images: false, include_usage: true, language: 'en',
    ...(start_date ? { start_date, end_date } : {}), ...(plan.domains ? { include_domains: plan.domains } : {})
  };
  let response;
  try {
    response = await fetchImpl('https://api.tavily.com/search', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body), redirect: 'error', signal: AbortSignal.timeout(20000) });
  } catch { throw new Error('Search connection failed or timed out.'); }
  if (!response.ok) throw new Error(`Search provider returned HTTP ${response.status}.`);
  if (Number(response.headers.get('content-length')) > 2 * 1024 * 1024) throw new Error('Search response exceeds size limit.');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Search response is empty.');
  const chunks = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > 2 * 1024 * 1024) { await reader.cancel(); throw new Error('Search response exceeds size limit.'); }
    chunks.push(value);
  }
  let data;
  try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new Error('Search response is not valid JSON.'); }
  if (!Array.isArray(data?.results)) throw new Error('Search provider did not return a usable result set.');
  const items = data.results;
  if (items.length > 20) throw new Error('Search provider exceeded the requested result limit.');
  const results = items.flatMap(item => {
    const url = canonicalUrl(item?.url); if (!url) return [];
    return [{ url, title: clean(item.title, 250) || url, snippet: clean(item.content, 600), providerDate: clean(item.published_date, 80) }];
  });
  return { results, more: false, limited: items.length === 20, omitted: items.length - results.length, credits: Number.isFinite(data.usage?.credits) ? data.usage.credits : null };
}

export async function runDiscovery({ registry, runId, store, apiKey, fetchImpl = fetch, now = () => new Date().toISOString(), pause = ms => new Promise(resolve => setTimeout(resolve, ms)), budgetMs = 11 * 60 * 1000 }) {
  const started = Date.now();
  registry.jurisdictions.forEach(id => searchPlans(id, runId));
  let stop = false;
  const reports = [];
  for (const jurisdiction of registry.jurisdictions) {
    const reportKey = `discovery/reports/${runId}/${jurisdiction}`;
    const prior = await store.get(reportKey);
    if (prior?.status === 'complete' && prior.provider === 'tavily') { reports.push(prior); continue; }
    const plans = searchPlans(jurisdiction, runId, prior?.startedAt || now());
    const report = { runId, jurisdiction, provider: 'tavily', status: 'running', startedAt: prior?.startedAt || now(), updatedAt: now(), queries: [], candidates: [], requestAttempts: 0 };
    const candidates = new Map();
    await store.set(reportKey, report);
    for (const plan of plans) {
      const query = { ...plan, status: 'complete', pages: 0, limited: false, omitted: 0 };
      for (let page = 0; page < MAX_PAGES; page++) {
        const key = `discovery/tavily/checkpoints/${runId}/${plan.id}/${page}`;
        let checkpoint = await store.get(key);
        if (!checkpoint?.result) {
          if (stop || Date.now() - started > budgetMs) { query.status = 'not-run'; query.error = 'Search batch paused; rerun the monthly function to resume.'; stop = true; break; }
          if ((checkpoint?.attempts || 0) >= MAX_ATTEMPTS) { query.status = 'failed'; query.error = 'Three attempts used for this page. Check the provider and review this query manually.'; report.requestAttempts += checkpoint.attempts; break; }
          const usageKey = `discovery/usage/${runId}`;
          const usage = (await store.get(usageKey)) || { attempts: 0 };
          if (usage.attempts >= MAX_MONTHLY_REQUESTS) { query.status = 'not-run'; query.error = 'Monthly search request limit reached. Searches will resume next month.'; stop = true; break; }
          await store.set(usageKey, { attempts: usage.attempts + 1, updatedAt: now() });
          checkpoint = { attempts: (checkpoint?.attempts || 0) + 1, attemptedAt: now() };
          // Reserve each attempt before making a billable request. Successful pages are never requested again on resume.
          await store.set(key, checkpoint);
          await pause(1100);
          try { checkpoint.result = await searchPage(plan, page, { apiKey, fetchImpl }); }
          catch (error) {
            query.status = 'failed'; query.error = error.message;
            if (/HTTP (401|402|403|429|432|433)/.test(query.error)) stop = true;
          }
          await store.set(key, checkpoint);
        }
        report.requestAttempts += checkpoint.attempts;
        if (!checkpoint.result) break;
        query.pages++; query.omitted += checkpoint.result.omitted; query.limited ||= checkpoint.result.limited;
        for (const result of checkpoint.result.results) {
          const id = hash(result.url);
          let candidate = candidates.get(id);
          if (!candidate) {
            const seenKey = `discovery/seen/${jurisdiction}/${id}`;
            const previous = await store.get(seenKey);
            const registered = registry.sources.filter(source => source.jurisdictions.includes(jurisdiction) && canonicalUrl(source.url) === result.url);
            const publisherKnown = registry.sources.some(source => source.jurisdictions.includes(jurisdiction) && new URL(source.url).hostname === new URL(result.url).hostname);
            candidate = { ...result, id, jurisdiction, firstSeenAt: previous?.firstSeenAt || now(), lastSeenAt: now(), registeredSourceIds: registered.map(source => source.id), publisherKnown, queryIds: [], categories: [], needsReview: true };
            await store.set(seenKey, { firstSeenAt: candidate.firstSeenAt, lastSeenAt: candidate.lastSeenAt });
            candidates.set(id, candidate);
          }
          if (!candidate.queryIds.includes(plan.id)) candidate.queryIds.push(plan.id);
          if (!candidate.categories.includes(plan.category)) candidate.categories.push(plan.category);
        }
        if (!checkpoint.result.more) break;
        if (page === MAX_PAGES - 1) query.limited = true;
      }
      report.queries.push(query);
      report.candidates = [...candidates.values()];
      report.updatedAt = now();
      await store.set(reportKey, report);
    }
    report.status = report.queries.every(query => query.status === 'complete') ? 'complete' : 'partial';
    report.updatedAt = now();
    await store.set(reportKey, report);
    reports.push(report);
  }
  return reports;
}
