import { SUPABASE_CONFIG, isSupabaseConfigValid } from './supabase-config.js';

const SESSION_KEY = 'il-tuo-lavoro.supabase-session.v1';
const DEFAULT_TIMEOUT_MS = 8000;

function safeStorage() {
  try { return globalThis.localStorage; } catch { return undefined; }
}

function authMessage(message, status) {
  const text = String(message ?? '').toLowerCase();
  if (text.includes('invalid login credentials') || text.includes('invalid_credentials')) {
    return 'Email o password non corretti. Verifica le credenziali dell’utente in Supabase Authentication → Users.';
  }
  if (text.includes('email not confirmed')) {
    return 'Questa email non è ancora confermata. Completa la verifica ricevuta via email oppure conferma l’utente in Supabase per il test.';
  }
  if (text.includes('user not found')) return 'Utente non trovato in questo progetto Supabase. Controlla che sia presente in Authentication → Users.';
  if (text.includes('too many requests') || status === 429) return 'Troppi tentativi ravvicinati. Attendi qualche minuto e riprova.';
  if (text.includes('invalid refresh token') || text.includes('refresh token not found')) return 'La sessione è scaduta. Accedi di nuovo con email e password.';
  if (text.includes('signup is disabled')) return 'La registrazione è disabilitata. Crea l’utente dal pannello Supabase Authentication → Users.';
  if (status >= 500) return 'Il servizio di autenticazione Supabase ha un problema temporaneo. Riprova tra poco.';
  return message || 'Autenticazione non riuscita. Verifica le impostazioni del provider Email in Supabase.';
}

async function readResponse(response) {
  try { return await response.json(); } catch { return {}; }
}

/** Client Auth REST minimale: nessuna libreria esterna o download CDN. */
export function createSupabaseAuth({
  config = SUPABASE_CONFIG,
  storage = safeStorage(),
  fetchImpl = (...args) => globalThis.fetch(...args),
  timeoutMs = DEFAULT_TIMEOUT_MS,
  now = () => Date.now(),
} = {}) {
  function readSession() {
    try {
      const value = storage?.getItem(SESSION_KEY);
      if (!value) return null;
      const session = JSON.parse(value);
      if (typeof session?.access_token !== 'string' || typeof session?.refresh_token !== 'string') return null;
      return session;
    } catch { return null; }
  }

  function clearSession() {
    try { storage?.removeItem(SESSION_KEY); } catch { /* storage potrebbe essere disabilitato */ }
  }

  function saveSession(payload, previous = null) {
    if (!payload?.access_token || !payload?.refresh_token) {
      throw new Error('Supabase non ha restituito una sessione valida. Verifica il provider Email e riprova.');
    }
    const expiresAt = Number(payload.expires_at) || Math.floor(now() / 1000) + (Number(payload.expires_in) || 3600);
    const session = {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      token_type: payload.token_type || 'bearer',
      expires_at: expiresAt,
      user: payload.user || previous?.user || null,
    };
    try { storage?.setItem(SESSION_KEY, JSON.stringify(session)); }
    catch { throw new Error('Accesso riuscito ma il browser non consente di salvare la sessione. Abilita i dati del sito e riprova.'); }
    return session;
  }

  async function request(path, body, { accessToken, timeout = timeoutMs } = {}) {
    if (!isSupabaseConfigValid(config)) throw new Error('Configurazione Supabase non valida. Controlla Project URL e publishable key.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetchImpl(`${config.url}/auth/v1/${path}`, {
        method: 'POST',
        headers: {
          apikey: config.publishableKey,
          'content-type': 'application/json',
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(authMessage(result.msg || result.message || result.error_description || result.error, response.status));
      return result;
    } catch (error) {
      if (controller.signal.aborted || error?.name === 'AbortError') {
        throw new Error(`Supabase non risponde entro ${Math.round(timeout / 1000)} secondi. Verifica rete, Project URL e impostazioni del progetto.`);
      }
      if (error instanceof TypeError || /failed to fetch|networkerror/i.test(String(error?.message))) {
        throw new Error('Non riesco a raggiungere Supabase. Controlla la connessione, il Project URL e la Console del browser.');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async function signInWithPassword(email, password) {
    const cleanEmail = String(email ?? '').trim();
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Inserisci un indirizzo email valido.');
    if (typeof password !== 'string' || !password) throw new Error('Inserisci la password.');
    const payload = await request('token?grant_type=password', { email: cleanEmail, password });
    return saveSession(payload);
  }

  async function restoreSession() {
    const session = readSession();
    if (!session) { clearSession(); return null; }
    const secondsLeft = Number(session.expires_at) - Math.floor(now() / 1000);
    if (secondsLeft > 60) return session;
    if (!session.refresh_token) { clearSession(); return null; }
    try {
      const payload = await request('token?grant_type=refresh_token', { refresh_token: session.refresh_token }, { timeout: Math.min(timeoutMs, 3500) });
      return saveSession(payload, session);
    } catch (error) {
      // Evita il rimbalzo alla schermata di login mentre il token è ancora utilizzabile.
      if (secondsLeft > 5) return session;
      clearSession();
      throw error;
    }
  }

  async function sendPasswordReset(email, redirectTo = globalThis.location?.href) {
    const cleanEmail = String(email ?? '').trim();
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Inserisci prima l’indirizzo email nel campo Email.');
    const suffix = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : '';
    await request(`recover${suffix}`, { email: cleanEmail });
    return true;
  }

  async function signOut(session = readSession()) {
    clearSession();
    if (!session?.access_token) return;
    try { await request('logout?scope=global', {}, { accessToken: session.access_token, timeout: 2000 }); }
    catch { /* l'uscita locale deve essere immediata anche offline */ }
  }

  return { signInWithPassword, restoreSession, sendPasswordReset, signOut, clearSession, readSession };
}

export const supabaseAuth = createSupabaseAuth();
