// Fox Games service worker — network-first, cache as offline fallback.
// This is intentionally simple: it always tries the live file first (so you see
// every update the moment you're online), and only serves the last cached copy
// when a fetch actually fails, which is the offline case.

const CACHE_NAME = "fox-games-cache-v1";
const APP_SHELL = [
  "./",
  "./index.html"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful, same-origin responses.
        if (response && response.status === 200 && response.type === "basic"){
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match("./index.html"))
      )
  );
});
