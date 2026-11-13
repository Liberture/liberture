import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { withTrackerOwner } from "@/lib/habits/api/with-tracker-owner"
import { effectivePermissions, sanitizePermissions } from "@/lib/habits/api-scopes"

/**
 * GET /api/v1/auth/permissions
 * What the integration token may do. Owner auth only (ht_ key or Nostr
 * session) — the hti_ token reads its scopes from /api/v1/assistant but can
 * never change them.
 */
export const GET = withTrackerOwner(async (userId) => {
  const [row] = await getDb()`SELECT data->'integrationPermissions' AS permissions FROM habit_users WHERE id = ${userId}`
  return NextResponse.json({ permissions: effectivePermissions(row?.permissions) }, { headers: { "Cache-Control": "private, no-store" } })
})

/**
 * PUT /api/v1/auth/permissions
 * Body: { permissions: { read?: boolean, log_completions?: boolean, ... } }
 * Merges into the stored scopes. Written with jsonb_set, next to the token,
 * so the browser's blob save can never revert it.
 */
export const PUT = withTrackerOwner(async (userId, request) => {
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

  try {
    const [row] = await getDb()`
      UPDATE habit_users
      SET data = jsonb_set(COALESCE(data, '{}'::jsonb), '{integrationPermissions}',
        (CASE WHEN jsonb_typeof(data->'integrationPermissions') = 'object'
          THEN data->'integrationPermissions' ELSE '{}'::jsonb END) || ${JSON.stringify(update)}::jsonb)
      WHERE id = ${userId}
      RETURNING data->'integrationPermissions' AS permissions
    `
    if (!row) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ permissions: effectivePermissions(row.permissions) })
  } catch (error) {
    console.error("Failed to update integration permissions:", error)
    return NextResponse.json({ error: "Failed to save permissions" }, { status: 500 })
  }
})
