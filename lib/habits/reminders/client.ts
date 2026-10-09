/**
 * Browser side of server push: this device's subscription, and the claim the
 * in-tab fallback makes before showing a reminder. Shared by
 * NotificationManager and Settings → Reminders.
 */

export type AuthHeaders = Record<string, string>

export function pushSupported(): boolean {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window
}

/**
 * The registration, without waiting forever: `serviceWorker.ready` never
 * resolves where no worker is registered (dev builds don't register one).
 */
async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null
  try {
    return (await navigator.serviceWorker.getRegistration()) ?? null
  } catch {
    return null
  }
}

/** This device's active push subscription, or null. */
export async function getActivePushSubscription(): Promise<PushSubscription | null> {
  const reg = await registration()
  if (!reg) return null
  try {
    return await reg.pushManager.getSubscription()
  } catch {
    return null
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"))
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

export async function fetchPublicKey(): Promise<string | null> {
  try {
    const response = await fetch("/api/habits/push/public-key", { cache: "no-store" })
    if (!response.ok) return null
    const body = (await response.json()) as { publicKey?: string }
    return body.publicKey ?? null
  } catch {
    return null
  }
}

/** Subscribes this device and registers it with the server. Throws on failure. */
export async function subscribeThisDevice(authHeaders: AuthHeaders): Promise<PushSubscription> {
  const reg = await registration()
  if (!reg) throw new Error("no_service_worker")
  const publicKey = await fetchPublicKey()
  if (!publicKey) throw new Error("not_configured")
  let subscription = await reg.pushManager.getSubscription()
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) })
  }
  const response = await fetch("/api/habits/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  })
  if (!response.ok) throw new Error(`subscribe failed (${response.status})`)
  return subscription
}

/** Unsubscribes this device locally and on the server. */
export async function unsubscribeThisDevice(authHeaders: AuthHeaders): Promise<void> {
  const subscription = await getActivePushSubscription()
  if (!subscription) return
  const endpoint = subscription.endpoint
  await subscription.unsubscribe().catch(() => false)
  await fetch("/api/habits/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ endpoint }),
  }).catch(() => undefined)
}

const LOCAL_CLAIMS_PREFIX = "liberture-reminder-claims:"

/** Same-device dedupe for when the server can't be reached: one set per local day. */
function claimLocally(key: string, date: string): boolean {
  try {
    const storageKey = `${LOCAL_CLAIMS_PREFIX}${date}`
    const claimed: string[] = JSON.parse(localStorage.getItem(storageKey) ?? "[]")
    if (claimed.includes(key)) return false
    claimed.push(key)
    localStorage.setItem(storageKey, JSON.stringify(claimed))
    // Drop other days' sets.
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k?.startsWith(LOCAL_CLAIMS_PREFIX) && k !== storageKey) localStorage.removeItem(k)
    }
    return true
  } catch {
    return true
  }
}

/**
 * Asks the server whether this tab may show the reminder (first claimer wins
 * across tabs, devices and the server tick). Offline or signed out of the
 * server, falls back to a per-day set in localStorage.
 */
export async function claimReminder(key: string, kind: string, date: string, authHeaders: AuthHeaders): Promise<boolean> {
  try {
    const response = await fetch("/api/habits/push/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ key, kind }),
    })
    if (response.ok) {
      const body = (await response.json()) as { claimed?: boolean }
      if (body.claimed) claimLocally(key, date)
      return body.claimed === true
    }
  } catch {
    // Offline: fall through.
  }
  return claimLocally(key, date)
}
