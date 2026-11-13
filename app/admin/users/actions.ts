"use server"

import { headers } from "next/headers"
import { nip19 } from "nostr-tools"
import { managedAuthEnabled } from "@/lib/identity/config"
import { identity } from "@/lib/identity/server"
import { freshStorageData } from "@/lib/habits/default-data"
import { randomInternalApiKey } from "@/lib/habits/internal-api-key"
import { getDb } from "@/lib/habits/db"

export async function provisionNostrUser(name: string, key: string) {
  if (!managedAuthEnabled()) return "unauthorized"
  const session = await identity().api.getSession({ headers: await headers() })
  if (session?.user.role !== "admin" || session.session.impersonatedBy) return "unauthorized"
  if (typeof name !== "string" || !name.trim() || name.length > 128 || typeof key !== "string" || key.length > 128) return "invalid"

  let pubkey = key.trim().toLowerCase()
  if (pubkey.startsWith("npub1")) {
    try {
      const decoded = nip19.decode(pubkey)
      if (decoded.type !== "npub") return "invalid"
      pubkey = decoded.data
    } catch { return "invalid" }
  }
  if (!/^[a-f0-9]{64}$/.test(pubkey)) return "invalid"

  const data = freshStorageData()
  const displayName = name.trim()
  const rows = await getDb()`
    INSERT INTO habit_users (nostr_pubkey, api_key, data)
    VALUES (${pubkey}, ${randomInternalApiKey()}, ${JSON.stringify({ ...data, profile: { ...data.profile, name: displayName } })}::jsonb)
    ON CONFLICT DO NOTHING RETURNING id
  `
  return rows.length ? "created" : "duplicate"
}
