import { cloneInitialData, getClient, REFERENCE_DATE, validateNewJob } from './model.js';
import { repository } from './repository.js';
import { supabaseAuth } from './supabase-auth.js';
import { escapeHtml as e, icon } from './ui.js';
import { renderCalendar, renderClients, renderDashboard, renderDeadlines, renderLogin, renderModal, renderPin, renderSettings, renderSimpleModule, renderSite, renderToday } from './screens.js';

const root = document.querySelector('#root');
const state = {
  screen: 'login', modal: null, data: repository.load(),
  session: null,
  ui: { pin: '', pinError: false, showPassword: false, isLoggingIn: false, isSendingReset: false, filterOpen: false, clientQuery: '', clientKind: 'Tutti', deadlineTab: 'Tutte', month: 4, year: 2025, selectedDay: 27, siteTab: 'Dettagli', jobSearch: '', showJobClients: false, jobDraft: { clientId: '', type: 'Elettrico', date: REFERENCE_DATE, start: '14:00', end: '16:00', notes: '' }, formErrors: [], loginEmail: '', loginPassword: '', loginError: '', selectedClientId: null, toast: '', formError: '' },
};
let toastTimer;
let pinTimer;

function showToast(message) {
  state.ui.toast = message;
  render();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { state.ui.toast = ''; render(); }, 2800);
}

function saveData(updater, message = '') {
  const next = updater(state.data);
  try {
    repository.save(next);
    state.data = next;
    if (message) showToast(message); else render();
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Salvataggio non riuscito.');
  }
}

function navigate(next) {
  if (next === 'new-intervention') { openModal('intervention'); return; }
  state.screen = next;
  state.modal = null;
  state.ui.formErrors = [];
  state.ui.loginError = '';
  if (next === 'calendar') { state.ui.month = 4; state.ui.year = 2025; state.ui.selectedDay = 27; }
  render({ resetScroll: true });
}

function back() {
  if (state.modal) { state.modal = null; state.ui.formErrors = []; state.ui.formError = ''; render(); return; }
  if (state.screen === 'pin') { state.screen = 'login'; state.ui.pin = ''; state.ui.pinError = false; render(); return; }
  state.screen = 'dashboard';
  render({ resetScroll: true });
}

function openModal(name) {
  state.modal = name;
  state.ui.formErrors = [];
  state.ui.formError = '';
  state.ui.showJobClients = false;
  state.ui.jobSearch = '';
  if (name === 'intervention') state.ui.jobDraft = { clientId: '', type: 'Elettrico', date: REFERENCE_DATE, start: '14:00', end: '16:00', notes: '' };
  render();
}

function render({ resetScroll = false } = {}) {
  const oldPage = root.querySelector('.screen-page');
  const scrollTop = oldPage?.scrollTop ?? 0;
  const active = document.activeElement;
  const inputName = active?.dataset?.input;
  const selection = inputName && typeof active.selectionStart === 'number' ? active.selectionStart : null;
  let screenHtml;
  switch (state.screen) {
    case 'login': screenHtml = renderLogin(state.ui); break;
    case 'pin': screenHtml = renderPin(state.ui); break;
    case 'dashboard': screenHtml = renderDashboard(state.data); break;
    case 'today': screenHtml = renderToday(state.data); break;
    case 'calendar': screenHtml = renderCalendar(state.data, state.ui); break;
    case 'clients': screenHtml = renderClients(state.data, state.ui); break;
    case 'deadlines': screenHtml = renderDeadlines(state.data, state.ui); break;
    case 'settings': screenHtml = renderSettings(state.data); break;
    case 'site': screenHtml = renderSite(state.data, state.ui); break;
    case 'invoices': screenHtml = renderSimpleModule('Fatture'); break;
    case 'warehouse': screenHtml = renderSimpleModule('Magazzino'); break;
    default: screenHtml = renderDashboard(state.data);
  }
  if (state.screen === 'login' || state.screen === 'pin') root.innerHTML = `${screenHtml}${toastHtml()}`;
  else if (state.screen === 'dashboard') root.innerHTML = `<div class="app-frame">${screenHtml}</div>${state.modal ? renderModal(state.data, state.modal, state.ui) : ''}${toastHtml()}`;
  else root.innerHTML = `<div class="app-frame"><div class="app-device">${screenHtml}</div></div>${state.modal ? renderModal(state.data, state.modal, state.ui) : ''}${toastHtml()}`;
  if (!resetScroll) {
    const newPage = root.querySelector('.screen-page');
    if (newPage) newPage.scrollTop = scrollTop;
  }
  if (inputName) {
    const replacement = root.querySelector(`[data-input="${CSS.escape(inputName)}"]`);
    if (replacement) {
      replacement.focus({ preventScroll: true });
      if (selection !== null && typeof replacement.setSelectionRange === 'function') replacement.setSelectionRange(selection, selection);
    }
  }
}

