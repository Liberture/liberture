/**
 * The event every Nostr login signs (kind 27235, NIP-98 HTTP Auth).
 *
 * NIP-98 requires a `u` tag (the absolute URL being authenticated), a
 * `method` tag and empty content. Some signer extensions enforce that before
 * signing ("Invalid authentication u tag", "Invalid authentication content"),
 * so all three places that sign one (sign-in, session restore, account
 * migration) build it here.
 * The server-issued `challenge` tag is what the server actually verifies.
 */

export const AUTH_EVENT_KIND = 27235

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

/**
 * Server side: an optional `u` tag must point at the endpoint it was sent to.
 * Events without one (older clients) are still accepted; the challenge binds them.
 */
export function authUrlTagMatches(tags: unknown, endpoint: AuthEndpoint): boolean {
  if (!Array.isArray(tags)) return true
  const u = tags.find((t): t is string[] => Array.isArray(t) && t[0] === "u")
  if (!u) return true
  try {
    return new URL(String(u[1])).pathname.replace(/\/$/, "") === endpoint
  } catch {
    return false
  }
}
