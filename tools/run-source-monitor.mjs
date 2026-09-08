import { readFile, writeFile, mkdir, rename, open, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runJurisdiction, POLICY_VERSION } from '../monitoring/lib/engine.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const registry = JSON.parse(await readFile(join(root, 'monitoring/sources.json'), 'utf8'));
const args = process.argv.slice(2);
const selected = args[0] ?? 'all';
const jurisdictions = selected === 'all' ? registry.jurisdictions : [selected];
if (args.length > 1 || jurisdictions.some(j => !registry.jurisdictions.includes(j))) throw new Error('Usage: npm run monitor:run -- [all|jurisdiction]');
const directory = join(root, '.monitor-data', `policy-${POLICY_VERSION}`);
await mkdir(directory, { recursive: true });
const lockPath = join(directory, 'local.lock');
const lock = await open(lockPath, 'wx').catch(() => { throw new Error('A local monitor is already running. If it was terminated, remove .monitor-data/local.lock before restarting.'); });
const store = {
  async get(key) { try { return JSON.parse(await readFile(join(directory, `${key}.json`), 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } },
  async set(key, value) {
    const path = join(directory, `${key}.json`); await mkdir(dirname(path), { recursive: true });
    await writeFile(`${path}.tmp`, JSON.stringify(value)); await rename(`${path}.tmp`, path);
  }
};
const runId = `${new Date().toISOString().slice(0, 7)}-local-${Date.now().toString(36)}`;
const reports = [];
const output = join(root, 'output/monitoring'); await mkdir(output, { recursive: true });
async function save() {
  const payload = { runId, generatedAt: new Date().toISOString(), environment: 'local', sourceCount: registry.sources.length, scope: 'Local checks only. No deployed schedule or learning content has been changed.', reports };
  await writeFile(join(output, 'latest.json'), JSON.stringify(payload, null, 2));
  await writeFile(join(output, `${runId}.json`), JSON.stringify(payload, null, 2));
  const rows = reports.map(r => `| ${r.jurisdiction} | ${r.summary.baseline} | ${r.summary.changed} | ${r.summary.unchanged} | ${r.summary.failed} |`);
  await writeFile(join(output, 'latest.md'), `# Local monthly-source-monitor check\n\nRun: ${runId}\n\nSelected sources only. Baselines are not professional reviews.\n\n| Location | Baselines | Changes | Unchanged | Failed |\n|---|---:|---:|---:|---:|\n${rows.join('\n')}\n\n${reports.flatMap(r => r.results.filter(x => x.status === 'failed').map(x => `- ${r.jurisdiction}: [${x.title}](${x.url}) — ${x.detail}`)).join('\n')}\n`);
}
try {
  // Three independent locations at once; each publisher is checked sequentially within a location.
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(3, jurisdictions.length) }, async () => {
    while (next < jurisdictions.length) {
      const jurisdiction = jurisdictions[next++];
      console.log(`Checking ${jurisdiction}…`);
      const report = await runJurisdiction({ registry, jurisdiction, runId, store, fetchImpl: fetch });
      reports.push(report);
      console.log(`${jurisdiction}: ${JSON.stringify(report.summary)}`);
    }
  }));
  await save();
  console.log(`Report: ${join(output, 'latest.md')}`);
} finally { await lock.close(); await rm(lockPath); }
