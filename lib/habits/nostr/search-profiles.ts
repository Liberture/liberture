import { SimplePool } from "nostr-tools/pool"
import { npubEncode } from "nostr-tools/nip19"
import type { Event } from "nostr-tools/core"

export interface ProfileMatch {
  npub: string
  name: string
  address: string
  picture: string
  keywords: string
}

const profileRelays = ["wss://purplepag.es", "wss://relay.damus.io", "wss://nos.lol"]
const searchRelays = ["wss://relay.vertexlab.io", "wss://relay.primal.net"]

function profiles(events: Event[]): ProfileMatch[] {
  const seen = new Set<string>()
  return events
    .sort((a, b) => b.created_at - a.created_at || a.id.localeCompare(b.id))
    .flatMap((event) => {
      if (seen.has(event.pubkey) || event.created_at > Date.now() / 1000 + 60 || event.content.length > 65536)
        return []
      try {
        const p = JSON.parse(event.content)
        const names = [p.display_name, p.displayName, p.name, p.nip05, p.lud16].filter(
          (v): v is string => typeof v === "string" && !!v.trim(),
        )
        seen.add(event.pubkey)
        return [
          {
            npub: npubEncode(event.pubkey),
            name: names[0] ?? "",
            address: typeof p.nip05 === "string" ? p.nip05 : "",
            picture: typeof p.picture === "string" && p.picture.startsWith("https://") ? p.picture : "",
            keywords: names.join(" ").toLowerCase(),
          },
        ]
      } catch {
        return []
      }
    })
}

export function rankProfiles(query: string, follows: ProfileMatch[], network: ProfileMatch[]) {
  const term = query.trim().replace(/^@/, "").toLowerCase()
  const seen = new Set<string>()
  return [...follows, ...network]
    .filter((p) => {
      if (!term || !p.keywords.includes(term) || seen.has(p.npub)) return false
      seen.add(p.npub)
      return true
    })
    .slice(0, 8)
}

export async function loadFollowProfiles(
  owner: string,
  signal: AbortSignal,
  update: (rows: ProfileMatch[]) => void,
) {
  const cacheKey = "challenge-follows:" + owner
  let rows: ProfileMatch[] = []
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) ?? "null")
    if (Array.isArray(cached?.rows)) {
      rows = cached.rows
      update(rows)
      if (Date.now() - cached.at < 3600000) return
    }
  } catch {
    /* Storage is optional. */
  }
  const pool = new SimplePool()
  const close = () => pool.destroy()
  signal.addEventListener("abort", close, { once: true })
  try {
    const events = await pool.querySync(
      profileRelays,
      { kinds: [3], authors: [owner], limit: 1 },
      { maxWait: 3500 },
    )
    const list = events
      .filter((e) => e.created_at <= Date.now() / 1000 + 60)
      .sort((a, b) => b.created_at - a.created_at || a.id.localeCompare(b.id))[0]
    if (!list || signal.aborted) return
    const keys = [
      ...new Set(list.tags.filter(([t, k]) => t === "p" && /^[0-9a-f]{64}$/.test(k)).map((tag) => tag[1])),
    ]
    const allowed = new Set<string>(keys.map(npubEncode))
    const byKey = new Map(rows.filter((row) => allowed.has(row.npub)).map((row) => [row.npub, row]))
    update([...byKey.values()])
    for (let i = 0; i < keys.length && !signal.aborted; i += 100) {
      const batch = keys.slice(i, i + 100)
      const records = await pool.querySync(
        profileRelays,
        { kinds: [0], authors: batch, limit: batch.length },
        { maxWait: 3000 },
      )
      if (signal.aborted) return
      for (const row of profiles(records)) byKey.set(row.npub, row)
      update([...byKey.values()])
    }
    if (!signal.aborted && (byKey.size || !keys.length))
      localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), rows: [...byKey.values()] }))
  } finally {
    signal.removeEventListener("abort", close)
    close()
  }
}

export async function searchProfiles(term: string, signal: AbortSignal) {
  const pool = new SimplePool()
  const close = () => pool.destroy()
  signal.addEventListener("abort", close, { once: true })
  try {
    const events = await pool.querySync(
      searchRelays,
      { kinds: [0], search: term.trim().replace(/^@/, ""), limit: 30 },
      { maxWait: 4000 },
    )
    return profiles(events)
  } finally {
    signal.removeEventListener("abort", close)
    close()
  }
}
