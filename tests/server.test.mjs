import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { once } from 'node:events';

const port = 43000 + (process.pid % 10000);
const baseUrl = `http://127.0.0.1:${port}`;

test('il server consegna app shell, moduli, manifest e asset PWA', async () => {
  const child = spawn(process.execPath, ['scripts/server.mjs'], { cwd: process.cwd(), env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.setEncoding('utf8');
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  try {
    const deadline = Date.now() + 6000;
    while (!stdout.includes('disponibile') && Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`Server terminato prima di avviarsi: ${stderr}`);
      await delay(80);
    }
    assert.match(stdout, /disponibile/);
    const routes = [
      ['/', 'text/html', 'Il Tuo Lavoro'],
      ['/styles.css', 'text/css', '.dashboard-grid'],
      ['/js/app.js', 'javascript', 'validateNewJob'],
      ['/js/screens.js', 'javascript', 'renderDashboard'],
      ['/js/supabase-auth.js', 'javascript', 'signInWithPassword'],
      ['/manifest.webmanifest', 'manifest\\+json', 'standalone'],
      ['/sw.js', 'javascript', 'APP_SHELL'],
      ['/icons/icon-192.png', 'image/png', ''],
      ['/images/site-roof.png', 'image/png', ''],
    ];
    for (const [path, contentType, bodyNeedle] of routes) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 200, `${path} deve rispondere 200`);
      assert.match(response.headers.get('content-type') ?? '', new RegExp(contentType));
      if (bodyNeedle) assert.ok((await response.text()).includes(bodyNeedle), `${path} non contiene ${bodyNeedle}`);
    }
    const missing = await fetch(`${baseUrl}/risorsa-inesistente`);
    assert.equal(missing.status, 404);
  } finally {
    child.kill('SIGTERM');
    try { await Promise.race([once(child, 'exit'), delay(1000)]); } catch { /* stop cleanup */ }
  }
});
