// public/sw.js

self.addEventListener('install', event => {
  console.log('Service Worker: Installato');
  self.skipWaiting(); // Attiva subito il nuovo service worker
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Attivato');
});

// Ascolta gli eventi 'push' in arrivo dal server
self.addEventListener('push', event => {
  console.log('Service Worker: Push Ricevuto.');

  let notificationData = {};
  try {
    // Il server invia i dati come stringa JSON
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: 'Nuova Notifica',
      body: event.data.text(),
      url: '/'
    };
  }

  const options = {
    body: notificationData.body,
    icon: '/apple-touch-icon.png', // La tua icona esistente
    badge: '/favicon.svg',         // Icona per la barra di stato Android
    data: {
      url: notificationData.url || '/' // URL da aprire al click
    }
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Gestisce il click sulla notifica
self.addEventListener('notificationclick', event => {
  event.notification.close(); // Chiude la notifica

  // Apre la finestra del browser all'URL specificato
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});