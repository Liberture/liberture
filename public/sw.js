// PWA cache policy: cache the install shell and static assets only.
// Authenticated API routes and user-specific JSON are always network-only.
const CACHE_VERSION = "habit-tracker-pwa-v9-20261009"
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

const DEFAULT_NOTIFICATION_URL = "/tracker"

// Server push (reminders with the app closed): payload is JSON
// { title, body, tag, url } from lib/habits/push.ts.
self.addEventListener("push", (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : "" }
  }
  const title = payload.title || "Liberture"
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/pwa-icon-192.png",
      badge: "/icon-dark-32x32.png",
      tag: payload.tag || undefined,
      data: { url: payload.url || DEFAULT_NOTIFICATION_URL },
    })
  )
})

function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"))
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

async function applicationServerKeyFor(oldSubscription) {
  const fromOld = oldSubscription && oldSubscription.options && oldSubscription.options.applicationServerKey
  if (fromOld) return fromOld
  const response = await fetch("/api/habits/push/public-key", { cache: "no-store" })
  if (!response.ok) throw new Error("push not configured")
  const { publicKey } = await response.json()
  return urlBase64ToUint8Array(publicKey)
}

// The browser rotated or expired the subscription. The worker has no session,
// so the old endpoint (known only to this browser and the server) proves
// ownership to /api/habits/push/subscribe.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const oldSubscription = event.oldSubscription || null
      let subscription = event.newSubscription || null
      if (!subscription) {
        const applicationServerKey = await applicationServerKeyFor(oldSubscription)
        subscription = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
      }
      await fetch("/api/habits/push/subscribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          oldEndpoint: oldSubscription ? oldSubscription.endpoint : undefined,
        }),
      })
    })().catch(() => undefined)
  )
})

// Reminders are shown with registration.showNotification(), so the click is
// handled here: focus a tab already on the app and take it to the
// notification's url, otherwise open one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const data = event.notification.data || {}
  const target = new URL(data.url || DEFAULT_NOTIFICATION_URL, self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (new URL(client.url).origin !== self.location.origin || !("focus" in client)) continue
        return client.focus().then((focused) => {
          if (focused && "navigate" in focused && new URL(focused.url).pathname !== new URL(target).pathname) {
            return focused.navigate(target).catch(() => focused)
          }
          return focused
        })
      }
      return self.clients.openWindow ? self.clients.openWindow(target) : undefined
    })
  )
})
