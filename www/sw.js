// Service worker: lets the site open offline and from the home screen.
// Page code and quest data: network first (so updates show up right away),
// falling back to the saved copy when offline. Fonts, library, icons: saved copy first.
// __BUILD__ is replaced with the commit at build time, so each deploy gets a fresh cache.
const CACHE = "atlas-__BUILD__";
const SHELL = [
  "/", "/atlas.css", "/boot.js", "/atlas.js", "/data/quests.json", "/manifest.webmanifest",
  "/vendor/dagre.min.js", "/icon-192.png",
  "/fonts/chakra-petch-500.woff2", "/fonts/chakra-petch-600.woff2",
  "/fonts/ibm-plex-sans-400.woff2", "/fonts/ibm-plex-sans-500.woff2",
  "/fonts/ibm-plex-mono-400.woff2", "/fonts/ibm-plex-mono-500.woff2",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("atlas-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname === "/version.json") return;

  const staticAsset = /^\/(fonts|vendor)\//.test(url.pathname) || /\.(png|woff2)$/.test(url.pathname);
  if (staticAsset) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }))
    );
    return;
  }

  // Pages are cached under "/" (share links only differ by #hash, which isn't sent).
  const key = req.mode === "navigate" ? "/" : req;
  e.respondWith(
    fetch(req, { cache: "no-cache" }).then(res => { // revalidate: cheap 304 when unchanged
      if (res.ok && !res.redirected) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      return res;
    }).catch(() => caches.match(key, { ignoreSearch: true }))
  );
});
