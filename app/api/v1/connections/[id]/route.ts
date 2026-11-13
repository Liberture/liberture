import { NextResponse } from "next/server"
import { withTrackerOwner } from "@/lib/habits/api/with-tracker-owner"
import { revokeConnection } from "@/lib/habits/oauth/store"

/** DELETE /api/v1/connections/:id — disconnect one assistant. Its tokens stop working at once. */
export const DELETE = withTrackerOwner(async (userId, request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const ok = await revokeConnection(userId, id)
  return ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Not found" }, { status: 404 })
})
