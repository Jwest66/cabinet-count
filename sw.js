// Cabinet Count service worker: keeps the app working offline.
// Bump VERSION whenever you change any app file so phones pick up the update.
const VERSION = "cabinet-count-v5";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./vendor/zxing.min.js",
  "./vendor/firebase.js",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./icon.svg"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  // Firebase, product lookups and fonts go straight to the network; only the app's own files are cached.
  if (url.origin !== self.location.origin || req.method !== "GET") return;

  // The page itself: try the network first so updates show up right away, fall back to the saved copy offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); }
        return res;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Everything else (scripts, icons): saved copy first, then network.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
