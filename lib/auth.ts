import { managedAuthEnabled } from "@/lib/identity/config"
import { adminPubkeys } from "@/lib/identity/admin-keys"
import { cookies, headers } from "next/headers"

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
  if (managedAuthEnabled()) {
    const { trackerIdentity } = await import("@/lib/identity/tracker")
    const session = await trackerIdentity(await headers())
    return session ? { userId: session.id, pubkey: session.tracker.nostrPubkey ?? "" } : null
  }
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

/** Admin = one of the configured hex pubkeys. `userId` is the pubkey from getAuthUser. */
export async function isAdmin(userId: string): Promise<boolean> {
  if (managedAuthEnabled()) {
    const { activeUser } = await import("@/lib/identity/tracker")
    return (await activeUser(userId))?.role === "admin"
  }
  return adminPubkeys().includes(userId.toLowerCase())
}
