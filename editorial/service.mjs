import { createHash } from 'node:crypto';
export const REPOSITORY = 'Hillsy1234/socialworkresource';
export const BRANCH_PREFIX = 'codex/content-update-';
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export class ReviewError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const fail = (message, status = 400) => { throw new ReviewError(message, status); };
export function metadata(body, sources) {
  const matches = [...String(body ?? '').matchAll(/<!-- social-work-update\s*([\s\S]*?)-->/g)];
  if (matches.length !== 1) fail('The proposal needs one editorial review record.');
  let value; try { value = JSON.parse(matches[0][1]); } catch { fail('The editorial review record is invalid.'); }
  if (value.version !== 1 || !Array.isArray(value.sourceIds) || !value.sourceIds.length || value.sourceIds.length > 30 || new Set(value.sourceIds).size !== value.sourceIds.length || !value.sourceIds.every(id => sources.some(s => s.id === id))) fail('The proposal must identify registered sources.');
  for (const key of ['summary', 'reason', 'commencement']) if (typeof value[key] !== 'string' || value[key].trim().length < 10 || value[key].length > 4000) fail(`The proposal needs a clear ${key} explanation.`);
  return { version: 1, sourceIds: value.sourceIds, summary: value.summary, reason: value.reason, commencement: value.commencement };
}
export function allowedFile(path, jurisdictions) {
  if (typeof path !== 'string' || path.includes('..') || path.includes('\\')) return false;
  const parts = path.split('/');
  if (parts[0] === 'content' && jurisdictions.includes(parts[1])) return (parts.length === 3 && parts[2] === 'manifest.json') || (parts.length === 4 && parts[2] === 'resources' && /^[a-z0-9-]+\.md$/.test(parts[3]));
  if (parts[0] === 'learning' && jurisdictions.includes(parts[1]) && parts.length === 3) return /^[a-z0-9-]+\.html$/.test(parts[2]);
  if (/^modules\/[a-zA-Z0-9-]+\.md$/.test(path)) return true;
  const authored = [...jurisdictions.filter(x => x !== 'england').map(x => x.replaceAll('-', '_')), 'common', 'australian_common'];
  if (authored.some(name => path === `tools/curriculum/${name}.py`)) return true;
  return ['monitoring/sources.json', 'answer-engine-index.json', 'llms.txt', 'llms-full.txt', 'docs/COUNTRY_CURRICULUM_COVERAGE.json', 'docs/COUNTRY_CURRICULUM_SOURCE_ACCESS.json', 'docs/COUNTRY_CURRICULUM_REVIEW.md'].includes(path);
}
function proposal(pr) {
  return pr?.base?.ref === 'main' && pr?.base?.repo?.full_name === REPOSITORY && pr?.head?.repo?.full_name === REPOSITORY && pr.head.ref.startsWith(BRANCH_PREFIX);
}
function compact(pr) { return { number: pr.number, title: pr.title, url: pr.html_url, state: pr.state, draft: pr.draft, updatedAt: pr.updated_at, mergedAt: pr.merged_at }; }
export function createReviewService({ github, registry, store, publication }) {
  const api = path => `/repos/${REPOSITORY}${path}`;
  async function list(page = 1) {
    if (!Number.isInteger(page) || page < 1 || page > 100) fail('Invalid page.');
    const prs = await github(api(`/pulls?state=all&base=main&sort=updated&direction=desc&per_page=100&page=${page}`));
    return { proposals: prs.filter(proposal).map(pr=>{ let sourceIds=[];try{sourceIds=metadata(pr.body,registry.sources).sourceIds;}catch{}return {...compact(pr),sourceIds}; }), nextPage: prs.length === 100 ? page + 1 : null };
  }
  async function detail(number) {
    if (!Number.isSafeInteger(number) || number < 1) fail('Invalid proposal number.');
    const pr = await github(api(`/pulls/${number}`));
    if (!proposal(pr)) fail('This is not a content-update proposal for this site.', 404);
    const blockers = []; let record;
    try { record = metadata(pr.body, registry.sources); } catch (e) { blockers.push(e.message); }
    const files = [];
    if (pr.changed_files > 150) blockers.push('This proposal is too large for in-site approval. Split it into smaller updates.');
    else for (let page = 1; page <= 2; page++) {
      const batch = await github(api(`/pulls/${number}/files?per_page=100&page=${page}`)); files.push(...batch);
      if (batch.length < 100) break;
    }
    if (!files.length || files.length !== pr.changed_files) blockers.push('The complete set of edits could not be loaded.');
    for (const file of files) {
      if (!allowedFile(file.filename, registry.jurisdictions) || !['added', 'modified', 'removed'].includes(file.status)) blockers.push(`Requires a separate technical review: ${file.filename}`);
      const lines = typeof file.patch === 'string' ? file.patch.split('\n') : [];
      if (!lines.length || lines.filter(s => s.startsWith('+')).length !== file.additions || lines.filter(s => s.startsWith('-')).length !== file.deletions) blockers.push(`A complete text comparison is unavailable: ${file.filename}`);
    }
    const oversized = files.reduce((n, f) => n + (f.patch?.length ?? 0), 0) > 800000;
    if (oversized) blockers.push('The comparison is too large for in-site approval. Split the proposal.');
    let validation = 'Not yet passed';
    if (pr.state === 'open') {
      try {
        const runs = await github(api(`/actions/workflows/content-review.yml/runs?head_sha=${pr.head.sha}&event=push&per_page=100`));
        const run = runs.workflow_runs.filter(r => r.head_sha === pr.head.sha && r.head_branch === pr.head.ref && r.event === 'push' && r.path === '.github/workflows/content-review.yml').sort((a,b) => b.id - a.id)[0];
        validation = run ? (run.conclusion ?? run.status) : 'Waiting for validation';
        if (!run || run.status !== 'completed' || run.conclusion !== 'success') blockers.push('The content validation workflow must pass for this exact version.');
      } catch { blockers.push('Content validation could not be verified.'); }
      if (pr.draft) blockers.push('The editor has not marked this proposal ready for review.');
      if (pr.mergeable !== true || !['clean', 'unstable'].includes(pr.mergeable_state)) blockers.push('GitHub has not confirmed that this proposal can be merged. Refresh after checks finish, or resolve its branch requirements.');
    } else blockers.push(pr.merged ? 'This proposal has already been approved and merged.' : 'This proposal is closed.');
    const changes = files.map(f => ({ path: f.filename, status: f.status, additions: f.additions, deletions: f.deletions, patch: oversized ? 'Comparison too large. Split this proposal before review.' : (f.patch ?? '') }));
    const reviewDigest = digest({ number, title: pr.title, head: pr.head.sha, base: pr.base.sha, record, changes });
    const audit = await store.get(`editorial/${number}/${pr.head.sha}`);
    const deployment = pr.merged ? await publication(pr.merge_commit_sha) : null;
    return { ...compact(pr), merged: pr.merged, head: pr.head.sha, base: pr.base.sha, record, sources: (record?.sourceIds ?? []).map(id => { const s=registry.sources.find(x=>x.id===id); return { id:s.id,title:s.title,url:s.url,jurisdictions:s.jurisdictions }; }), changes, validation, blockers: [...new Set(blockers)], reviewDigest, audit: audit ? { action:audit.action, requestedAt:audit.requestedAt } : null, deployment };
  }
  async function decide(input) {
    if (!['approve', 'reject'].includes(input?.action) || input.confirmed !== true || typeof input.reviewDigest !== 'string' || !/^[a-f0-9]{64}$/.test(input.reviewDigest)) fail('Review the proposal and confirm your decision.');
    const current = await detail(input.number);
    if (current.merged) return { outcome: 'merged', proposal: current }; // Reconcile an interrupted successful request.
    if (current.state !== 'open') fail('This proposal is no longer open.',409);
    if (current.reviewDigest !== input.reviewDigest || current.head !== input.head) fail('This proposal changed after you opened it. Reload and review the new version.',409);
    if (input.action === 'approve' && current.blockers.length) fail(current.blockers.join(' '),409);
    const key = `editorial/${input.number}/${current.head}`;
    // An audit failure stops the write to GitHub. GitHub remains authoritative after an uncertain network response.
    await store.set(key, { action: input.action, requestedAt: new Date().toISOString(), actor: 'Monitoring access-key holder', head: current.head, base: current.base, reviewDigest: current.reviewDigest });
    if (input.action === 'reject') {
      await github(api(`/pulls/${input.number}`), { method:'PATCH', body:{state:'closed'} });
      return { outcome:'rejected' };
    }
    const result = await github(api(`/pulls/${input.number}/merge`), { method:'PUT', body:{sha:current.head,merge_method:'squash',commit_title:`${current.title} (#${input.number})`} });
    if (!result.merged) fail('GitHub did not merge the update. Refresh to check its current status.',409);
    return { outcome:'merged', commit:result.sha };
  }
  return {list,detail,decide};
}
export function githubClient(token, fetchImpl = fetch) {
  return async (path, options = {}) => {
    if (!path.startsWith(`/repos/${REPOSITORY}/`)) fail('Invalid repository request.');
    let response;
    try { response = await fetchImpl(`https://api.github.com${path}`, { method:options.method ?? 'GET', redirect:'error', signal:AbortSignal.timeout(8000), headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10','Content-Type':'application/json'}, ...(options.body ? {body:JSON.stringify(options.body)} : {}) }); }
    catch { fail('GitHub did not return a confirmed result. Refresh the proposal before trying again.',502); }
    if (!response.ok) fail(response.status === 409 || response.status === 405 ? 'GitHub could not merge this version. Refresh the proposal and resolve its checks or conflicts.' : `GitHub request failed (HTTP ${response.status}). Check the approval connection.`,response.status === 409 ? 409 : 502);
    return response.json();
  };
}
export async function publishedRelease(commit, siteUrl, github, fetchImpl = fetch) {
  try {
    const u = new URL('/release.json',siteUrl);u.searchParams.set('check',String(Date.now()));
    const response = await fetchImpl(u,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(6000)});
    if (!response.ok) return {state:'unconfirmed'};
    const release = await response.json();
    if (!/^[a-f0-9]{40}$/.test(release.commit)) return {state:'unconfirmed'};
    if (release.commit === commit) return {state:'live',publishedCommit:release.commit};
    const comparison = await github(`/repos/${REPOSITORY}/compare/${commit}...${release.commit}`);
    return {state:comparison.status==='identical'?'live':comparison.status==='ahead'?'included':'pending',publishedCommit:release.commit};
  } catch { return {state:'unconfirmed'}; }
}
