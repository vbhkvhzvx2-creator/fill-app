import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabaseAuth } from '../js/supabase-auth.js';
import { SUPABASE_CONFIG } from '../js/supabase-config.js';

class MemoryStorage {
  #items = new Map();
  getItem(key) { return this.#items.get(key) ?? null; }
  setItem(key, value) { this.#items.set(key, value); }
  removeItem(key) { this.#items.delete(key); }
}

function response(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

const validSession = {
  access_token: 'access-test-token', refresh_token: 'refresh-test-token', token_type: 'bearer',
  expires_in: 3600, user: { id: 'user-123', email: 'artigiano@example.com' },
};

test('login invia email/password a Supabase e salva la sessione', async () => {
  const storage = new MemoryStorage();
  let url = '';
  let options;
  const auth = createSupabaseAuth({ storage, fetchImpl: async (input, init) => { url = input; options = init; return response(validSession); } });
  const session = await auth.signInWithPassword(' artigiano@example.com ', 'Password-corretta!');
  assert.equal(url, `${SUPABASE_CONFIG.url}/auth/v1/token?grant_type=password`);
  assert.equal(options.headers.apikey, SUPABASE_CONFIG.publishableKey);
  assert.deepEqual(JSON.parse(options.body), { email: 'artigiano@example.com', password: 'Password-corretta!' });
  assert.equal(session.user.email, 'artigiano@example.com');
  assert.equal(auth.readSession().access_token, 'access-test-token');
});

test('credenziali non valide restituiscono un messaggio comprensibile e non creano una sessione', async () => {
  const storage = new MemoryStorage();
  const auth = createSupabaseAuth({ storage, fetchImpl: async () => response({ msg: 'Invalid login credentials' }, 400) });
  await assert.rejects(auth.signInWithPassword('artigiano@example.com', 'errata'), /Email o password non corretti/);
  assert.equal(auth.readSession(), null);
});

test('una sessione valida viene ripristinata senza richieste di rete', async () => {
  const storage = new MemoryStorage();
  storage.setItem('il-tuo-lavoro.supabase-session.v1', JSON.stringify({
    ...validSession, expires_at: Math.floor(Date.now() / 1000) + 1800,
  }));
  let calls = 0;
  const auth = createSupabaseAuth({ storage, fetchImpl: async () => { calls += 1; throw new Error('Non deve chiamare la rete'); } });
  const session = await auth.restoreSession();
  assert.equal(session.user.id, 'user-123');
  assert.equal(calls, 0);
});

test('una sessione scaduta usa il refresh token e salva i token nuovi', async () => {
  const storage = new MemoryStorage();
  storage.setItem('il-tuo-lavoro.supabase-session.v1', JSON.stringify({
    ...validSession, expires_at: Math.floor(Date.now() / 1000) - 30,
  }));
  let body;
  let url;
  const refreshed = { ...validSession, access_token: 'access-new', refresh_token: 'refresh-new', expires_in: 3600 };
  const auth = createSupabaseAuth({ storage, fetchImpl: async (input, options) => { url = input; body = JSON.parse(options.body); return response(refreshed); } });
  const session = await auth.restoreSession();
  assert.match(url, /token\?grant_type=refresh_token$/);
  assert.deepEqual(body, { refresh_token: 'refresh-test-token' });
  assert.equal(session.access_token, 'access-new');
  assert.equal(auth.readSession().refresh_token, 'refresh-new');
});

test('il recupero password richiede email e chiama endpoint Supabase', async () => {
  const storage = new MemoryStorage();
  let url;
  let body;
  const auth = createSupabaseAuth({ storage, fetchImpl: async (input, options) => { url = input; body = JSON.parse(options.body); return response({}); } });
  await assert.rejects(auth.sendPasswordReset(''), /Inserisci prima l’indirizzo email/);
  await auth.sendPasswordReset('artigiano@example.com', 'https://example.github.io/app/');
  assert.match(url, /\/auth\/v1\/recover\?redirect_to=/);
  assert.deepEqual(body, { email: 'artigiano@example.com' });
});

test('logout cancella la sessione locale anche quando la rete non risponde', async () => {
  const storage = new MemoryStorage();
  storage.setItem('il-tuo-lavoro.supabase-session.v1', JSON.stringify({ ...validSession, expires_at: 9999999999 }));
  const auth = createSupabaseAuth({ storage, fetchImpl: async () => { throw new TypeError('Failed to fetch'); } });
  await auth.signOut(auth.readSession());
  assert.equal(auth.readSession(), null);
});
