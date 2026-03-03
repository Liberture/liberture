import { Relay } from "nostr-tools/relay"
import * as nip19 from "nostr-tools/nip19"
import { getLibertureNostrAccount } from "./nostr-account"
import { Nip46Client, parseBunkerUrl, type BunkerConnection } from "./nip46"

// Relays to publish to
const PUBLISH_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol",
  "wss://relay.snort.social",
  "wss://purplepag.es",
  "wss://relay.primal.net",
]

// Event kinds we use
export const EVENT_KINDS = {
  METADATA: 0,
  LONG_FORM: 30023,      // NIP-23 long-form content
  PERSON: 30078,         // Custom: directory person entry
  ORGANIZATION: 30079,   // Custom: directory organization
  PROTOCOL: 30080,       // Custom: protocol/practice
  BOOK: 30081,           // Custom: book recommendation
} as const

export interface NostrEvent {
  id?: string
  pubkey?: string
  created_at: number
  kind: number
  tags: string[][]
  content: string
  sig?: string
}

export interface PublishResult {
  success: boolean
  eventId?: string
  relaysPublished: string[]
  relaysFailed: string[]
  error?: string
}

class NostrPublisher {
  private client: Nip46Client | null = null
  private pubkey: string | null = null

  async connect(): Promise<boolean> {
    const account = await getLibertureNostrAccount()
    
    if (!account?.nbunkerUrl) {
      console.error("[NostrPublisher] No bunker URL configured")
      return false
    }

    const parsed = parseBunkerUrl(account.nbunkerUrl)
    if (!parsed) {
      console.error("[NostrPublisher] Invalid bunker URL")
      return false
    }

    // Generate client keys for this session
    const { generateSecretKey, getPublicKey } = await import("nostr-tools/pure")
    const clientSecretKey = generateSecretKey()
    const clientPubkey = getPublicKey(clientSecretKey)

    const connection: BunkerConnection = {
      pubkey: parsed.pubkey,
      relayUrl: parsed.relayUrl,
      secret: account.nbunkerSecret || undefined,
      clientSecretKey,
      clientPubkey,
    }

    this.client = new Nip46Client(connection)
    
    try {
      await this.client.connect()
      this.pubkey = await this.client.getPublicKey()
      console.log("[NostrPublisher] Connected, pubkey:", this.pubkey)
      return true
    } catch (e) {
      console.error("[NostrPublisher] Failed to connect:", e)
      return false
    }
  }

  async signEvent(event: NostrEvent): Promise<NostrEvent | null> {
    if (!this.client) {
      const connected = await this.connect()
      if (!connected) return null
    }

    try {
      const signed = await this.client!.signEvent({
        kind: event.kind,
        created_at: event.created_at,
        tags: event.tags,
        content: event.content,
      })
      return signed
    } catch (e) {
      console.error("[NostrPublisher] Failed to sign event:", e)
      return null
    }
  }

  async publish(event: NostrEvent): Promise<PublishResult> {
    const signed = await this.signEvent(event)
    if (!signed) {
      return {
        success: false,
        relaysPublished: [],
        relaysFailed: PUBLISH_RELAYS,
        error: "Failed to sign event",
      }
    }

    const relaysPublished: string[] = []
    const relaysFailed: string[] = []

    // Publish to all relays in parallel
    await Promise.all(
      PUBLISH_RELAYS.map(async (relayUrl) => {
        try {
          const relay = await Relay.connect(relayUrl)
          await relay.publish(signed)
          relay.close()
          relaysPublished.push(relayUrl)
        } catch (e) {
          console.error(`[NostrPublisher] Failed to publish to ${relayUrl}:`, e)
          relaysFailed.push(relayUrl)
        }
      })
    )

    return {
      success: relaysPublished.length > 0,
      eventId: signed.id,
      relaysPublished,
      relaysFailed,
    }
  }

  disconnect() {
    this.client?.close()
    this.client = null
    this.pubkey = null
  }
}

// Singleton instance
let publisherInstance: NostrPublisher | null = null

export function getPublisher(): NostrPublisher {
  if (!publisherInstance) {
    publisherInstance = new NostrPublisher()
  }
  return publisherInstance
}

// Helper functions to create events

