import { lookup } from "dns/promises"
import { isIP } from "net"

import { isAcceptableRedirectUri } from "./pkce"

/**
 * OAuth Client ID Metadata Documents (CIMD): a client whose client_id is an
 * https URL that serves its own registration, e.g. ChatGPT's
 * https://chatgpt.com/oauth/client.json. Nothing is stored; the document is
 * fetched and cached briefly.
 *
 * Fetching a URL a stranger chose is an SSRF risk on a box that runs other
 * services on localhost, so: https only, default port, public IPs only,
 * small body, short timeout, no redirects.
 */

export interface ClientMetadata {
  clientId: string
  name: string
  redirectUris: string[]
}

const cache = new Map<string, { at: number; value: ClientMetadata }>()
const TTL_MS = 60 * 60 * 1000
const MAX_BYTES = 64 * 1024

export function isMetadataClientId(clientId: string): boolean {
  try {
    const url = new URL(clientId)
    return url.protocol === "https:" && url.pathname !== "/" && !url.hash && !url.username && !url.password
  } catch {
    return false
  }
}

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number)
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
  }
  const v6 = address.toLowerCase()
  return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80") || v6.startsWith("::ffff:")
}

export async function fetchClientMetadata(clientId: string): Promise<ClientMetadata | null> {
  if (!isMetadataClientId(clientId)) return null
  const hit = cache.get(clientId)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value

  const url = new URL(clientId)
  if (url.port && url.port !== "443") return null
  try {
    const addresses = await lookup(url.hostname, { all: true })
    if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) return null
  } catch {
    return null
  }

  try {
    const res = await fetch(clientId, { redirect: "error", signal: AbortSignal.timeout(5000), headers: { Accept: "application/json" } })
    if (!res.ok) return null
    const text = await res.text()
    if (text.length > MAX_BYTES) return null
    const doc = JSON.parse(text) as { client_id?: unknown; client_name?: unknown; redirect_uris?: unknown }
    if (doc.client_id !== clientId) return null
    const redirectUris = Array.isArray(doc.redirect_uris) ? doc.redirect_uris.filter((u): u is string => typeof u === "string" && isAcceptableRedirectUri(u)) : []
    if (redirectUris.length === 0) return null
    const name = typeof doc.client_name === "string" && doc.client_name.trim() ? doc.client_name.trim().slice(0, 60) : url.hostname
    const value = { clientId, name, redirectUris }
    cache.set(clientId, { at: Date.now(), value })
    return value
  } catch {
    return null
  }
}
