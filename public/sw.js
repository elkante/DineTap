/**
 * TapMenu PWA Service Worker
 * Handles offline caching, OS Badging API updates, audio notification triggers,
 * and background kitchen order/waiter call notification events.
 */

const CACHE_NAME = 'tapmenu-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png'
];

// Install: precache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.debug('SW precache error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for messages from web application
self.addEventListener('message', async (event) => {
  const data = event.data;
  if (!data) return;

  // Set App Badge on installed PWA icon (e.g. 2 for 2 active orders)
  if (data.type === 'SET_BADGE') {
    const count = Number(data.count) || 0;
    try {
      if ('setAppBadge' in self.navigator) {
        if (count > 0) {
          await self.navigator.setAppBadge(count);
        } else {
          await self.navigator.clearAppBadge();
        }
      }
    } catch (e) {
      console.debug('SW setAppBadge error:', e);
    }
  }

  // Clear App Badge
  if (data.type === 'CLEAR_BADGE') {
    try {
      if ('clearAppBadge' in self.navigator) {
        await self.navigator.clearAppBadge();
      }
    } catch (e) {
      console.debug('SW clearAppBadge error:', e);
    }
  }

  // Trigger Notification from worker
  if (data.type === 'SHOW_NOTIFICATION') {
    try {
      await self.registration.showNotification(data.title || 'TapMenu Kitchen Alert', {
        body: data.body || 'New table activity received',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [300, 150, 300, 150, 450],
        tag: 'kitchen-active-ticket',
        renotify: true,
        data: data.data || { url: '/?view=kitchen' },
        actions: [
          { action: 'open_kds', title: 'Open Kitchen' },
          { action: 'dismiss', title: 'Acknowledge' }
        ]
      });
    } catch (e) {
      console.debug('SW showNotification error:', e);
    }
  }
});

// Push event: when web push notification is received while PWA is closed
self.addEventListener('push', (event) => {
  let payload = {
    title: '🔔 New Kitchen Ticket',
    body: 'A new table order or waiter buzzer was received!',
    badgeCount: 1,
    url: '/?view=kitchen'
  };

  try {
    if (event.data) {
      const json = event.data.json();
      payload = { ...payload, ...json };
    }
  } catch (err) {
    if (event.data) {
      payload.body = event.data.text();
    }
  }

  // Update OS Badge count (e.g. 2 if 2 messages received)
  if ('setAppBadge' in self.navigator && payload.badgeCount) {
    self.navigator.setAppBadge(payload.badgeCount).catch(() => {});
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [300, 150, 300, 150, 450],
      tag: 'kitchen-active-ticket',
      renotify: true,
      requireInteraction: true,
      data: { url: payload.url || '/?view=kitchen' },
      actions: [
        { action: 'open_kds', title: 'Open Kitchen KDS' },
        { action: 'dismiss', title: 'Acknowledge' }
      ]
    })
  );
});

// Notification click: Focus or open the Kitchen view
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/?view=kitchen';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE_KITCHEN' });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Fetch event: Network first with cache fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip Supabase/API requests from caching
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin.includes('supabase.co') || url.pathname.startsWith('/api')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful shell assets
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
