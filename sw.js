const CACHE = 'kojisho-iiif-v11';
const SHELL = ['./', './index.html', './styles.css', './app.js', './data-v3.js', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.hostname.endsWith('ndl.go.jp') || url.hostname === 'cdn.jsdelivr.net') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
