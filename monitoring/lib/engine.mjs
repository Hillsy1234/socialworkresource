import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

export const hash = value => createHash('sha256').update(value).digest('hex');
export const POLICY_VERSION = 3;
const MAX_BYTES = 4 * 1024 * 1024;
const clean = value => String(value).normalize('NFKC').replace(/\s+/g, ' ').trim();
const host = url => new URL(url).hostname.replace(/^www\./, '');

export function extractDocument(bytes, type, url) {
  if (type.includes('application/pdf') || bytes.subarray(0, 5).toString() === '%PDF-') {
    if (bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error('Invalid PDF response');
    return { hash: hash(bytes), text: '', links: [], mode: 'binary', title: 'PDF file', limitation: 'File fingerprint only. PDF text and legal effect need manual review.' };
  }
  if (!/html|xml|text\/plain|rss|atom/.test(type)) throw new Error(`Unsupported content type: ${type || 'missing'}`);
  const raw = bytes.toString('utf8');
  let text, title = '', links = [], mode = 'text';
  if (/xml|rss|atom/.test(type)) {
    if (/<!DOCTYPE|<!ENTITY/i.test(raw)) throw new Error('Unsupported XML entity declaration');
    if (XMLValidator.validate(raw) !== true) throw new Error('Invalid XML response');
    const parsed = new XMLParser({ ignoreAttributes: false }).parse(raw);
    const array = x => x ? (Array.isArray(x) ? x : [x]) : [];
    const entries = array(parsed.rss?.channel?.item ?? parsed.feed?.entry);
    if (entries.length) {
      const normalized = entries.map(item => {
        const href = typeof item.link === 'string' ? item.link : array(item.link).find(x => !x['@_rel'] || x['@_rel'] === 'alternate')?.['@_href'];
        if (href) { try { links.push(new URL(href, url).href); } catch {} }
        return { title: item.title, link: href, summary: item.description ?? item.summary, published: item.pubDate ?? item.published, updated: item.updated };
      }).sort((a, b) => String(a.link ?? a.title).localeCompare(String(b.link ?? b.title)));
      text = clean(JSON.stringify(normalized)); mode = 'feed';
    } else text = clean(raw);
  } else if (type.includes('html')) {
    const $ = load(raw);
    title = clean($('title').text());
    if (/just a moment|access denied|page not found|verify you are human|robot check|attention required|service unavailable/i.test(title)) throw new Error(`Publisher returned a challenge or error page: ${title.slice(0, 100)}`);
    // Some government sites wrap their entire article in an ASP.NET form.
    // Keep accordion button headings, which can contain substantive guidance.
    $('form').each((_, element) => {
      const form = $(element);
      if (!form.find('main,article,[role="main"]').length && form.find('table a[href]').length < 10 && clean(form.text()).length < 1000) form.remove();
    });
    $('script,style,noscript,nav,header,footer,aside,input,button[type="submit"],select,textarea,form[role="search"],dialog,[role="navigation"],[role="banner"],[role="contentinfo"],[hidden],[aria-hidden="true"],.cookie-banner,#cookie-banner,.cookie-consent,.breadcrumbs').remove();
    const primary = $('main,[role="main"]').first();
    const article = $('article').first();
    const scope = primary.length ? primary : article.length ? article : $('body');
    scope.find('a[href]').each((_, el) => { try {
      const target = new URL($(el).attr('href'), url); target.hash = '';
      if (target.protocol === 'https:') links.push(target.href);
    } catch {} });
    // Preserve boundaries between blocks; CSS/menus and generated scripts never enter the hash.
    scope.find('p,li,h1,h2,h3,h4,br,tr,section,div').each((_, el) => $(el).prepend(' ').append(' '));
    text = clean(scope.text());
    if (/^(enable javascript|please enable javascript|checking your browser|verify you are human)/i.test(text)) throw new Error('Page requires JavaScript or human verification');
  } else text = clean(raw);
  if (text.length < 100) throw new Error('Too little readable content; manual check needed');
  links = [...new Set(links)].sort();
  const limitation = /loading (?:events|courses|results)|please enable javascript/i.test(text) ? 'Some content loads dynamically and was not checked. Review the source in a browser.' : null;
  return { hash: hash(JSON.stringify({ text, links })), text, links, mode, title, limitation };
}

export async function fetchDocument(source, { fetchImpl = fetch, allowedHosts, timeoutMs = 12000 } = {}) {
  const allowed = allowedHosts ?? new Set([host(source.url)]);
  const signal = AbortSignal.timeout(timeoutMs);
  let url = source.url;
  for (let i = 0; i < 5; i++) {
    const target = new URL(url);
    if (target.protocol !== 'https:' || target.username || target.password || target.port || !allowed.has(host(url))) throw new Error('Redirect outside approved HTTPS source hosts; review destination');
    const response = await fetchImpl(url, { redirect: 'manual', signal, headers: { 'User-Agent': 'SocialWorkResourceMonitor/1.0 (+https://social-work-resource.netlify.app/monitoring/)', Accept: 'text/html, application/rss+xml, application/atom+xml, application/xml, application/pdf, text/plain;q=0.8' } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location'); await response.body?.cancel();
      if (!location) throw new Error('Redirect missing location');
      url = new URL(location, url).href; continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`HTTP ${response.status}`); }
    if (Number(response.headers.get('content-length')) > MAX_BYTES) { await response.body?.cancel(); throw new Error('Source exceeds 4 MiB limit; manual check needed'); }
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Empty response');
    const chunks = []; let length = 0;
    try {
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        length += value.length;
        if (length > MAX_BYTES) throw new Error('Source exceeds 4 MiB limit; manual check needed');
        chunks.push(value);
      }
    } finally { await reader.cancel().catch(() => {}); }
    return { ...extractDocument(Buffer.concat(chunks), response.headers.get('content-type')?.toLowerCase() ?? '', url), finalUrl: url };
  }
  throw new Error('Too many redirects');
}

