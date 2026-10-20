import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DATA } from '../js/model.js';
import { renderCalendar, renderClients, renderDashboard, renderDeadlines, renderLogin, renderPin, renderSettings, renderSite, renderToday } from '../js/screens.js';

const ui = { pin: '', month: 4, year: 2025, selectedDay: 27, clientQuery: '', clientKind: 'Tutti', deadlineTab: 'Tutte', siteTab: 'Dettagli', jobDraft: { clientId: '', type: 'Elettrico', date: '2025-05-27', start: '14:00', end: '16:00', notes: '' } };

test('le schermate primarie restituiscono markup e navigazione attesa', () => {
  const login = renderLogin(ui);
  assert.match(login, /data-form="login"/);
  assert.match(login, /type="email"/);
  assert.match(login, /Accesso protetto da Supabase/);
  assert.doesNotMatch(login, /Versione dimostrativa/);
  assert.match(renderPin(ui), /Sblocca l'app/);
  assert.match(renderDashboard(INITIAL_DATA), /Scadenze importanti/);
  assert.match(renderToday(INITIAL_DATA), /Lavori di oggi/);
  assert.match(renderCalendar(INITIAL_DATA, ui), /Maggio 2025/);
  assert.match(renderClients(INITIAL_DATA, ui), /Rossi Mario/);
  assert.match(renderDeadlines(INITIAL_DATA, ui), /Certificazione impianto/);
  assert.match(renderSettings(INITIAL_DATA), /Blocco automatico/);
  assert.match(renderSite(INITIAL_DATA, ui), /Impianto fotovoltaico 6 kW/);
});

test('i controlli principali sono associati ad azioni nominative', () => {
  assert.match(renderDashboard(INITIAL_DATA), /data-nav="clients"/);
  assert.match(renderToday(INITIAL_DATA), /data-action="complete-job"/);
  assert.match(renderClients(INITIAL_DATA, ui), /data-action="client-open"/);
  assert.match(renderDeadlines(INITIAL_DATA, ui), /data-action="deadline-tab"/);
  assert.match(renderSettings(INITIAL_DATA), /data-action="toggle-setting"/);
});