function toastHtml() {
  return state.ui.toast ? `<div class="toast" role="status">${icon('checkCircle',19)}<span>${e(state.ui.toast)}</span><button data-action="toast-close" aria-label="Chiudi notifica">${icon('x',16)}</button></div>` : '';
}

function inputValue(formData, name) { return String(formData.get(name) ?? '').trim(); }

root.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const navButton = target?.closest('[data-nav]');
  if (navButton) { navigate(navButton.dataset.nav); return; }
  const control = target?.closest('[data-action]');
  if (!control) return;
  const action = control.dataset.action;
  if (action === 'modal-backdrop') { if (target === control) back(); return; }
  switch (action) {
    case 'back': back(); break;
    case 'show-password': state.ui.showPassword = !state.ui.showPassword; render(); break;
    case 'forgot-password': {
      if (state.ui.isSendingReset || state.ui.isLoggingIn) break;
      state.ui.loginError = ''; state.ui.isSendingReset = true; render();
      supabaseAuth.sendPasswordReset(state.ui.loginEmail).then(() => {
        state.ui.loginError = 'Se l’indirizzo è registrato, riceverai un link per reimpostare la password.';
      }).catch((error) => { state.ui.loginError = error instanceof Error ? error.message : 'Invio del link non riuscito.'; })
        .finally(() => { state.ui.isSendingReset = false; render(); });
      break;
    }
    case 'logout': {
      const session = state.session;
      state.session = null; state.screen = 'login'; state.modal = null;
      state.ui.loginPassword = ''; state.ui.loginError = ''; state.ui.loginEmail = '';
      state.ui.isLoggingIn = false; render({ resetScroll: true });
      void supabaseAuth.signOut(session);
      break;
    }
    case 'pin-digit': {
      if (state.ui.pin.length >= 4) break;
      state.ui.pin += control.dataset.digit;
      state.ui.pinError = false;
      render();
      if (state.ui.pin.length === 4) {
        clearTimeout(pinTimer);
        pinTimer = setTimeout(() => {
          if (state.ui.pin === '1234') { state.screen = 'dashboard'; state.ui.pin = ''; state.ui.pinError = false; render({ resetScroll: true }); }
          else { state.ui.pin = ''; state.ui.pinError = true; render(); }
        }, 160);
      }
      break;
    }
    case 'pin-delete': state.ui.pin = state.ui.pin.slice(0, -1); state.ui.pinError = false; render(); break;
    case 'pin-fingerprint': clearTimeout(pinTimer); state.ui.pin = ''; state.screen = 'dashboard'; render({ resetScroll: true }); showToast('Accesso demo eseguito.'); break;
    case 'modal-job': openModal('intervention'); break;
    case 'modal-client': openModal('client'); break;
    case 'modal-close': state.modal = null; state.ui.formErrors = []; state.ui.formError = ''; render(); break;
    case 'filter-toggle': state.ui.filterOpen = !state.ui.filterOpen; render(); break;
    case 'client-filter': state.ui.clientKind = control.dataset.kind; render(); break;
    case 'clear-search': state.ui.clientQuery = ''; render(); break;
    case 'client-open': state.ui.selectedClientId = control.dataset.id; openModal('client-detail'); break;
    case 'job-client-select': {
      const client = getClient(state.data, control.dataset.id);
      if (!client) break;
      state.ui.jobDraft.clientId = client.id; state.ui.jobSearch = ''; state.ui.showJobClients = false; render();
      break;
    }
    case 'job-type': state.ui.jobDraft.type = control.dataset.type; render(); break;
    case 'complete-job': {
      const job = state.data.jobs.find((item) => item.id === control.dataset.id);
      if (!job) break;
      if (job.status === 'Completato') showToast('Intervento già completato.');
      else saveData((current) => ({ ...current, jobs: current.jobs.map((item) => item.id === job.id ? { ...item, status: 'Completato' } : item) }), 'Intervento contrassegnato come completato.');
      break;
    }
    case 'calendar-month': {
      const next = new Date(state.ui.year, state.ui.month + Number(control.dataset.delta), 1);
      state.ui.year = next.getFullYear(); state.ui.month = next.getMonth(); state.ui.selectedDay = 1; render(); break;
    }
    case 'calendar-select': state.ui.selectedDay = Number(control.dataset.day); render(); break;
    case 'deadline-tab': state.ui.deadlineTab = control.dataset.tab; render(); break;
    case 'deadline-open': {
      const item = state.data.deadlines.find((deadline) => deadline.id === control.dataset.id);
      if (!item) break;
      if (item.status === 'Prossima') showToast(`Scadenza: ${item.dueDate.split('-').reverse().join('/')}`);
      else saveData((current) => ({ ...current, deadlines: current.deadlines.map((deadline) => deadline.id === item.id ? { ...deadline, status: 'Prossima' } : deadline) }), 'Scadenza spostata tra le prossime.');
      break;
    }
    case 'deadline-add': showToast('Per aggiungere una scadenza, apri il cliente o il cantiere interessato.'); break;
    case 'toggle-setting': saveData((current) => ({ ...current, settings: { ...current.settings, [control.dataset.key]: !current.settings[control.dataset.key] } })); break;
    case 'change-pin': showToast('PIN demo attuale: 1234. Non usare questo prototipo per dati reali.'); break;
    case 'settings-info': showToast('Impostazioni salvate automaticamente su questo dispositivo.'); break;
    case 'site-tab': state.ui.siteTab = control.dataset.tab; render(); break;
    case 'edit-site': showToast('La modifica del cantiere sarà aggiunta nel modulo dedicato.'); break;
    case 'site-more': showToast('Altre opzioni cantiere.'); break;
    case 'site-note': showToast('Editor note da implementare nel prossimo modulo.'); break;
    case 'download-demo': showToast('Documento demo: il file non è ancora caricato.'); break;
    case 'module-add': showToast(state.screen === 'invoices' ? 'Per creare fatture occorre configurare i dati fiscali.' : 'Modulo inventario pronto per il prossimo sviluppo.'); break;
    case 'toast-close': state.ui.toast = ''; render(); break;
    default: break;
  }
});

