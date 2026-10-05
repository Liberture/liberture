import crypto from "crypto"

/**
 * Pure helpers for the OAuth server (lib/oauth). No database, so they can be
 * unit-tested directly.
 */

export function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex")
}

export function randomToken(prefix: string): string {
  return `${prefix}${crypto.randomBytes(32).toString("hex")}`
}

/** RFC 7636 S256: BASE64URL(SHA256(verifier)) must equal the challenge. */
export function verifyPkce(verifier: string, challenge: string): boolean {
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) return false
  const computed = crypto.createHash("sha256").update(verifier).digest("base64url")
  const a = Buffer.from(computed)
  const b = Buffer.from(challenge)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/**
 * Redirect URIs a dynamically registered client may use: https anywhere, or
 * http only on loopback (desktop clients and local testing). No fragments.
 */
export function isAcceptableRedirectUri(uri: string): boolean {
  let url: URL
  try {
    url = new URL(uri)
  } catch {
    return false
  }
  if (url.hash) return false
  if (url.protocol === "https:") return true
  return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
}

/** Exact match against registered URIs, or a prefix for static clients (Custom GPT callbacks carry the GPT id). */
export function redirectAllowed(uri: string, exact: string[], prefixes: string[]): boolean {
  if (!isAcceptableRedirectUri(uri)) return false
  return exact.includes(uri) || prefixes.some((p) => uri.startsWith(p))
}

/** Short human name for the consent screen: "claude.ai", "chatgpt.com". */
export function redirectHost(uri: string): string {
  try {
    return new URL(uri).host
  } catch {
    return uri
  }
}
