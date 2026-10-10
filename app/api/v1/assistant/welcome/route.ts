import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { connectionKeyFor } from "@/lib/habits/api/connector-sync"
import { completeWelcome } from "@/lib/habits/api/welcome"

/**
 * POST /api/v1/assistant/welcome  { outcome?: "done" | "skipped" }  (complete_welcome)
 *
 * The assistant ran the first-conversation welcome (or the user skipped it),
 * so get_today stops asking for it on this connection.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  let body: { outcome?: unknown } = {}
  try {
    body = await request.json()
  } catch {
    // An empty body means "done".
  }
  const outcome = body.outcome === "skipped" ? "skipped" : "done"
  try {
    await completeWelcome(user.userId, connectionKeyFor(user), outcome)
  } catch (error) {
    console.error("complete_welcome failed:", error)
    return NextResponse.json({ error: "Couldn't save that; it will be offered again next time." }, { status: 500 })
  }
  return NextResponse.json({ success: true, outcome, say: outcome === "done" ? "All set." : "No problem, skipping the tour." })
}
