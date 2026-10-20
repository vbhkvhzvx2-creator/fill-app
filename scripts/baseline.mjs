import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
const root = process.cwd();
const baselinePath = resolve(root, '.quality/baseline.json');
const protectedFiles = ['js/model.js','js/repository.js','js/app.js','js/screens.js','js/ui.js','js/supabase-config.js','js/supabase-auth.js','styles.css','index.html','public/manifest.webmanifest','public/sw.js','public/icons/icon.svg','public/icons/icon-192.png','public/icons/icon-512.png','public/images/site-roof.png','public/images/login-worker-reference.png','public/images/marco-avatar.png'];
const mode = process.argv[2] ?? 'check';
const digest = (path) => createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');
if (mode === 'freeze') {
  const hashes = Object.fromEntries(protectedFiles.filter((path) => existsSync(resolve(root, path))).map((path) => [path, digest(path)]));
  mkdirSync(dirname(baselinePath), { recursive: true });
  writeFileSync(baselinePath, `${JSON.stringify({ version: 1, createdAt: new Date().toISOString(), hashes }, null, 2)}\n`);
  console.log(`Baseline congelata per ${Object.keys(hashes).length} moduli protetti.`); process.exit(0);
}
if (!existsSync(baselinePath)) { console.error('Baseline assente: esegui tutti i test, revisione inclusa, e poi npm run freeze:baseline.'); process.exit(2); }
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')); const errors = [];
for (const [path, expected] of Object.entries(baseline.hashes ?? {})) {
  if (!existsSync(resolve(root, path))) errors.push(`${path}: file protetto eliminato`);
  else if (digest(path) !== expected) errors.push(`${path}: contenuto diverso dalla baseline approvata`);
}
if (errors.length) { console.error('CONTROLLO BASELINE FALLITO: codice protetto modificato.\n' + errors.map((item) => ` - ${item}`).join('\n')); console.error('Non aggiornare la baseline per nascondere una regressione. Correggi, riesegui i gate e approva esplicitamente la nuova versione.'); process.exit(1); }
console.log(`Baseline OK: ${Object.keys(baseline.hashes ?? {}).length} file protetti invariati.`);
