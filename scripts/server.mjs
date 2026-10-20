import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const rootArgument = process.argv.find((arg) => arg.startsWith('--root='))?.slice('--root='.length);
const root = resolve(rootArgument || sourceRoot);
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

async function findFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const candidates = [resolve(root, `.${decoded}`), resolve(root, 'public', `.${decoded}`)];
  for (const candidate of candidates) {
    if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) continue;
    try { if ((await stat(candidate)).isFile()) return candidate; } catch { /* candidate not found */ }
  }
  return null;
}

createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`).pathname;
    const file = await findFile(pathname === '/' ? '/index.html' : pathname);
    if (!file) { response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); response.end('Risorsa non trovata'); return; }
    const data = await readFile(file);
    response.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff' });
    response.end(data);
  } catch (error) {
    console.error(error);
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Errore interno del server di sviluppo');
  }
}).listen(port, '0.0.0.0', () => console.log(`Il Tuo Lavoro disponibile su http://localhost:${port}`));
