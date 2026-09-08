(() => {
  const $ = id => document.getElementById(id);
  let report;
  const names = { 'australia-nsw': 'New South Wales', 'australia-victoria': 'Victoria', 'canada-ontario': 'Ontario', 'canada-british-columbia': 'British Columbia', 'united-states-california': 'California', 'united-states-new-york': 'New York' };
  const name = value => names[value] || value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const date = value => value ? new Date(value).toLocaleString() : 'Never successfully checked';
  const node = (tag, text, className) => { const el = document.createElement(tag); el.textContent = text; if (className) el.className = className; return el; };
  const link = (text, url) => { const el = node('a', text); try { const u = new URL(url); if (u.protocol === 'https:') { el.href = u.href; el.target = '_blank'; el.rel = 'noopener noreferrer'; } } catch {} return el; };
  $('month').value = new Date().toISOString().slice(0, 7);
  function display(data) {
    if (!data || !Array.isArray(data.reports) || !data.reports.every(r => typeof r.jurisdiction === 'string' && Array.isArray(r.results))) throw new Error('This is not a monitoring report.');
    report = data; $('report').hidden = false;
    $('reportTitle').textContent = `${data.environment === 'local' ? 'Local check' : 'Monthly report'} · ${data.runId.slice(0, 7)}`;
    $('scope').textContent = data.scope;
    $('message').textContent = `Report loaded · ${date(data.generatedAt)}. ${data.environment === 'local' ? 'The production schedule is not activated by this local check.' : ''}`;
    $('location').replaceChildren(new Option('All locations', 'all'), ...data.reports.map(r => new Option(name(r.jurisdiction), r.jurisdiction)));
    render();
  }
  function render() {
    if (!report) return;
    const batches = report.reports.filter(r => $('location').value === 'all' || r.jurisdiction === $('location').value);
    const results = batches.flatMap(r => r.results.map(result => ({ ...result, location: r.jurisdiction })));
    $('stats').replaceChildren(...[['Observations', results.length], ['Changes detected', results.filter(x => x.status === 'changed').length], ['Failed checks', results.filter(x => x.status === 'failed').length], ['New baselines', results.filter(x => x.status === 'baseline').length]].map(([title, count]) => { const el = node('div', '', 'stat'); el.append(node('strong', count), node('span', title)); return el; }));
    $('batches').replaceChildren(...batches.map(r => node('span', `${name(r.jurisdiction)} · ${r.status} · ${r.results.length}/${r.total}${r.dispatch?.status === 'failed' ? ' · dispatch failed' : ''}`, 'batch')));
    const filter = $('status').value;
    const shown = results.filter(r => filter === 'all' || (filter === 'attention' ? r.needsReview : r.status === filter));
    $('results').replaceChildren(...shown.map(r => {
      const article = node('article', '', 'source'); article.append(node('span', r.status === 'failed' ? 'Check failed' : r.status, `badge ${r.status}`));
      const title = node('h3', ''); title.append(link(r.title, r.url)); article.append(title);
      article.append(node('p', `${name(r.location)} · ${r.publisher} · ${r.category}`, 'metadata'), node('p', r.detail), node('p', `Last successful check: ${date(r.lastSuccessfulCheckAt)}${r.consecutiveFailures ? ` · Consecutive failures: ${r.consecutiveFailures}` : ''}`, 'metadata'));
      if (r.limitation) article.append(node('p', r.limitation));
      if (r.pendingChange) article.append(node('p', `Unreviewed source changes first detected ${date(r.pendingChange.firstDetectedAt)}. These remain flagged even when a later check finds no further change.`));
      if (r.change) {
        const details = node('details', ''); details.append(node('summary', 'View change evidence'));
        if (r.change.beforeExcerpt) details.append(node('p', `Previously: ${r.change.beforeExcerpt}`));
        if (r.change.afterExcerpt) details.append(node('p', `Now: ${r.change.afterExcerpt}`));
        if (r.change.redirected) details.append(node('p', 'The source destination changed.'));
        for (const url of r.change.addedLinks || []) { const p = node('p', 'New link: '); p.append(link(url, url)); details.append(p); }
        article.append(details);
      }
      const refs = (r.references || []).filter(ref => ref.jurisdiction === r.location);
      article.append(node('p', r.coverageNote, 'metadata'));
      if (refs.length) { const details = node('details', ''); details.append(node('summary', `${refs.length} directly linked learning resources`)); const ul = node('ul', ''); refs.forEach(ref => ul.append(node('li', ref.title))); details.append(ul); article.append(details); }
      return article;
    }));
    if (!shown.length) $('results').append(node('p', results.length ? 'No observations match this filter. New baselines are available under “All observations”.' : 'No source checks recorded for this selection. Check the batch status above.', 'empty'));
  }
  $('location').addEventListener('change', render); $('status').addEventListener('change', render);
  $('reportForm').addEventListener('submit', async event => {
    event.preventDefault(); const button = event.submitter; button.disabled = true; $('message').textContent = 'Loading report…';
    try { const response = await fetch(`/.netlify/functions/source-monitor-report?month=${encodeURIComponent($('month').value)}`, { headers: { Authorization: `Bearer ${$('token').value}` }, cache: 'no-store', redirect: 'error' });
      if (!response.ok) throw new Error(response.status === 401 ? 'The monitoring access key was not accepted.' : `Report unavailable (HTTP ${response.status}). On the local site, use a saved report.`);
      display(await response.json());
    } catch (error) { $('message').textContent = error.message; } finally { button.disabled = false; }
  });
  $('reportFile').addEventListener('change', async () => { try { const file = $('reportFile').files[0]; if (!file) return; if (file.size > 10 * 1024 * 1024) throw new Error('Report exceeds 10 MiB.'); display(JSON.parse(await file.text())); } catch (error) { $('message').textContent = error.message; } });
  $('download').addEventListener('click', () => { const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })); const a = node('a', ''); a.href = url; a.download = `source-monitor-${report.runId}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
  if (['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname)) fetch('/output/monitoring/latest.json', { cache: 'no-store' }).then(r => { if (r.ok) return r.json(); }).then(data => { if (data) display(data); }).catch(() => {});
})();
