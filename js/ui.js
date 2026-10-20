const iconPaths = {
  hardhat: '<path d="M3 18h18M5 18v-3a7 7 0 0 1 14 0v3M12 4v4M7 9l-2-2M17 9l2-2"/>',
  house: '<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/><path d="m12 5 1.2 2.2 2.5.4-1.8 1.7.4 2.5-2.3-1.2-2.3 1.2.4-2.5-1.8-1.7 2.5-.4z"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h2M14 14h2M8 17h2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6M16 4a4 4 0 0 1 0 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  file: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7"/>',
  package: '<path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v9l9 5 9-5V8M12 13v9"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.5 2.6-1.7-.6a8 8 0 0 1-1.6.9l-.3 1.8h-3l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.6-1.5-2.6 1.4-1.1a7 7 0 0 1 0-1.9l-1.4-1.1 1.5-2.6 1.7.6a8 8 0 0 1 1.6-.9l.3-1.8h3l.3 1.8a8 8 0 0 1 1.6.9l1.7-.6 1.5 2.6-1.4 1.1a7 7 0 0 1-.1 1.8Z"/>',
  zap: '<path d="m13 2-3 8h7l-6 12 1-9H5l8-11Z"/>',
  droplet: '<path d="M12 2s7 8 7 13a7 7 0 0 1-14 0c0-5 7-13 7-13Z"/>',
  snow: '<path d="M12 2v20M4 7l16 10M4 17 20 7M8 4l4 3 4-3M8 20l4-3 4 3M3 11l1 6 5-1M21 11l-1 6-5-1M3 13l1-6 5 1M21 13l-1-6-5 1"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  camera: '<path d="M14 4h-4l-2 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4z"/><circle cx="12" cy="13" r="4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  arrowLeft: '<path d="m15 18-6-6 6-6M9 12h12"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a15 15 0 0 1-3.2 4.1M6.2 6.2C3.4 8 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4-.8"/>',
  fingerprint: '<path d="M12 11a2 2 0 0 0-2 2c0 2-.2 4-1 6M12 7a6 6 0 0 0-6 6c0 2-.2 4-1 5M12 3a10 10 0 0 0-10 10M12 3a10 10 0 0 1 10 10c0 4-1 7-2 9M12 11a2 2 0 0 1 2 2c0 3 .1 5 1 7M6 13a6 6 0 0 1 12 0c0 2-.1 3.5.5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  x: '<path d="m18 6-12 12M6 6l12 12"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',
  pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2M14 7h2M9 11h2M14 11h2M9 15h2M14 15h2M10 21v-3h4v3"/>',
  pencil: '<path d="m4 16-.8 4.8L8 20l12-12-4-4L4 16Z M14 6l4 4"/>',
  more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  wrench: '<path d="M14 7a5 5 0 0 0-6 6L3 18l3 3 5-5a5 5 0 0 0 6-6l-3 3-3-3z"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
};

export function icon(name, size = 22, extraClass = '') {
  return `<svg class="icon ${extraClass}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] ?? iconPaths.wrench}</svg>`;
}

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
export function avatar(name, extra = '') {
  const parts = String(name).trim().split(/\s+/);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2);
  return `<span class="avatar ${extra}" aria-label="${escapeHtml(name)}">${escapeHtml(initials.toLocaleUpperCase('it-IT'))}</span>`;
}
export function header(title, { back = true, subtitle = '', add = '', right = '' } = {}) {
  return `<header class="screen-header">${back ? `<button class="icon-button back-button" data-action="back" aria-label="Indietro">${icon('arrowLeft', 23)}</button>` : '<span class="header-spacer"></span>'}<div class="screen-heading"><h1>${escapeHtml(title)}</h1>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div>${add ? `<button class="icon-button primary-icon" data-action="${add}" aria-label="Aggiungi">${icon('plus', 24)}</button>` : right || '<span class="header-spacer"></span>'}</header>`;
}
export function badge(label, tone = 'blue') { return `<span class="badge badge-${tone}">${escapeHtml(label)}</span>`; }
export function panel(content, extra = '') { return `<section class="panel ${extra}">${content}</section>`; }
export function serviceIcon(name, size = 26) {
  const map = { 'Lavori Oggi': 'calendar', Calendario: 'calendar', Clienti: 'users', Cantieri: 'hardhat', Scadenze: 'clock', Fatture: 'file', Magazzino: 'package', Impostazioni: 'settings', Elettrico: 'zap', Idraulico: 'droplet', Clima: 'snow', Fotovoltaico: 'sun', Allarme: 'shield', Videosorveglianza: 'camera', Interventi: 'wrench' };
  return icon(map[name] ?? 'wrench', size);
}
export function typeIcon(type, size = 22) { return serviceIcon(type, size); }
