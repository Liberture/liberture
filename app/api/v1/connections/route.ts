import { NextResponse } from "next/server"
import { verifyApiKey } from "@/lib/habits/integration-auth"
import { listConnections } from "@/lib/habits/oauth/store"

/** GET /api/v1/connections — the assistants connected to this account. Owner auth. */
export async function GET(request: Request) {
  const user = await verifyApiKey(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ connections: await listConnections(user.userId) }, { headers: { "Cache-Control": "no-store" } })
}
