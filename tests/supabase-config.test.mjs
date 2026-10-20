import test from 'node:test';
import assert from 'node:assert/strict';
import { SUPABASE_CONFIG, SUPABASE_REST_URL, isSupabaseConfigValid } from '../js/supabase-config.js';

test('Supabase project URL and publishable key are configured', () => {
  assert.equal(SUPABASE_CONFIG.url, 'https://ykumlaitukrxwkyetlzg.supabase.co');
  assert.equal(SUPABASE_CONFIG.publishableKey, 'sb_publishable_GWRB242lukX5vuhUOBkx7w_U3-sJbLx');
  assert.equal(SUPABASE_REST_URL, 'https://ykumlaitukrxwkyetlzg.supabase.co/rest/v1');
  assert.equal(isSupabaseConfigValid(), true);
});

test('Supabase config validation rejects insecure URLs and non-publishable keys', () => {
  assert.equal(isSupabaseConfigValid({ url: 'http://example.supabase.co', publishableKey: 'sb_publishable_example' }), false);
  assert.equal(isSupabaseConfigValid({ url: 'https://example.supabase.co', publishableKey: 'sb_secret_never-in-client' }), false);
  assert.equal(isSupabaseConfigValid({ url: 'not-a-url', publishableKey: 'sb_publishable_example' }), false);
});
