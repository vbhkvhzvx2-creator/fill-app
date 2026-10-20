import { STORAGE_KEY, cloneInitialData } from './model.js';

function getSafeStorage() {
  try { return globalThis.localStorage; } catch { return undefined; }
}

export class LocalStorageRepository {
  constructor(storage = getSafeStorage()) { this.storage = storage; }

  load() {
    if (!this.storage) return cloneInitialData();
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return cloneInitialData();
      const value = JSON.parse(raw);
      if (!Array.isArray(value.clients) || !Array.isArray(value.jobs) || !Array.isArray(value.deadlines) || !Array.isArray(value.sites) || !value.settings) return cloneInitialData();
      return value;
    } catch {
      return cloneInitialData();
    }
  }

  save(data) {
    if (!this.storage) return;
    try { this.storage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (error) {
      console.error('Impossibile salvare i dati locali.', error);
      throw new Error('Salvataggio non riuscito. Verifica lo spazio disponibile nel browser.');
    }
  }

  reset() { this.storage?.removeItem(STORAGE_KEY); }
}

export const repository = new LocalStorageRepository();
