import { SimplePool } from "nostr-tools/pool"
import { npubEncode } from "nostr-tools/nip19"

export interface ProfileMatch {
  npub: string
  name: string
  address: string
  picture: string
}

export async function searchProfiles(query: string, signal: AbortSignal): Promise<ProfileMatch[]> {
  const term = query.trim().toLowerCase()
  if (signal.aborted || term.length < 2) return []
  const pool = new SimplePool()
  const cancel = () => pool.destroy()
  signal.addEventListener("abort", cancel, { once: true })
  try {
    const events = await pool.querySync(
      ["wss://relay.nostr.band", "wss://relay.primal.net"],
      { kinds: [0], search: term, limit: 30 },
      { maxWait: 4500 },
    )
    const seen = new Set<string>()
    const results: ProfileMatch[] = []
    for (const event of events.sort((a, b) => b.created_at - a.created_at || a.id.localeCompare(b.id))) {
      if (seen.has(event.pubkey) || event.created_at > Date.now() / 1000 + 60 || event.content.length > 65536)
        continue
      // SimplePool verifies event signatures before delivering events.
      try {
        const p = JSON.parse(event.content)
        seen.add(event.pubkey)
        if (
          ![p.display_name, p.name, p.nip05, p.lud16].some(
            (v) => typeof v === "string" && v.toLowerCase().includes(term),
          )
        )
          continue
        results.push({
          npub: npubEncode(event.pubkey),
          name: [p.display_name, p.name].find((v) => typeof v === "string" && v.trim()) || "",
          address: typeof p.nip05 === "string" ? p.nip05 : "",
          picture: typeof p.picture === "string" && p.picture.startsWith("https://") ? p.picture : "",
        })
      } catch {
        continue
      }
      if (results.length === 8) break
    }
    return results
  } finally {
    signal.removeEventListener("abort", cancel)
    pool.destroy()
  }
}
