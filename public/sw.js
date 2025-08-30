// Minimal Service Worker for PWA installability
const CACHE_NAME = 'cheers-up-v1';

// Install event - minimal cache
self.addEventListener('install', event => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Fetch event - pass through to network
self.addEventListener('fetch', event => {
  // Just pass through to network - no caching
  event.respondWith(fetch(event.request));
});
