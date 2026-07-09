// Monexi service worker — network-first, offline fallback
const CACHE = "monexi-v1"
const OFFLINE_URL = "/"

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE_URL)))
  self.skipWaiting()
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (e) => {
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.open(CACHE).then((c) => c.match(OFFLINE_URL))
      )
    )
  }
})
