/**
 * Fixed-window, in-memory request limiter for the assistant-facing API.
 *
 * Process-local on purpose: the app runs as a single container, and the goal is
 * to stop a looping assistant from hammering the database, not to meter usage.
 */

interface Window {
  start: number
  count: number
}

const windows = new Map<string, Window>()
const MAX_TRACKED_KEYS = 10_000

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

export function checkRateLimit(key: string, limit = 120, windowMs = 60_000, now = Date.now()): RateLimitResult {
  const current = windows.get(key)
  if (!current || now - current.start >= windowMs) {
    if (windows.size >= MAX_TRACKED_KEYS) {
      for (const [k, w] of windows) {
        if (now - w.start >= windowMs) windows.delete(k)
      }
    }
    windows.set(key, { start: now, count: 1 })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  current.count += 1
  if (current.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((current.start + windowMs - now) / 1000) }
  }
  return { allowed: true, retryAfterSeconds: 0 }
}
