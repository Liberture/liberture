"use client"

import { useEffect, useState } from "react"

/**
 * The signed-in user's public Nostr profile (kind 0): picture, name and NIP-05
 * address, for the app header. Read from public relays in the browser and
 * cached in localStorage, so the header renders instantly and refreshes in the
 * background at most once a day. Purely cosmetic: failures just leave the
 * fallback (initials, the tracker's own profile name).
 */

export interface NostrProfile {
  name: string | null
  picture: string | null
  nip05: string | null
  /** True once the NIP-05 address was checked against its domain. */
  nip05Verified: boolean
}

const PROFILE_RELAYS = ["wss://purplepag.es", "wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"]
const CACHE_PREFIX = "habit-tracker-nostr-profile:"
const REFRESH_MS = 24 * 60 * 60 * 1000

interface CacheEntry {
  at: number
  profile: NostrProfile
}

function readCache(pubkey: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + pubkey)
    return raw ? (JSON.parse(raw) as CacheEntry) : null
  } catch {
    return null
  }
}

function safeImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" ? url.toString() : null
  } catch {
    return null
  }
}

/** "_@domain" is the domain's root identity and is shown as just the domain (NIP-05). */
export function displayNip05(nip05: string): string {
  return nip05.startsWith("_@") ? nip05.slice(2) : nip05
}

async function fetchProfile(pubkey: string): Promise<NostrProfile | null> {
  const [{ SimplePool }, nip05] = await Promise.all([import("nostr-tools/pool"), import("nostr-tools/nip05")])
  const pool = new SimplePool()
  try {
    const events = await pool.querySync(PROFILE_RELAYS, { kinds: [0], authors: [pubkey], limit: 4 }, { maxWait: 4000 })
    const latest = events.sort((a, b) => b.created_at - a.created_at)[0]
    if (!latest) return null
    const meta = JSON.parse(latest.content) as Record<string, unknown>
    const name =
      [meta.display_name, meta.displayName, meta.name].find((v): v is string => typeof v === "string" && v.trim() !== "")?.trim() ?? null
    const address = typeof meta.nip05 === "string" && nip05.isNip05(meta.nip05.trim().toLowerCase()) ? meta.nip05.trim().toLowerCase() : null
    let verified = false
    if (address) {
      verified = await nip05.isValid(pubkey, address as `${string}@${string}`).catch(() => false)
    }
    return { name, picture: safeImageUrl(meta.picture), nip05: address, nip05Verified: verified }
  } catch {
    return null
  } finally {
    pool.close(PROFILE_RELAYS)
  }
}

export function useNostrProfile(pubkey: string | null): NostrProfile | null {
  const [profile, setProfile] = useState<NostrProfile | null>(null)

  useEffect(() => {
    if (!pubkey || !/^[0-9a-f]{64}$/.test(pubkey)) {
      setProfile(null)
      return
    }
    const cached = readCache(pubkey)
    if (cached) setProfile(cached.profile)
    if (cached && Date.now() - cached.at < REFRESH_MS) return

    let cancelled = false
    fetchProfile(pubkey).then((fresh) => {
      if (cancelled || !fresh) return
      setProfile(fresh)
      try {
        localStorage.setItem(CACHE_PREFIX + pubkey, JSON.stringify({ at: Date.now(), profile: fresh } satisfies CacheEntry))
      } catch {
        // Storage full or blocked: the profile still shows for this visit.
      }
    })
    return () => {
      cancelled = true
    }
  }, [pubkey])

  return profile
}
