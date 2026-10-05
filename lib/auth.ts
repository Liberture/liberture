import { cookies } from "next/headers"

import { createNostrSessionsTable } from "@/lib/habits/db-migrate"
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/habits/nostr/session-store"

/**
 * Site-wide sign-in is the habit tracker's Nostr session (the same cookie the
 * tracker, OAuth consent and /api/storage use). `userId` is the hex pubkey.
 */
export interface AuthUser {
  userId: string
  pubkey: string
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  try {
    await createNostrSessionsTable()
    const pubkey = await verifySession(token)
    return pubkey ? { userId: pubkey, pubkey } : null
  } catch {
    return null
  }
}

// npub1m9vsm9d8sy0pevcjhenwm4ny6l37dm2hsg4dnusna43ql3n5305qy4zlg4
// npub1gxdhmu9swqduwhr6zptjy4ya693zp3ql28nemy4hd97kuufyrqdqwe5zfk
const DEFAULT_ADMIN_PUBKEYS = [
  "d9590d95a7811e1cb312be66edd664d7e3e6ed57822ad9f213ed620fc6748be8",
  "419b7df0b0701bc75c7a105722549dd16220c41f51e79d92b7697d6e7124181a",
]

function adminPubkeys(): string[] {
  const extra = (process.env.ADMIN_NOSTR_PUBKEYS ?? "")
    .split(",")
    .map((key) => key.trim().toLowerCase())
    .filter(Boolean)
  return [...DEFAULT_ADMIN_PUBKEYS, ...extra]
}

/** Admin = one of the configured hex pubkeys. `userId` is the pubkey from getAuthUser. */
export async function isAdmin(userId: string): Promise<boolean> {
  return adminPubkeys().includes(userId.toLowerCase())
}
