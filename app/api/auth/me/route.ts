import { getDb } from "@/lib/habits/db"
import { managedAuthEnabled } from "@/lib/identity/config"
import { NextResponse } from "next/server"

import { getAuthUser, isAdmin } from "@/lib/auth"

/** Who the session cookie belongs to, and whether they may open /admin. */
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ user: null })
  const sql = getDb()
  const [profile] = managedAuthEnabled()
    ? await sql`SELECT data #>> '{profile,name}' AS name FROM habit_users WHERE id=${Number(user.userId.slice(6))}`
    : await sql`SELECT data #>> '{profile,name}' AS name FROM habit_users WHERE nostr_pubkey=${user.pubkey}`
  return NextResponse.json({ user: { name: profile?.name || null, pubkey: user.pubkey, isAdmin: await isAdmin(user.userId) } })
}
