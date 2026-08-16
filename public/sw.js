// Service Worker del Panel de Admin (Luna Admin PWA)
// Alcance: solo /admin/* (se registra con scope explícito en Layout.astro)

const CACHE_NAME = "luna-admin-v1";
const APP_SHELL = [
  "/admin",
  "/admin/login",
  "/logo.png",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Solo intervenimos pedidos del propio sitio. Todo lo de Supabase (datos,
  // login, storage) sigue directo a la red, sin cachear — los pedidos y
  // estados siempre tienen que ser en vivo, nunca datos viejos guardados.
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const enRed = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copia = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, copia));
          }
          return response;
        })
        .catch(() => cached);

      // Stale-while-revalidate: muestra lo cacheado al instante si existe,
      // y de fondo actualiza el caché para la próxima vez.
      return cached || enRed;
    }),
  );
});
