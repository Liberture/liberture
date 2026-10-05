import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { verifyApiKey } from "@/lib/habits/integration-auth"
import { effectivePermissions, sanitizePermissions } from "@/lib/habits/api-scopes"

/**
 * GET /api/v1/auth/permissions
 * What the integration token may do. Owner auth only (ht_ key or Nostr
 * session) — the hti_ token reads its scopes from /api/v1/assistant but can
 * never change them.
 */
export async function GET(request: Request) {
  const user = await verifyApiKey(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const stored = (user.data as unknown as Record<string, unknown>).integrationPermissions
  return NextResponse.json({ permissions: effectivePermissions(stored) })
}

/**
 * PUT /api/v1/auth/permissions
 * Body: { permissions: { read?: boolean, log_completions?: boolean, ... } }
 * Merges into the stored scopes. Written with jsonb_set, next to the token,
 * so the browser's blob save can never revert it.
 */
export async function PUT(request: Request) {
  const user = await verifyApiKey(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { permissions?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const update = sanitizePermissions(body.permissions)
  if (!update) {
    return NextResponse.json({ error: "permissions must be an object of scope → boolean" }, { status: 400 })
  }

  const current = (user.data as unknown as Record<string, unknown>).integrationPermissions
  const next = { ...effectivePermissions(current), ...update }

  try {
    const sql = getDb()
    await sql`
      UPDATE habit_users
      SET data = jsonb_set(data, '{integrationPermissions}', ${JSON.stringify(next)}::jsonb)
      WHERE id = ${user.userId}
    `
  } catch (error) {
    console.error("Failed to update integration permissions:", error)
    return NextResponse.json({ error: "Failed to save permissions" }, { status: 500 })
  }

  return NextResponse.json({ permissions: next })
}
