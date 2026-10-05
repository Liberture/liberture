import { NextResponse } from "next/server"
import { verifyApiKey } from "@/lib/habits/integration-auth"
import { revokeConnection } from "@/lib/habits/oauth/store"

/** DELETE /api/v1/connections/:id — disconnect one assistant. Its tokens stop working at once. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyApiKey(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const ok = await revokeConnection(user.userId, id)
  return ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Not found" }, { status: 404 })
}
