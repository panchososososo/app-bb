/* Service Worker de "Nosotros"
 * - Precachea el "app shell" al instalar.
 * - Navegación: network-first con fallback a la página cacheada (funciona offline).
 * - Recursos estáticos (JS/CSS/fuentes/iconos): stale-while-revalidate.
 * Sube CACHE_VERSION cuando quieras forzar la limpieza de cachés antiguas.
 */
const CACHE_VERSION = 'v1';
const CACHE_NAME = `nosotros-${CACHE_VERSION}`;
const SCOPE = self.registration.scope;

const APP_SHELL = [
  SCOPE,
  `${SCOPE}index.html`,
  `${SCOPE}manifest.json`,
  `${SCOPE}icons/icon.svg`,
  `${SCOPE}icons/icon-192.png`,
  `${SCOPE}icons/icon-512.png`,
  `${SCOPE}icons/apple-touch-icon.png`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('nosotros-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');
  if (!isSameOrigin && !isFont) return;

  // Navegación (abrir la app / recargar): red primero, caché si no hay conexión.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(`${SCOPE}index.html`, copy));
          return response;
        })
        .catch(() => caches.match(`${SCOPE}index.html`).then((r) => r || caches.match(SCOPE)))
    );
    return;
  }

  // Resto: stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response && (response.ok || response.type === 'opaque')) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