export function createPersonEvent(data: {
  slug: string
  name: string
  bio?: string
  image?: string
  nostrPubkey?: string
  twitter?: string
  website?: string
  expertise?: string[]
  pillars?: string[]
}): NostrEvent {
  const tags: string[][] = [
    ["d", data.slug],
    ["title", data.name],
  ]

  if (data.image) tags.push(["image", data.image])
  if (data.nostrPubkey) tags.push(["p", data.nostrPubkey, "subject"])
  if (data.twitter) tags.push(["i", `twitter:${data.twitter}`])
  if (data.website) tags.push(["r", data.website])
  data.expertise?.forEach(e => tags.push(["t", e.toLowerCase()]))
  data.pillars?.forEach(p => tags.push(["t", p.toLowerCase()]))

  return {
    kind: EVENT_KINDS.PERSON,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: JSON.stringify({
      name: data.name,
      bio: data.bio,
      image: data.image,
      twitter: data.twitter,
      website: data.website,
      expertise: data.expertise,
      pillars: data.pillars,
    }),
  }
}

export function createOrganizationEvent(data: {
  slug: string
  name: string
  description?: string
  logo?: string
  website?: string
  category?: string
  pillars?: string[]
}): NostrEvent {
  const tags: string[][] = [
    ["d", data.slug],
    ["title", data.name],
  ]

  if (data.logo) tags.push(["image", data.logo])
  if (data.website) tags.push(["r", data.website])
  if (data.category) tags.push(["t", data.category.toLowerCase()])
  data.pillars?.forEach(p => tags.push(["t", p.toLowerCase()]))

  return {
    kind: EVENT_KINDS.ORGANIZATION,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: JSON.stringify({
      name: data.name,
      description: data.description,
      logo: data.logo,
      website: data.website,
      category: data.category,
      pillars: data.pillars,
    }),
  }
}

export function createProtocolEvent(data: {
  slug: string
  title: string
  summary?: string
  content: string
  image?: string
  pillar: string
  authorPubkey?: string
  authorName?: string
  difficulty?: string
  duration?: string
  tags?: string[]
}): NostrEvent {
  const eventTags: string[][] = [
    ["d", data.slug],
    ["title", data.title],
    ["t", data.pillar.toLowerCase()],
    ["t", "protocol"],
  ]

  if (data.summary) eventTags.push(["summary", data.summary])
  if (data.image) eventTags.push(["image", data.image])
  if (data.authorPubkey) eventTags.push(["p", data.authorPubkey, "author"])
  if (data.difficulty) eventTags.push(["difficulty", data.difficulty])
  if (data.duration) eventTags.push(["duration", data.duration])
  data.tags?.forEach(t => eventTags.push(["t", t.toLowerCase()]))

  return {
    kind: EVENT_KINDS.PROTOCOL,
    created_at: Math.floor(Date.now() / 1000),
    tags: eventTags,
    content: data.content,
  }
}

export function createBookEvent(data: {
  slug: string
  title: string
  author: string
  description?: string
  cover?: string
  isbn?: string
  pillars?: string[]
  tags?: string[]
}): NostrEvent {
  const eventTags: string[][] = [
    ["d", data.slug],
    ["title", data.title],
    ["author", data.author],
  ]

  if (data.cover) eventTags.push(["image", data.cover])
  if (data.isbn) eventTags.push(["i", `isbn:${data.isbn}`])
  data.pillars?.forEach(p => eventTags.push(["t", p.toLowerCase()]))
  data.tags?.forEach(t => eventTags.push(["t", t.toLowerCase()]))

  return {
    kind: EVENT_KINDS.BOOK,
    created_at: Math.floor(Date.now() / 1000),
    tags: eventTags,
    content: JSON.stringify({
      title: data.title,
      author: data.author,
      description: data.description,
      cover: data.cover,
      isbn: data.isbn,
    }),
  }
}

export function createLongFormEvent(data: {
  slug: string
  title: string
  summary?: string
  content: string
  image?: string
  publishedAt?: number
  tags?: string[]
}): NostrEvent {
  const eventTags: string[][] = [
    ["d", data.slug],
    ["title", data.title],
    ["published_at", String(data.publishedAt || Math.floor(Date.now() / 1000))],
  ]

  if (data.summary) eventTags.push(["summary", data.summary])
  if (data.image) eventTags.push(["image", data.image])
  data.tags?.forEach(t => eventTags.push(["t", t.toLowerCase()]))

  return {
    kind: EVENT_KINDS.LONG_FORM,
    created_at: Math.floor(Date.now() / 1000),
    tags: eventTags,
    content: data.content,
  }
}
