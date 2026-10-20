const CACHE_NAME = 'il-tuo-lavoro-shell-v3';
const BASE_URL = new URL('./', self.registration.scope);
const APP_SHELL = [
  './', './index.html', './styles.css', './js/app.js', './js/model.js',
  './js/repository.js', './js/ui.js', './js/screens.js', './js/supabase-config.js', './js/supabase-auth.js',
  './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png',
  './icons/icon-512.png', './images/site-roof.png', './images/login-worker-reference.png',
  './images/marco-avatar.png'
].map((path) => new URL(path, BASE_URL).toString());
const INDEX_URL = new URL('./index.html', BASE_URL).toString();
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(INDEX_URL))));
});
