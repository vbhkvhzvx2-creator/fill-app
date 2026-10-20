/**
 * Configurazione pubblica Supabase per il client PWA.
 *
 * È previsto l'uso nel browser: la publishable key NON è una password e non
 * sostituisce l'autenticazione. Proteggere tutte le tabelle con RLS e usare
 * soltanto una chiave sb_publishable_... in questo modulo.
 * Non inserire mai qui sb_secret_..., service_role o credenziali PostgreSQL.
 */
export const SUPABASE_CONFIG = Object.freeze({
  url: 'https://ykumlaitukrxwkyetlzg.supabase.co',
  publishableKey: 'sb_publishable_GWRB242lukX5vuhUOBkx7w_U3-sJbLx',
});

export const SUPABASE_REST_URL = `${SUPABASE_CONFIG.url}/rest/v1`;

export function isSupabaseConfigValid(config = SUPABASE_CONFIG) {
  try {
    const url = new URL(config.url);
    return url.protocol === 'https:'
      && url.hostname.endsWith('.supabase.co')
      && typeof config.publishableKey === 'string'
      && config.publishableKey.startsWith('sb_publishable_')
      && config.publishableKey.length > 'sb_publishable_'.length;
  } catch {
    return false;
  }
}
