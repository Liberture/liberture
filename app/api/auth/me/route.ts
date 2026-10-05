import { NextResponse } from "next/server"

import { getAuthUser, isAdmin } from "@/lib/auth"

/** Who the session cookie belongs to, and whether they may open /admin. */
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ user: null })
  return NextResponse.json({ user: { pubkey: user.pubkey, isAdmin: await isAdmin(user.pubkey) } })
}
