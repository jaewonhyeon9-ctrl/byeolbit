// 별빚도장 service worker
// Minimal: install/activate + offline-friendly navigation fallback +
// receives notification clicks. Real Web Push subscription is not enabled
// (we don't have a backend to push from); notifications are shown locally
// from the page via Notification API.

const VERSION = 'byeolbit-sw-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) {
          w.focus();
          if ('navigate' in w && url) w.navigate(url);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// Hook for future server-pushed notifications
self.addEventListener('push', (e) => {
  let data = {};
  try {
    data = e.data?.json() ?? {};
  } catch {
    data = { title: '별빚도장', body: e.data?.text() ?? '' };
  }
  const title = data.title || '별빚도장';
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
  };
  e.waitUntil(self.registration.showNotification(title, options));
});
