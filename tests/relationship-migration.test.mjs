import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sql = await readFile(resolve(root, 'supabase/migrations/20261025_p1_explicit_relationships.sql'), 'utf8');

test('P1 migration adds explicit nullable job-to-site relationship', () => {
  assert.match(sql, /alter table public\.jobs\s+add column if not exists site_id uuid/i);
  assert.match(sql, /jobs_site_same_client_fk[\s\S]*foreign key \(owner_id, client_id, site_id\)[\s\S]*references public\.sites \(owner_id, client_id, id\)/i);
});

test('P1 migration keeps invoice and site client identities consistent', () => {
  assert.match(sql, /invoices_site_same_client_fk[\s\S]*foreign key \(owner_id, client_id, site_id\)[\s\S]*references public\.sites \(owner_id, client_id, id\)/i);
  assert.match(sql, /esistono fatture collegate a un cantiere di un cliente diverso/i);
});

test('P1 migration prevents linking a deadline to another client job', () => {
  assert.match(sql, /deadlines_job_same_client_fk[\s\S]*foreign key \(owner_id, client_id, job_id\)[\s\S]*references public\.jobs \(owner_id, client_id, id\)/i);
  assert.match(sql, /scadenze collegate a un intervento di un cliente diverso/i);
});

test('P1 migration is transactional and preserves destructive-delete guards', () => {
  assert.match(sql, /\nbegin;\s/i);
  assert.match(sql, /on delete restrict/i);
  assert.match(sql, /commit;\s*$/i);
});