root.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
  if (target.dataset.input === 'client-search') { state.ui.clientQuery = target.value; render(); }
  if (target.dataset.input === 'job-search') {
    state.ui.jobSearch = target.value;
    state.ui.jobDraft.clientId = '';
    state.ui.showJobClients = true;
    render();
  }
  if (target.name === 'email') state.ui.loginEmail = target.value;
  if (target.name === 'password') state.ui.loginPassword = target.value;
  if (target.name === 'notes') state.ui.jobDraft.notes = target.value;
});

root.addEventListener('change', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
  if (target.dataset.change === 'automatic-lock') saveData((current) => ({ ...current, settings: { ...current.settings, automaticLockMinutes: Number(target.value) } }));
  if (target.name && ['date','start','end','notes'].includes(target.name)) state.ui.jobDraft[target.name] = target.value;
});

root.addEventListener('submit', (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  const formData = new FormData(form);
  if (form.dataset.form === 'login') {
    const email = inputValue(formData, 'email'); const password = String(formData.get('password') ?? '');
    if (state.ui.isLoggingIn) return;
    if (!email || !password) { state.ui.loginError = 'Inserisci email e password per continuare.'; render(); return; }
    state.ui.loginEmail = email; state.ui.loginPassword = ''; state.ui.loginError = ''; state.ui.isLoggingIn = true; render();
    supabaseAuth.signInWithPassword(email, password).then((session) => {
      state.session = session; state.screen = 'dashboard'; state.modal = null;
      state.ui.loginPassword = ''; state.ui.loginError = ''; state.ui.isLoggingIn = false;
      state.data = repository.load(); render({ resetScroll: true });
    }).catch((error) => {
      state.ui.loginPassword = ''; state.ui.loginError = error instanceof Error ? error.message : 'Accesso non riuscito. Riprova.';
    }).finally(() => { state.ui.isLoggingIn = false; render({ resetScroll: state.screen === 'dashboard' }); });
    return;
  }
  if (form.dataset.form === 'client') {
    const name = inputValue(formData, 'name'); const address = inputValue(formData, 'address');
    if (!name || !address) { state.ui.formError = 'Nome e indirizzo sono obbligatori.'; render(); return; }
    const client = { id: `c-${Date.now()}`, name, kind: String(formData.get('kind') || 'Privato'), address, phone: inputValue(formData, 'phone'), email: inputValue(formData, 'email') };
    saveData((current) => ({ ...current, clients: [client, ...current.clients] })); state.modal = null; state.ui.formError = ''; state.ui.clientQuery = ''; state.ui.clientKind = 'Tutti'; showToast('Cliente aggiunto correttamente.'); return;
  }
  if (form.dataset.form === 'intervention') {
    const clientId = state.ui.jobDraft.clientId;
    const title = inputValue(formData, 'notes');
    const draft = { clientId, title, type: state.ui.jobDraft.type, date: inputValue(formData, 'date'), start: inputValue(formData, 'start'), end: inputValue(formData, 'end') };
    const errors = validateNewJob(draft);
    state.ui.formErrors = errors;
    const client = getClient(state.data, clientId);
    if (!client && !errors.includes('Seleziona un cliente.')) errors.push('Seleziona un cliente.');
    if (errors.length) { render(); return; }
    const job = { id: `j-${Date.now()}`, ...draft, address: client.address, status: 'Pianificato', notes: title };
    saveData((current) => ({ ...current, jobs: [...current.jobs, job] })); state.modal = null; state.ui.formErrors = []; state.ui.jobDraft = { clientId: '', type: 'Elettrico', date: REFERENCE_DATE, start: '14:00', end: '16:00', notes: '' }; showToast('Intervento creato correttamente.'); return;
  }
});

window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && state.modal) back(); });
window.addEventListener('storage', (event) => { if (event.key === 'il-tuo-lavoro.data.v1') { state.data = repository.load(); render(); } });

render();
void supabaseAuth.restoreSession().then((session) => {
  if (!session) return;
  state.session = session;
  state.screen = 'dashboard';
  state.ui.loginPassword = '';
  render({ resetScroll: true });
}).catch((error) => {
  state.ui.loginError = error instanceof Error ? error.message : 'Sessione scaduta. Accedi di nuovo.';
  render();
});
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register(new URL('../sw.js', import.meta.url), { scope: new URL('../', import.meta.url).pathname }).catch((error) => console.error('Registrazione service worker non riuscita.', error)));
}
