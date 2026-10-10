import { NextResponse } from "next/server"
import { getAuthFromRequest } from "@/lib/habits/app-auth"
import { deleteAccount } from "@/lib/habits/account-delete"

/**
 * POST /api/account/delete  { "confirm": "delete" }
 * Deletes the signed-in account and everything in it (lib/habits/account-delete.ts).
 * Assistant tokens can't call this: it takes the app's own session or legacy API key only.
 */
export async function POST(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: "Sign in required." }, { status: 401 })

  let body: { confirm?: unknown } = {}
  try {
    body = await request.json()
  } catch {
    // handled below
  }
  if (body.confirm !== "delete") {
    return NextResponse.json({ error: 'Send { "confirm": "delete" } to delete the account.' }, { status: 400 })
  }

  try {
    const deleted = await deleteAccount(auth)
    if (!deleted) return NextResponse.json({ error: "Account not found." }, { status: 404 })
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("Account delete failed:", error)
    return NextResponse.json({ error: "Couldn't delete the account. Nothing was changed." }, { status: 500 })
  }
}
