import { Relay } from "nostr-tools/relay"

// Relays to read from
const READ_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol",
  "wss://relay.snort.social",
  "wss://purplepag.es",
]

// Liberture's pubkey (hardcoded for now, should match admin)
const LIBERTURE_PUBKEY = "d9590d95a7811e1cb312be66edd664d7e3e6ed57822ad9f213ed620fc6748be8"

// Event kinds
export const EVENT_KINDS = {
  LONG_FORM: 30023,
  PERSON: 30078,
  ORGANIZATION: 30079,
  PROTOCOL: 30080,
  BOOK: 30081,
} as const

export interface NostrEvent {
  id: string
  pubkey: string
  created_at: number
  kind: number
  tags: string[][]
  content: string
  sig: string
}

export interface ParsedPerson {
  id: string
  slug: string
  name: string
  bio?: string
  image?: string
  website?: string
  nostrPubkey?: string
  twitter?: string
  expertise: string[]
  pillars: string[]
  createdAt: number
}

export interface ParsedOrganization {
  id: string
  slug: string
  name: string
  description?: string
  logo?: string
  website?: string
  category?: string
  pillars: string[]
  createdAt: number
}

export interface ParsedProtocol {
  id: string
  slug: string
  title: string
  summary?: string
  content: string
  image?: string
  pillar: string
  difficulty?: string
  duration?: string
  authorPubkey?: string
  tags: string[]
  createdAt: number
}

export interface ParsedBook {
  id: string
  slug: string
  title: string
  author: string
  description?: string
  cover?: string
  isbn?: string
  pillars: string[]
  tags: string[]
  createdAt: number
}

// Helper to get tag value
function getTagValue(tags: string[][], key: string): string | undefined {
  const tag = tags.find(t => t[0] === key)
  return tag?.[1]
}

// Helper to get all tag values for a key
function getAllTagValues(tags: string[][], key: string): string[] {
  return tags.filter(t => t[0] === key).map(t => t[1])
}

// Parse a person event
function parsePerson(event: NostrEvent): ParsedPerson {
  const content = JSON.parse(event.content || "{}")
  return {
    id: event.id,
    slug: getTagValue(event.tags, "d") || event.id.slice(0, 8),
    name: getTagValue(event.tags, "title") || content.name || "Unknown",
    bio: content.bio,
    image: getTagValue(event.tags, "image") || content.image,
    website: content.website,
    nostrPubkey: getTagValue(event.tags, "p"),
    twitter: content.twitter,
    expertise: content.expertise || [],
    pillars: getAllTagValues(event.tags, "t").filter(t => 
      ["work", "sleep", "nutrition", "mind", "exercise", "finance"].includes(t)
    ),
    createdAt: event.created_at,
  }
}

// Parse an organization event
function parseOrganization(event: NostrEvent): ParsedOrganization {
  const content = JSON.parse(event.content || "{}")
  return {
    id: event.id,
    slug: getTagValue(event.tags, "d") || event.id.slice(0, 8),
    name: getTagValue(event.tags, "title") || content.name || "Unknown",
    description: content.description,
    logo: getTagValue(event.tags, "image") || content.logo,
    website: content.website,
    category: content.category,
    pillars: getAllTagValues(event.tags, "t").filter(t => 
      ["work", "sleep", "nutrition", "mind", "exercise", "finance"].includes(t)
    ),
    createdAt: event.created_at,
  }
}

// Parse a protocol event
function parseProtocol(event: NostrEvent): ParsedProtocol {
  const allTags = getAllTagValues(event.tags, "t")
  const pillarTags = ["work", "sleep", "nutrition", "mind", "exercise", "finance"]
  const pillar = allTags.find(t => pillarTags.includes(t)) || "mind"
  const otherTags = allTags.filter(t => !pillarTags.includes(t) && t !== "protocol")

  return {
    id: event.id,
    slug: getTagValue(event.tags, "d") || event.id.slice(0, 8),
    title: getTagValue(event.tags, "title") || "Untitled",
    summary: getTagValue(event.tags, "summary"),
    content: event.content,
    image: getTagValue(event.tags, "image"),
    pillar,
    difficulty: getTagValue(event.tags, "difficulty"),
    duration: getTagValue(event.tags, "duration"),
    authorPubkey: event.tags.find(t => t[0] === "p" && t[2] === "author")?.[1],
    tags: otherTags,
    createdAt: event.created_at,
  }
}

// Parse a book event
function parseBook(event: NostrEvent): ParsedBook {
  const content = JSON.parse(event.content || "{}")
  const allTags = getAllTagValues(event.tags, "t")
  const pillarTags = ["work", "sleep", "nutrition", "mind", "exercise", "finance"]
  
  return {
    id: event.id,
    slug: getTagValue(event.tags, "d") || event.id.slice(0, 8),
    title: getTagValue(event.tags, "title") || content.title || "Untitled",
    author: getTagValue(event.tags, "author") || content.author || "Unknown",
    description: content.description,
    cover: getTagValue(event.tags, "image") || content.cover,
    isbn: content.isbn,
    pillars: allTags.filter(t => pillarTags.includes(t)),
    tags: allTags.filter(t => !pillarTags.includes(t)),
    createdAt: event.created_at,
  }
}

