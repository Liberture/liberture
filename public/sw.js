// PWA cache policy: cache the install shell and static assets only.
// Authenticated API routes and user-specific JSON are always network-only.
const CACHE_VERSION = "habit-tracker-pwa-v8-20261005"
const STATIC_CACHE = `${CACHE_VERSION}-static`
const SHELL_CACHE = `${CACHE_VERSION}-shell`

// Do not precache `/`: old installed PWAs can keep a stale Next.js shell
// that points at deleted hashed chunks and shows "client-side exception".
// Navigation stays network-first and only falls back to a freshly cached shell.
const APP_SHELL_URLS = [
  "/manifest.webmanifest",
  "/pwa-icon.svg",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/pwa-maskable-512.png",
  "/apple-icon.png",
  "/favicon.ico",
  "/icon.svg",
]

const STATIC_ASSET_RE = /\.(?:css|js|mjs|png|jpg|jpeg|gif|webp|svg|ico|woff2?|webmanifest)$/i

function isSameOrigin(url) {
  return url.origin === self.location.origin
}

function isApiOrUserData(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/api/storage") ||
    url.pathname.startsWith("/api/v1/") ||
    url.pathname.startsWith("/api/auth/")
  )
}

function hasAuthHeaders(request) {
  return request.headers.has("authorization") || request.headers.has("x-api-key")
}

function shouldBypassCache(request, url) {
  if (request.method !== "GET") return true
  if (!isSameOrigin(url)) return true
  if (isApiOrUserData(url)) return true
  if (hasAuthHeaders(request)) return true
  return false
}

function isStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/") || STATIC_ASSET_RE.test(url.pathname)
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("habit-tracker-pwa-") && key !== STATIC_CACHE && key !== SHELL_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

async function networkFirstShell(request) {
  const cache = await caches.open(SHELL_CACHE)
  const url = new URL(request.url)

  try {
    const response = await fetch(request)
    const contentType = response.headers.get("content-type") || ""
    if (response.ok && contentType.includes("text/html") && url.pathname === "/" && url.search === "") {
      cache.put("/", response.clone())
    }
    return response
  } catch {
    const cachedShell = await cache.match("/")
    if (cachedShell) return cachedShell
    return new Response("Liberture is offline. Reconnect to load the app.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  const fetched = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => cached)

  return cached || fetched
}

self.addEventListener("fetch", (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (shouldBypassCache(request, url)) return

  if (request.mode === "navigate") {
    event.respondWith(networkFirstShell(request))
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request))
  }
})

// Reminders are delivered via registration.showNotification(), so the click has
// to be handled here: focus an existing tab if one is open, otherwise open one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus()
      }
      return self.clients.openWindow ? self.clients.openWindow("/") : undefined
    })
  )
})
