import type { Event, EventTemplate } from "nostr-tools"
import {
  BunkerSigner,
  createNostrConnectURI,
  parseBunkerInput,
} from "nostr-tools/nip46"
import { generateSecretKey, getPublicKey } from "nostr-tools/pure"

// Inline utils to avoid @noble/hashes subpath resolution issues in Next.js
const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")

const hexToBytes = (hex: string): Uint8Array => {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) arr[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  return arr
}

export interface NostrChallengeSigner {
  getPublicKey(): Promise<string>
  signEvent(template: EventTemplate): Promise<Event>
}

export class BunkerSignerAdapter implements NostrChallengeSigner {
  constructor(private readonly bunker: BunkerSigner) {}

  async getPublicKey(): Promise<string> {
    return this.bunker.getPublicKey()
  }

  async signEvent(template: EventTemplate): Promise<Event> {
    return (await this.bunker.signEvent(
      template as EventTemplate & { pubkey: string }
    )) as Event
  }

  async close(): Promise<void> {
    try {
      this.bunker.close()
    } catch {
      // ignore close races
    }
  }
}

export interface StartNostrConnectOptions {
  relays?: string[]
  metadata?: { name?: string; url?: string }
  onAuthChallenge?: (url: string) => void
}

export interface NostrConnectHandle {
  uri: string
  ready: Promise<BunkerSignerAdapter>
  cancel: () => void
}

const DEFAULT_NOSTRCONNECT_RELAYS = [
  "wss://relay.nsec.app",
  "wss://relay.damus.io",
  "wss://nos.lol",
]

const NOSTR_CONNECT_LOCAL_KEY_PREFIX = "habit-tracker-nostrconnect-local-key:"
const NOSTR_CONNECT_URI_SECRET_PREFIX = "habit-tracker-nostrconnect-uri-secret:"
const BUNKER_LOCAL_KEY_PREFIX = "habit-tracker-bunker-local-key:"

function getSiteOrigin(): string {
  return typeof window !== "undefined" ? window.location.origin : "https://liberture-habits.fabriok.ar"
}

function normalizeRelays(relays: string[]): string {
  return [...new Set(relays)].sort().join(",")
}

function loadOrCreateSecretKey(storageKey: string): Uint8Array {
  if (typeof window === "undefined") return generateSecretKey()

  try {
    const stored = window.localStorage.getItem(storageKey)
    if (stored && /^[0-9a-fA-F]{64}$/.test(stored)) {
      return hexToBytes(stored)
    }

    const secretKey = generateSecretKey()
    window.localStorage.setItem(storageKey, bytesToHex(secretKey))
    return secretKey
  } catch {
    return generateSecretKey()
  }
}

function loadOrCreateNostrConnectSecretKey(relays: string[]): Uint8Array {
  // Amber/nsec.app key bunker permissions by the NIP-46 client pubkey.
  // If we rotate this key on every login, the signer accumulates duplicate
  // habits.fabriok.ar connections and can crash/confuse the mobile login flow.
  return loadOrCreateSecretKey(
    `${NOSTR_CONNECT_LOCAL_KEY_PREFIX}${getSiteOrigin()}:${normalizeRelays(relays)}`
  )
}

function loadOrCreateNostrConnectUriSecret(relays: string[]): string {
  // The nostrconnect:// `secret` is part of the signer-side pairing record.
  // Rotating it with Math.random() can make Amber/nsec.app treat the same
  // habits.fabriok.ar client as another remote connection.
  const storageKey = `${NOSTR_CONNECT_URI_SECRET_PREFIX}${getSiteOrigin()}:${normalizeRelays(relays)}`

  if (typeof window === "undefined") return crypto.randomUUID()

  try {
    const stored = window.localStorage.getItem(storageKey)
    if (stored && stored.length >= 16) return stored

    const secret = crypto.randomUUID()
    window.localStorage.setItem(storageKey, secret)
    return secret
  } catch {
    return crypto.randomUUID()
  }
}

function loadOrCreateBunkerSecretKey(remotePubkey: string, relayUrls: string[]): Uint8Array {
  return loadOrCreateSecretKey(
    `${BUNKER_LOCAL_KEY_PREFIX}${remotePubkey}:${normalizeRelays(relayUrls)}`
  )
}

export function startNostrConnect(
  options: StartNostrConnectOptions = {}
): NostrConnectHandle {
  const relays = options.relays?.length ? options.relays : DEFAULT_NOSTRCONNECT_RELAYS
  const localSecret = loadOrCreateNostrConnectSecretKey(relays)
  const localPubkey = getPublicKey(localSecret)
  const pairingSecret = loadOrCreateNostrConnectUriSecret(relays)
  const uri = createNostrConnectURI({
    clientPubkey: localPubkey,
    relays,
    secret: pairingSecret,
    name: options.metadata?.name ?? "Liberture",
    url:
      options.metadata?.url ??
      (typeof window !== "undefined" ? window.location.origin : "https://liberture-habits.fabriok.ar"),
  })

  let cancelled = false
  let bunker: BunkerSigner | null = null

  const ready = (async (): Promise<BunkerSignerAdapter> => {
    bunker = await BunkerSigner.fromURI(
      localSecret,
      uri,
      {
        onauth: (url) => {
          if (!cancelled) options.onAuthChallenge?.(url)
        },
      },
      60000
    )

    if (cancelled) {
      try {
        bunker.close()
      } catch {
        // ignore close races
      }
      throw new Error("NostrConnect cancelled")
    }

    return new BunkerSignerAdapter(bunker)
  })()

  return {
    uri,
    ready,
    cancel: () => {
      cancelled = true
      if (bunker) {
        try {
          bunker.close()
        } catch {
          // ignore close races
        }
      }
    },
  }
}

export interface FromBunkerUriOptions {
  onAuthChallenge?: (url: string) => void
}

export async function fromBunkerUri(
  bunkerUrl: string,
  options: FromBunkerUriOptions = {}
): Promise<BunkerSignerAdapter> {
  const parsed = await parseBunkerInput(bunkerUrl)
  if (!parsed) throw new Error("Invalid bunker URL")

  const relayUrls = parsed.relays ?? []
  const localSecret = loadOrCreateBunkerSecretKey(parsed.pubkey, relayUrls)
  const bunker = BunkerSigner.fromBunker(localSecret, parsed, {
    onauth: (url) => options.onAuthChallenge?.(url),
  })
  await bunker.connect()
  return new BunkerSignerAdapter(bunker)
}
