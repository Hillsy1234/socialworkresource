import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const dest = join(root, 'dist');
await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
// Explicit public content boundary: no functions, reports, snapshots, or dependencies.
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && (/\.(html|css|js|md|json|txt|xml)$/i.test(entry.name) || entry.name === '_headers') &&
      !['package.json', 'package-lock.json', 'tsconfig.json'].includes(entry.name)) {
    await cp(join(root, entry.name), join(dest, entry.name));
  }
}
for (const directory of ['assets', 'content', 'learning', 'modules', 'practice-tools', 'marketing']) {
  await cp(join(root, directory), join(dest, directory), { recursive: true, filter: path => !path.endsWith('.DS_Store') });
}
await mkdir(join(dest, 'monitoring'));
for (const name of ['index.html', 'dashboard.js', 'dashboard.css']) await cp(join(root, 'monitoring', name), join(dest, 'monitoring', name));
console.log('Public site built in dist; monitoring data stays private.');
