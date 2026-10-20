import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const root = process.cwd();
const dist = resolve(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of ['index.html', 'styles.css']) await cp(resolve(root, file), resolve(dist, file));
await cp(resolve(root, 'js'), resolve(dist, 'js'), { recursive: true });
await cp(resolve(root, 'public'), dist, { recursive: true });
const required = ['index.html', 'styles.css', 'js/app.js', 'js/model.js', 'js/repository.js', 'js/ui.js', 'js/screens.js', 'js/supabase-config.js', 'js/supabase-auth.js', 'manifest.webmanifest', 'sw.js', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'images/site-roof.png', 'images/login-worker-reference.png', 'images/marco-avatar.png'];
const errors = [];
for (const relative of required) {
  try { if (!(await stat(resolve(dist, relative))).isFile()) errors.push(`${relative} non è un file`); }
  catch { errors.push(`${relative} mancante nella build`); }
}
const html = await readFile(resolve(dist, 'index.html'), 'utf8');
const css = await readFile(resolve(dist, 'styles.css'), 'utf8');
const manifest = JSON.parse(await readFile(resolve(dist, 'manifest.webmanifest'), 'utf8'));
for (const asset of manifest.icons ?? []) {
  const path = asset.src.replace(/^\//, '');
  try { await stat(resolve(dist, path)); } catch { errors.push(`Icona manifest mancante: ${asset.src}`); }
}
if ((css.match(/{/g) ?? []).length !== (css.match(/}/g) ?? []).length) errors.push('styles.css ha parentesi graffe non bilanciate');
if (!html.includes('href="./styles.css"')) errors.push('index.html non collega styles.css con percorso relativo');
if (!html.includes('src="./js/app.js"')) errors.push('index.html non collega js/app.js con percorso relativo');
const supabaseConfig = await readFile(resolve(dist, 'js/supabase-config.js'), 'utf8');
if (!supabaseConfig.includes('sb_publishable_')) errors.push('js/supabase-config.js non contiene una publishable key Supabase');
if (!supabaseConfig.includes('https://') || !supabaseConfig.includes('.supabase.co')) errors.push('js/supabase-config.js non contiene un Project URL HTTPS Supabase');
if (errors.length) {
  console.error('BUILD FALLITA:\n' + errors.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}
console.log(`Build statica completata: ${required.length} artefatti verificati in dist/.`);
