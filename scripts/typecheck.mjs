import { readdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const allowed = new Set(['.js', '.mjs']);
const ignoreDirs = new Set(['dist', 'node_modules', '.git']);
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    if (entry.isDirectory() && !ignoreDirs.has(entry.name)) result.push(...await walk(resolve(dir, entry.name)));
    else if (entry.isFile() && allowed.has(extname(entry.name))) result.push(resolve(dir, entry.name));
  }
  return result;
}
const files = (await walk(root)).sort();
const errors = [];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) errors.push(`${file.replace(`${root}/`, '')}\n${result.stderr || result.stdout}`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Controllo sintattico OK: ${files.length} file JavaScript verificati con Node.js.`);
