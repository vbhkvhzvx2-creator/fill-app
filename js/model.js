export const STORAGE_KEY = 'il-tuo-lavoro.data.v1';
export const JOB_TYPES = ['Elettrico', 'Idraulico', 'Clima', 'Fotovoltaico', 'Allarme', 'Videosorveglianza'];
export const REFERENCE_DATE = '2025-05-27';

export const INITIAL_DATA = {
  clients: [
    { id: 'c-rossi', name: 'Rossi Mario', kind: 'Privato', address: 'Via Roma 12, Brescia', phone: '+39 030 555 1010', email: 'mario.rossi@example.it' },
    { id: 'c-bianchi', name: 'Bianchi S.r.l.', kind: 'Azienda', address: 'Via delle Industrie 8, Brescia', phone: '+39 030 555 2020', email: 'amministrazione@bianchi.example.it' },
    { id: 'c-neri', name: 'Neri Luca', kind: 'Privato', address: 'Via Garibaldi 22, Brescia', phone: '+39 030 555 3030', email: 'luca.neri@example.it' },
    { id: 'c-condominio', name: 'Condominio Verdi', kind: 'Condominio', address: 'Via Manzoni 45, Brescia', phone: '+39 030 555 4040', email: 'studio.verdi@example.it' },
    { id: 'c-ferrari', name: 'Ferrari Giovanni', kind: 'Privato', address: 'Via Venezia 10, Brescia', phone: '+39 030 555 5050', email: 'giovanni.ferrari@example.it' },
  ],
  jobs: [
    { id: 'j-1', clientId: 'c-rossi', title: 'Installazione clima', type: 'Clima', date: '2025-05-27', start: '08:00', end: '09:30', address: 'Via Roma 12, Brescia', status: 'Completato', notes: 'Controllo e avvio impianto di climatizzazione.' },
    { id: 'j-2', clientId: 'c-condominio', title: 'Manutenzione caldaia', type: 'Idraulico', date: '2025-05-27', start: '10:30', end: '12:00', address: 'Via Manzoni 45, Brescia', status: 'Pianificato', notes: 'Manutenzione ordinaria caldaia condominiale.' },
    { id: 'j-3', clientId: 'c-bianchi', title: 'Impianto fotovoltaico', type: 'Fotovoltaico', date: '2025-05-27', start: '14:00', end: '16:00', address: 'Via delle Industrie 8, Brescia', status: 'Pianificato', notes: 'Installazione impianto fotovoltaico.' },
    { id: 'j-4', clientId: 'c-neri', title: 'Allarme e videosorveglianza', type: 'Videosorveglianza', date: '2025-05-27', start: '16:30', end: '18:00', address: 'Via Garibaldi 22, Brescia', status: 'Pianificato', notes: 'Verifica allarme e telecamere.' },
    { id: 'j-5', clientId: 'c-ferrari', clientLabel: 'Controllo impianto', title: 'Verifica generale impianti', type: 'Elettrico', date: '2025-05-27', start: '18:00', end: '19:00', address: 'Via Po 5, Brescia', status: 'Pianificato', notes: 'Verifica generale impianti.' },
  ],
  deadlines: [
    { id: 'd-1', title: 'Certificazione impianto', clientId: 'c-rossi', dueDate: '2025-05-20', status: 'Scaduta', kind: 'Certificazione' },
    { id: 'd-2', title: 'Manutenzione caldaia', clientId: 'c-condominio', dueDate: '2025-05-28', status: 'Urgente', kind: 'Manutenzione' },
    { id: 'd-3', title: 'Revisione climatizzatore', clientId: 'c-bianchi', dueDate: '2025-06-10', status: 'Prossima', kind: 'Revisione' },
    { id: 'd-4', title: 'Controllo impianto allarme', clientId: 'c-neri', dueDate: '2025-06-15', status: 'Prossima', kind: 'Manutenzione' },
    { id: 'd-5', title: 'Verifica impianto', clientId: 'c-ferrari', dueDate: '2025-06-30', status: 'Prossima', kind: 'Certificazione' },
  ],
  sites: [
    { id: 's-1', clientId: 'c-bianchi', title: 'Impianto fotovoltaico 6 kW', address: 'Via delle Industrie 8, Brescia', state: 'In corso', startDate: '2025-05-12', endDate: '2025-05-30', responsible: 'Marco', description: 'Installazione impianto fotovoltaico completo di inverter e sistema di accumulo.', image: '/images/site-roof.png' },
  ],
  settings: { biometric: true, automaticLockMinutes: 5, deadlineNotifications: true, newJobNotifications: true, siteUpdates: true, workStart: '08:00', workEnd: '18:00', workingDays: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'] },
};

export function cloneInitialData() {
  return JSON.parse(JSON.stringify(INITIAL_DATA));
}

export function getClient(data, id) {
  return data.clients.find((client) => client.id === id);
}

export function getClientName(data, id) {
  return getClient(data, id)?.name ?? 'Cliente non disponibile';
}

export function searchClients(clients, query = '') {
  const normalized = query.trim().toLocaleLowerCase('it-IT');
  if (!normalized) return [...clients];
  return clients.filter((client) => `${client.name} ${client.kind} ${client.address} ${client.email}`.toLocaleLowerCase('it-IT').includes(normalized));
}

export function getJobsForDate(jobs, date) {
  return jobs.filter((job) => job.date === date).sort((a, b) => a.start.localeCompare(b.start));
}

export function countDeadlinesByStatus(deadlines, status) {
  return deadlines.filter((deadline) => deadline.status === status).length;
}

export function validateNewJob(input) {
  const errors = [];
  if (!input.clientId) errors.push('Seleziona un cliente.');
  if (!input.title.trim()) errors.push('Inserisci la descrizione dell’intervento.');
  if (!input.date) errors.push('Seleziona la data.');
  if (!input.start || !input.end) errors.push('Inserisci ora di inizio e fine.');
  if (input.start && input.end && input.end <= input.start) errors.push('L’ora di fine deve essere successiva all’ora di inizio.');
  return errors;
}
