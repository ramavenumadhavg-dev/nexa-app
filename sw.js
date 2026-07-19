// sw.js — Nexa's Service Worker. This file MUST be hosted alongside index.html
// (same folder, same origin) for offline caching and push notifications to work.
// It cannot be generated in-memory (e.g. via a blob: URL) — browsers require real
// same-origin service worker files as a security measure, so this has to be a real
// file sitting next to index.html on whatever server/host serves Nexa (GitHub Pages,
// Cloudflare Pages, Netlify, your own server, etc).
const CACHE = 'nexa-shell-v1';
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.add(self.registration.scope)));
});
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) =>
      hit || fetch(e.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      }).catch(() => hit)
    )
  );
});
// Real push notification display — fires when your deployed nexa-push-worker sends
// a message via the Push API, even if Nexa itself is fully closed.
self.addEventListener('push', (e) => {
  let data = {}; try { data = e.data ? e.data.json() : {}; } catch (err) {}
  const title = data.title || 'Nexa';
  const body = data.body || '';
  e.waitUntil(self.registration.showNotification(title, { body, icon: undefined }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((list) => {
    for (const c of list) if ('focus' in c) return c.focus();
    if (self.clients.openWindow) return self.clients.openWindow('./');
  }));
});
