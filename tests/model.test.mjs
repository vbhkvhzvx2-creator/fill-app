import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DATA, countDeadlinesByStatus, getClientName, getJobsForDate, searchClients, validateNewJob, cloneInitialData } from '../js/model.js';

test('gli interventi della data selezionata sono ordinati per ora', () => {
  assert.deepEqual(getJobsForDate(INITIAL_DATA.jobs, '2025-05-27').map((job) => job.start), ['08:00', '10:30', '14:00', '16:30', '18:00']);
});

test('la ricerca clienti ignora maiuscole e spazi esterni', () => {
  assert.deepEqual(searchClients(INITIAL_DATA.clients, '  BIANCHI ').map((client) => client.id), ['c-bianchi']);
});

test('un cliente non trovato riceve un fallback leggibile', () => {
  assert.equal(getClientName(INITIAL_DATA, 'assente'), 'Cliente non disponibile');
});

test('i conteggi scadenze corrispondono ai dati demo', () => {
  assert.equal(countDeadlinesByStatus(INITIAL_DATA.deadlines, 'Prossima'), 3);
  assert.equal(countDeadlinesByStatus(INITIAL_DATA.deadlines, 'Scaduta'), 1);
});

test('la validazione evidenzia cliente, descrizione, data e ordine orari', () => {
  assert.deepEqual(validateNewJob({ clientId: '', title: '', type: 'Elettrico', date: '', start: '17:00', end: '09:00' }), [
    'Seleziona un cliente.', 'Inserisci la descrizione dell’intervento.', 'Seleziona la data.', 'L’ora di fine deve essere successiva all’ora di inizio.',
  ]);
});

test('un intervento compilato correttamente passa la validazione', () => {
  assert.deepEqual(validateNewJob({ clientId: 'c-1', title: 'Riparazione quadro', type: 'Elettrico', date: '2025-05-27', start: '09:00', end: '10:00' }), []);
});

test('i dati iniziali restituiti sono copie indipendenti', () => {
  const first = cloneInitialData();
  first.clients.pop();
  assert.equal(cloneInitialData().clients.length, INITIAL_DATA.clients.length);
});
