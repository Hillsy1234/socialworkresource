import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const registry = JSON.parse(await readFile(join(root, 'monitoring/sources.json'), 'utf8'));
const ids = new Set(), urls = new Set();
for (const source of registry.sources) {
  const url = new URL(source.url);
  if (url.protocol !== 'https:' || url.port || url.username || url.password || ids.has(source.id) || urls.has(source.url)) throw new Error(`Invalid or duplicate source: ${source.id}`);
  if (!source.publisher || !source.title || !source.coverageNote || !source.jurisdictions.length) throw new Error(`Incomplete source: ${source.id}`);
  if (!['legislation', 'policy', 'training', 'professional-standards'].includes(source.category)) throw new Error(`Unknown category: ${source.id}`);
  if (!['document', 'discovery'].includes(source.kind)) throw new Error(`Unknown source kind: ${source.id}`);
  for (const j of source.jurisdictions) if (!registry.jurisdictions.includes(j)) throw new Error(`Unknown jurisdiction: ${j}`);
  for (const ref of source.references) await access(join(root, ref.path));
  ids.add(source.id); urls.add(source.url);
}
for (const jurisdiction of registry.jurisdictions) {
  const sources = registry.sources.filter(s => s.jurisdictions.includes(jurisdiction));
  if (sources.length > 55) throw new Error(`Split ${jurisdiction} into smaller batches before adding more than 55 sources.`);
  if (!sources.some(s => s.kind === 'discovery') || !sources.some(s => s.category === 'training')) throw new Error(`Missing discovery/training coverage: ${jurisdiction}`);
}
console.log(`Monitoring register valid: ${ids.size} sources, ${registry.jurisdictions.length} locations.`);
