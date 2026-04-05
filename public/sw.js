// Bora Floripa — Service Worker (push notifications)

self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Bora Floripa';
  const options = {
    body: data.body || 'Tem novidade para você!',
    icon: '/vite.svg',
    badge: '/vite.svg',
    data: { url: data.url || '/' },
    tag: 'bora-notification',
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if ('focus' in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      })
  );
});
