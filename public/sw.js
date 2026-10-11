// Service Worker del Panel de Admin (Luna Admin PWA)
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

  // CRÍTICO: Si no es del mismo origen o NO es método GET (como los POST de Supabase/login), 
  // salimos inmediatamente y dejamos que el navegador los maneje directo sin tocar nada.
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== "GET") return;

  // Si es una navegación de página GET dentro del panel, vamos directo a la red 
  // para evitar pantallas en blanco en Safari, pero SIN alterar peticiones de API o formularios POST.
  if (event.request.mode === 'navigate' || url.pathname.startsWith('/admin')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/admin/login'))
    );
    return;
  }

  // Para assets estáticos (CSS, JS, imágenes), usamos caché con stale-while-revalidate
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

      return cached || enRed;
    }),
  );
});