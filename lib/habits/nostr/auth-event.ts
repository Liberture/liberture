/**
 * The event every Nostr login signs (kind 27235, NIP-98 HTTP Auth).
 *
 * NIP-98 requires a `u` tag (the absolute URL being authenticated), a
 * `method` tag and empty content. Some signer extensions enforce that before
 * signing ("Invalid authentication u tag", "Invalid authentication content"),
 * so both places that sign one (sign-in and account migration) build it here.
 *
 * The server checks all of it (checkAuthEvent below). The `u` tag matters as
 * much as the challenge: anyone can fetch a challenge for any pubkey, so
 * without an origin check a phishing site could have a visitor sign one
 * (with `u` naming the phishing site, which extensions happily allow) and
 * relay the signature here to sign in as them.
 */

export const AUTH_EVENT_KIND = 27235
const MAX_EVENT_AGE_SECONDS = 5 * 60
const MAX_CLOCK_SKEW_SECONDS = 60

export type AuthEndpoint = "/api/auth/nostr" | "/api/auth/nostr/migrate"

export interface AuthEventTemplate {
  kind: number
  created_at: number
  tags: string[][]
  content: string
}

export function buildAuthEvent(challenge: string, endpoint: AuthEndpoint): AuthEventTemplate {
  return {
    kind: AUTH_EVENT_KIND,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["u", `${window.location.origin}${endpoint}`],
      ["method", "POST"],
      ["challenge", challenge],
    ],
    content: "",
  }
}

const PRODUCTION_ORIGINS = ["https://liberture.com", "https://www.liberture.com"]

/**
 * Whether a login event's `u` tag may name this origin: APP_ORIGIN
 * (comma-separated) when set, otherwise liberture.com in production and
 * localhost in development. Never taken from request headers, which whoever
 * relays the signature controls.
 */
export function isAllowedAuthOrigin(origin: string): boolean {
  const configured = (process.env.APP_ORIGIN ?? "")
    .split(",")
    .map((value) => value.trim().replace(/\/+$/, ""))
    .filter(Boolean)
  if (configured.length) return configured.includes(origin)
  if (process.env.NODE_ENV === "production") return PRODUCTION_ORIGINS.includes(origin)
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
}

function tagValue(tags: unknown[], name: string): string | null {
  const tag = tags.find((t): t is unknown[] => Array.isArray(t) && t[0] === name)
  return tag && typeof tag[1] === "string" ? tag[1] : null
}

export type AuthEventCheck = { valid: true; challenge: string } | { valid: false; error: string }

/**
 * Server side: everything about a signed login event except the signature
 * itself (nostr-tools' verifyEvent) and whether its challenge is the one we
 * issued (challenge-store). Returns the challenge to consume.
 */
export function checkAuthEvent(
  event: unknown,
  expectedPubkey: string,
  endpoint: AuthEndpoint,
  now = Math.floor(Date.now() / 1000)
): AuthEventCheck {
  if (!event || typeof event !== "object") return { valid: false, error: "signedEvent is required" }
  const { pubkey, kind, created_at, tags } = event as Record<string, unknown>

  if (pubkey !== expectedPubkey.toLowerCase()) {
    return { valid: false, error: "Event pubkey does not match claimed pubkey" }
  }
  if (kind !== AUTH_EVENT_KIND) {
    return { valid: false, error: `Invalid event kind: expected ${AUTH_EVENT_KIND}` }
  }
  if (typeof created_at !== "number") return { valid: false, error: "Event has no timestamp" }
  if (now - created_at > MAX_EVENT_AGE_SECONDS) return { valid: false, error: "Event is too old" }
  if (created_at - now > MAX_CLOCK_SKEW_SECONDS) return { valid: false, error: "Event timestamp is in the future" }
  if (!Array.isArray(tags)) return { valid: false, error: "Event has no tags" }

  const u = tagValue(tags, "u")
  let target: URL
  try {
    target = new URL(u ?? "")
  } catch {
    return { valid: false, error: "Auth event has no valid u tag" }
  }
  if (!isAllowedAuthOrigin(target.origin) || target.pathname.replace(/\/$/, "") !== endpoint) {
    return { valid: false, error: "Auth event is for a different URL" }
  }
  if (tagValue(tags, "method")?.toUpperCase() !== "POST") {
    return { valid: false, error: "Auth event is for a different HTTP method" }
  }

  const challenge = tagValue(tags, "challenge")
  if (!challenge || !/^[0-9a-f]{64}$/.test(challenge)) {
    return { valid: false, error: "Missing challenge tag in event" }
  }
  return { valid: true, challenge }
}
