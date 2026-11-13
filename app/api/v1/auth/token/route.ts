import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { withTrackerOwner } from "@/lib/habits/api/with-tracker-owner"
import crypto from "crypto"

/**
 * POST /api/v1/auth/token
 * Create an integration token. Stores hash inside the JSONB data blob.
 * Token is returned only once — store it safely.
 */
export const POST = withTrackerOwner(async (userId) => {
  try {
    // Creating a token intentionally rotates/replaces any existing token.
    // The token is shown once, so Settings must be able to recover from a
    // lost or stale token without requiring a separate revoke round-trip.
    const token = `hti_${crypto.randomBytes(32).toString("hex")}`
    const hash = crypto.createHash("sha256").update(token).digest("hex")
    const prefix = token.slice(0, 12)

    const sql = getDb()
    
    await sql`UPDATE habit_users SET data = jsonb_set(COALESCE(data, '{}'::jsonb), '{integrationToken}', ${JSON.stringify({ hash, prefix })}::jsonb) WHERE id = ${userId}`

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Failed to create integration token:", error)
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 })
  }
})

/**
 * DELETE /api/v1/auth/token
 * Revoke the integration token.
 */
export const DELETE = withTrackerOwner(async (userId) => {
  try {
    const sql = getDb()
    
    await sql`UPDATE habit_users SET data = data - 'integrationToken' WHERE id = ${userId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to revoke integration token:", error)
    return NextResponse.json({ error: "Failed to revoke token" }, { status: 500 })
  }
})

/**
 * GET /api/v1/auth/token
 * Check token status (does not return the token itself).
 */
export const GET = withTrackerOwner(async (userId) => {
  const [row] = await getDb()`
    SELECT (data #>> '{integrationToken,hash}') IS NOT NULL AS has_token,
           data #>> '{integrationToken,prefix}' AS prefix
    FROM habit_users WHERE id = ${userId}
  `
  return NextResponse.json({
    hasToken: row?.has_token ?? false,
    prefix: row?.prefix ? `${row.prefix}...` : null,
  }, { headers: { "Cache-Control": "private, no-store" } })
})
