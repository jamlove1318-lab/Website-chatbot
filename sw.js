// Minimal service worker — required for Android to treat this as an installable app.
// This doesn't do offline caching (the chatbot needs the network anyway to reach the API),
// it just needs to exist and register successfully.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Pass all requests straight through to the network.
  event.respondWith(fetch(event.request));
});
