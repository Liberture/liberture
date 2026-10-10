import { NextResponse } from "next/server"
import { getAuthFromRequest } from "@/lib/habits/app-auth"
import { resetAccount } from "@/lib/habits/account-reset"

/**
 * POST /api/account/reset  { "confirm": "reset" }
 * Resets the signed-in account to a brand-new one (see lib/habits/account-reset.ts)
 * and returns the new data. The sign-in itself is kept. Assistant tokens can't
 * call this: it takes the app's own session or legacy API key only.
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
  if (body.confirm !== "reset") {
    return NextResponse.json({ error: 'Send { "confirm": "reset" } to reset the account.' }, { status: 400 })
  }

  try {
    const data = await resetAccount(auth)
    if (!data) return NextResponse.json({ error: "Account not found." }, { status: 404 })
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("Account reset failed:", error)
    return NextResponse.json({ error: "Couldn't reset the account. Nothing was changed." }, { status: 500 })
  }
}