// Fetch events from relays
async function fetchFromRelays(
  filter: { kinds: number[]; authors?: string[]; "#t"?: string[]; "#d"?: string[]; limit?: number }
): Promise<NostrEvent[]> {
  const events: Map<string, NostrEvent> = new Map()
  
  const fetchFromRelay = (relayUrl: string): Promise<void> => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve()
      }, 5000)

      let ws: WebSocket
      try {
        ws = new WebSocket(relayUrl)
      } catch {
        clearTimeout(timeout)
        resolve()
        return
      }

      const subId = Math.random().toString(36).slice(2, 10)

      ws.onopen = () => {
        ws.send(JSON.stringify(["REQ", subId, filter]))
      }

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data)
          if (data[0] === "EVENT" && data[1] === subId) {
            const event = data[2] as NostrEvent
            // Keep the most recent version of each event (by d tag for replaceable)
            const dTag = event.tags.find(t => t[0] === "d")?.[1]
            const key = dTag ? `${event.kind}:${event.pubkey}:${dTag}` : event.id
            const existing = events.get(key)
            if (!existing || existing.created_at < event.created_at) {
              events.set(key, event)
            }
          }
          if (data[0] === "EOSE") {
            clearTimeout(timeout)
            ws.close()
            resolve()
          }
        } catch {}
      }

      ws.onerror = () => {
        clearTimeout(timeout)
        resolve()
      }

      ws.onclose = () => {
        clearTimeout(timeout)
        resolve()
      }
    })
  }

  await Promise.all(READ_RELAYS.map(fetchFromRelay))
  
  return Array.from(events.values()).sort((a, b) => b.created_at - a.created_at)
}

// Public API

export async function fetchPeople(options?: { pillar?: string; limit?: number }): Promise<ParsedPerson[]> {
  const filter: any = {
    kinds: [EVENT_KINDS.PERSON],
    authors: [LIBERTURE_PUBKEY],
    limit: options?.limit || 100,
  }
  if (options?.pillar) {
    filter["#t"] = [options.pillar]
  }
  
  const events = await fetchFromRelays(filter)
  return events.map(parsePerson)
}

export async function fetchPerson(slug: string): Promise<ParsedPerson | null> {
  const filter = {
    kinds: [EVENT_KINDS.PERSON],
    authors: [LIBERTURE_PUBKEY],
    "#d": [slug],
    limit: 1,
  }
  
  const events = await fetchFromRelays(filter)
  return events.length > 0 ? parsePerson(events[0]) : null
}

export async function fetchOrganizations(options?: { pillar?: string; limit?: number }): Promise<ParsedOrganization[]> {
  const filter: any = {
    kinds: [EVENT_KINDS.ORGANIZATION],
    authors: [LIBERTURE_PUBKEY],
    limit: options?.limit || 100,
  }
  if (options?.pillar) {
    filter["#t"] = [options.pillar]
  }
  
  const events = await fetchFromRelays(filter)
  return events.map(parseOrganization)
}

export async function fetchOrganization(slug: string): Promise<ParsedOrganization | null> {
  const filter = {
    kinds: [EVENT_KINDS.ORGANIZATION],
    authors: [LIBERTURE_PUBKEY],
    "#d": [slug],
    limit: 1,
  }
  
  const events = await fetchFromRelays(filter)
  return events.length > 0 ? parseOrganization(events[0]) : null
}

export async function fetchProtocols(options?: { pillar?: string; tag?: string; limit?: number }): Promise<ParsedProtocol[]> {
  const filter: any = {
    kinds: [EVENT_KINDS.PROTOCOL],
    authors: [LIBERTURE_PUBKEY],
    limit: options?.limit || 100,
  }
  if (options?.pillar) {
    filter["#t"] = [options.pillar]
  } else if (options?.tag) {
    filter["#t"] = [options.tag]
  }
  
  const events = await fetchFromRelays(filter)
  return events.map(parseProtocol)
}

export async function fetchProtocol(slug: string): Promise<ParsedProtocol | null> {
  const filter = {
    kinds: [EVENT_KINDS.PROTOCOL],
    authors: [LIBERTURE_PUBKEY],
    "#d": [slug],
    limit: 1,
  }
  
  const events = await fetchFromRelays(filter)
  return events.length > 0 ? parseProtocol(events[0]) : null
}

export async function fetchBooks(options?: { pillar?: string; limit?: number }): Promise<ParsedBook[]> {
  const filter: any = {
    kinds: [EVENT_KINDS.BOOK],
    authors: [LIBERTURE_PUBKEY],
    limit: options?.limit || 100,
  }
  if (options?.pillar) {
    filter["#t"] = [options.pillar]
  }
  
  const events = await fetchFromRelays(filter)
  return events.map(parseBook)
}

export async function fetchBook(slug: string): Promise<ParsedBook | null> {
  const filter = {
    kinds: [EVENT_KINDS.BOOK],
    authors: [LIBERTURE_PUBKEY],
    "#d": [slug],
    limit: 1,
  }
  
  const events = await fetchFromRelays(filter)
  return events.length > 0 ? parseBook(events[0]) : null
}

// Fetch all content for a pillar
export async function fetchPillarContent(pillar: string): Promise<{
  protocols: ParsedProtocol[]
  people: ParsedPerson[]
  organizations: ParsedOrganization[]
  books: ParsedBook[]
}> {
  const [protocols, people, organizations, books] = await Promise.all([
    fetchProtocols({ pillar }),
    fetchPeople({ pillar }),
    fetchOrganizations({ pillar }),
    fetchBooks({ pillar }),
  ])

  return { protocols, people, organizations, books }
}
