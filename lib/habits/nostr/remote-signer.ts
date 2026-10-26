/**
 * NIP-46 remote signers (Amber, nsec.app, nsecBunker) for sign-in, on the
 * nostr-wot-sdk Nip46Signer: NIP-44 transport, the pairing secret checked on
 * connect, replies only accepted from the paired bunker.
 *
 * What this module adds is one stable client key per signer, kept in
 * localStorage. Amber and nsec.app list a connection per client pubkey, so a
 * fresh key on every sign-in piles up duplicate "Liberture" entries there and
 * can confuse the mobile flow. The key can only do what the user's signer lets
 * it, and Nostr Connect asks for nothing beyond signing the login event.
 */

import { Nip46Signer, type NostrConnectHandle } from "nostr-wot-sdk/signers"
import { generateSecretKey } from "nostr-tools/pure"

export type { Nip46Signer }

export const NOSTRCONNECT_RELAYS = ["wss://relay.nsec.app", "wss://relay.damus.io", "wss://nos.lol"]

/** The only permission requested over Nostr Connect: signing the NIP-98 login event. */
const SIGN_IN_PERMS = "sign_event:27235"

// Same storage keys as the nostr-tools adapter this replaces, so existing pairings carry over.
const NOSTR_CONNECT_LOCAL_KEY_PREFIX = "habit-tracker-nostrconnect-local-key:"
const NOSTR_CONNECT_URI_SECRET_PREFIX = "habit-tracker-nostrconnect-uri-secret:"
const BUNKER_LOCAL_KEY_PREFIX = "habit-tracker-bunker-local-key:"

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")

function normalizeRelays(relays: string[]): string {
  return [...new Set(relays)].sort().join(",")
}

function loadOrCreate(storageKey: string, isValid: (value: string) => boolean, create: () => string): string {
  try {
    const stored = window.localStorage.getItem(storageKey)
    if (stored && isValid(stored)) return stored
    const value = create()
    window.localStorage.setItem(storageKey, value)
    return value
  } catch {
    return create()
  }
}

const isHexKey = (value: string) => /^[0-9a-fA-F]{64}$/.test(value)
const newHexKey = () => bytesToHex(generateSecretKey())

/** Only https auth_url links are shown: the bunker chooses this URL. */
function httpsOnly(onAuthChallenge?: (url: string) => void) {
  return (url: string) => {
    try {
      if (new URL(url).protocol === "https:") onAuthChallenge?.(url)
    } catch {
      // Not a URL: nothing to show.
    }
  }
}

export interface StartNostrConnectOptions {
  relays?: string[]
  onAuthChallenge?: (url: string) => void
}

/** Client-initiated pairing: render `uri` as a QR; `ready` resolves once the signer connects. */
export function startNostrConnect(options: StartNostrConnectOptions = {}): NostrConnectHandle {
  const relays = options.relays?.length ? options.relays : NOSTRCONNECT_RELAYS
  const scope = `${window.location.origin}:${normalizeRelays(relays)}`
  return Nip46Signer.startNostrConnect({
    relays,
    clientSecretKey: loadOrCreate(`${NOSTR_CONNECT_LOCAL_KEY_PREFIX}${scope}`, isHexKey, newHexKey),
    // Part of the signer-side pairing record too: rotating it makes Amber and
    // nsec.app treat the same client as a new connection.
    secret: loadOrCreate(`${NOSTR_CONNECT_URI_SECRET_PREFIX}${scope}`, (s) => s.length >= 16, () => crypto.randomUUID()),
    perms: SIGN_IN_PERMS,
    metadata: { name: "Liberture", url: window.location.origin },
    onAuthChallenge: httpsOnly(options.onAuthChallenge),
  })
}

export interface FromBunkerUriOptions {
  onAuthChallenge?: (url: string) => void
}

/** Signer-initiated pairing: a pasted `bunker://` URI (or a NIP-05 that resolves to one). */
export async function fromBunkerUri(uri: string, options: FromBunkerUriOptions = {}): Promise<Nip46Signer> {
  const match = /^bunker:\/\/([0-9a-fA-F]{64})\/?(?:\?(.*))?$/.exec(uri.trim())
  const clientSecretKey = match
    ? loadOrCreate(
        `${BUNKER_LOCAL_KEY_PREFIX}${match[1]}:${normalizeRelays(new URLSearchParams(match[2] ?? "").getAll("relay"))}`,
        isHexKey,
        newHexKey
      )
    : undefined
  return Nip46Signer.fromBunkerUri(uri, {
    clientSecretKey,
    onAuthChallenge: httpsOnly(options.onAuthChallenge),
  })
}
