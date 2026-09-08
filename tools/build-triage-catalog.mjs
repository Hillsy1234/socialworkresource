import {readFile, writeFile} from 'node:fs/promises';
import registry from '../monitoring/sources.json' with {type:'json'};
const catalog = {};
for (const id of registry.jurisdictions) {
  const pack = JSON.parse(await readFile(new URL(`../content/${id}/manifest.json`, import.meta.url)));
  catalog[id] = pack.resources.map(({id, topicId, title}) => ({id, topicId, title}));
}
await writeFile(new URL('../monitoring/triage-catalog.json', import.meta.url), JSON.stringify(catalog, null, 2)+'\n');
console.log('Built learning-resource catalogue for discovery triage.');