export function compareObservation(previous, document, now) {
  const pending = previous?.pendingChange ?? null;
  if (!previous?.snapshot) return { status: 'baseline', pendingChange: pending, detail: 'First successful observation; this is a baseline, not confirmation that guidance is current.' };
  if (previous.policyVersion !== POLICY_VERSION || previous.snapshot.mode !== document.mode) return { status: 'rebaseline', pendingChange: pending ?? { firstDetectedAt: now, lastDetectedAt: now, count: 1, reason: 'Extraction method changed; compare manually.' }, detail: 'Extraction method changed. New baseline requires manual comparison.' };
  if (previous.snapshot.hash === document.hash && previous.snapshot.finalUrl === document.finalUrl) return { status: 'unchanged', pendingChange: pending, detail: 'No change detected in the monitored content since the previous successful check.' };
  const before = previous.snapshot;
  const addedLinks = document.links.filter(link => !before.links.includes(link));
  const words = document.text.split(' '), oldWords = before.text.split(' ');
  let start = 0; while (start < words.length && start < oldWords.length && words[start] === oldWords[start]) start++;
  return {
    status: 'changed',
    pendingChange: { firstDetectedAt: pending?.firstDetectedAt ?? now, lastDetectedAt: now, count: (pending?.count ?? 0) + 1 },
    detail: 'Source changed. Check applicability, commencement and impact before editing learning content.',
    change: { beforeHash: before.hash, afterHash: document.hash, beforeExcerpt: oldWords.slice(start, start + 22).join(' '), afterExcerpt: words.slice(start, start + 22).join(' '), addedLinks: addedLinks.slice(0, 30), addedLinkCount: addedLinks.length, redirected: before.finalUrl !== document.finalUrl }
  };
}

export async function checkSource(source, previous, { now = new Date().toISOString(), ...options } = {}) {
  const base = { sourceId: source.id, title: source.title, url: source.url, publisher: source.publisher, category: source.category, kind: source.kind, jurisdictions: source.jurisdictions, references: source.references, coverageNote: source.coverageNote, checkedAt: now };
  try {
    const document = await fetchDocument(source, options);
    const comparison = compareObservation(previous, document, now);
    const state = { policyVersion: POLICY_VERSION, snapshot: document, pendingChange: comparison.pendingChange, lastAttemptAt: now, lastSuccessfulCheckAt: now, consecutiveFailures: 0 };
    return { result: { ...base, ...comparison, lastSuccessfulCheckAt: now, consecutiveFailures: 0, mode: document.mode, limitation: document.limitation, finalUrl: document.finalUrl, needsReview: Boolean(comparison.pendingChange || document.limitation) || comparison.status === 'rebaseline' || document.mode === 'binary' }, state };
  } catch (error) {
    const state = { ...previous, lastAttemptAt: now, consecutiveFailures: (previous?.consecutiveFailures ?? 0) + 1 };
    return { result: { ...base, status: 'failed', detail: `${error.message}${error.cause?.code ? ` (${error.cause.code})` : ''}`.slice(0, 240), lastSuccessfulCheckAt: previous?.lastSuccessfulCheckAt ?? null, consecutiveFailures: state.consecutiveFailures, pendingChange: previous?.pendingChange ?? null, needsReview: true }, state };
  }
}

export async function runJurisdiction({ registry, jurisdiction, runId, store, fetchImpl, now = () => new Date().toISOString() }) {
  if (!registry.jurisdictions.includes(jurisdiction) || !/^\d{4}-(0[1-9]|1[0-2])(?:-local-[a-z0-9-]+)?$/.test(runId)) throw new Error('Invalid monitoring run');
  const reportKey = `reports/${runId}/${jurisdiction}`;
  const complete = await store.get(reportKey);
  if (complete?.status === 'complete') return complete;
  const startedAt = now();
  const deadline = Date.now() + 11 * 60 * 1000;
  const sources = registry.sources.filter(s => s.jurisdictions.includes(jurisdiction));
  const allowedHosts = new Set(registry.sources.map(s => host(s.url)));
  const results = [];
  // Source checkpoints are written before state so a retry can replay an interrupted commit.
  // The caller holds a per-jurisdiction lease; state is scoped to that jurisdiction.
  for (const source of sources) {
    if (Date.now() > deadline) throw new Error('Batch reached its time budget; resume from saved checkpoints.');
    const checkpointKey = `checks/${runId}/${jurisdiction}/${source.id}`;
    const stateKey = `states/${jurisdiction}/${source.id}`;
    let check = await store.get(checkpointKey);
    if (!check) {
      check = await checkSource(source, await store.get(stateKey), { fetchImpl, allowedHosts, now: now() });
      await store.set(checkpointKey, check);
    }
    await store.set(stateKey, check.state);
    results.push(check.result);
    await store.set(reportKey, { runId, jurisdiction, status: 'running', startedAt, updatedAt: now(), total: sources.length, results });
  }
  const report = { runId, jurisdiction, registryVersion: registry.version, status: 'complete', startedAt, completedAt: now(), total: sources.length, results, summary: summarize(results), notice: 'Automated source observations only. No learning content or professional review dates have been changed.' };
  await store.set(reportKey, report);
  return report;
}

export function summarize(results) {
  const count = status => results.filter(r => r.status === status).length;
  return { total: results.length, baseline: count('baseline'), unchanged: count('unchanged'), changed: count('changed'), failed: count('failed'), rebaseline: count('rebaseline'), needsReview: results.filter(r => r.needsReview).length };
}
