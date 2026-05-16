// SW Version: 4.2.4
importScripts("./js/utils.js");
const CACHE_NAME = `action-counter-v${Utils.VERSION}`;
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.svg",
  "./css/style.css",
  "./js/utils.js",
  "./js/storage.js",
  "./js/ui.js",
  "./js/calendar.js",
  "./js/main.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.error(`Error al cachear el recurso: ${asset}`, err);
        }
      }
      return self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});
