import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DATA } from '../js/model.js';
import { LocalStorageRepository } from '../js/repository.js';

function memoryStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test('lo storage vuoto restituisce dati demo nuovi e indipendenti', () => {
  const repo = new LocalStorageRepository(memoryStorage());
  const first = repo.load(); first.clients.pop();
  assert.equal(repo.load().clients.length, INITIAL_DATA.clients.length);
});

test('i dati persistono fra salvataggio e ricaricamento del repository', () => {
  const storage = memoryStorage(); const repo = new LocalStorageRepository(storage);
  const data = repo.load(); data.clients.push({ id: 'c-test', name: 'Cliente Test', kind: 'Privato', address: 'Via Prova 1', phone: '', email: '' });
  repo.save(data);
  assert.equal(repo.load().clients.at(-1).name, 'Cliente Test');
});

test('JSON corrotto o schema incompleto ripiega sui dati demo', () => {
  const storage = memoryStorage(); const repo = new LocalStorageRepository(storage);
  storage.setItem('il-tuo-lavoro.data.v1', '{json rotto');
  assert.equal(repo.load().jobs.length, INITIAL_DATA.jobs.length);
  storage.setItem('il-tuo-lavoro.data.v1', JSON.stringify({ clients: [] }));
  assert.equal(repo.load().jobs.length, INITIAL_DATA.jobs.length);
});

test('se la scrittura fallisce, viene restituito un errore leggibile', () => {
  const storage = memoryStorage(); storage.setItem = () => { throw new Error('quota'); };
  const originalError = console.error;
  console.error = () => {};
  try { assert.throws(() => new LocalStorageRepository(storage).save(INITIAL_DATA), /Salvataggio non riuscito/); }
  finally { console.error = originalError; }
});

test('reset elimina il contenuto persistito', () => {
  const storage = memoryStorage(); const repo = new LocalStorageRepository(storage);
  repo.save(INITIAL_DATA); repo.reset();
  assert.equal(repo.load().clients.length, INITIAL_DATA.clients.length);
});
