import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { verifyApiKey } from "@/lib/habits/integration-auth"
import crypto from "crypto"

/**
 * POST /api/v1/auth/token
 * Create an integration token. Stores hash inside the JSONB data blob.
 * Token is returned only once — store it safely.
 */
export async function POST(request: Request) {
  const user = await verifyApiKey(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Creating a token intentionally rotates/replaces any existing token.
    // The token is shown once, so Settings must be able to recover from a
    // lost or stale token without requiring a separate revoke round-trip.
    const token = `hti_${crypto.randomBytes(32).toString("hex")}`
    const hash = crypto.createHash("sha256").update(token).digest("hex")
    const prefix = token.slice(0, 12)

    const sql = getDb()
    
    // Use appropriate WHERE clause based on auth type
    if (user.nostrPubkey) {
      await sql`
        UPDATE habit_users
        SET data = jsonb_set(data, '{integrationToken}', ${JSON.stringify({ hash, prefix })}::jsonb)
        WHERE nostr_pubkey = ${user.nostrPubkey}
      `
    } else {
      await sql`
        UPDATE habit_users
        SET data = jsonb_set(data, '{integrationToken}', ${JSON.stringify({ hash, prefix })}::jsonb)
        WHERE api_key = ${user.apiKey}
      `
    }

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Failed to create integration token:", error)
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/auth/token
 * Revoke the integration token.
 */
export async function DELETE(request: Request) {
  const user = await verifyApiKey(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const sql = getDb()
    
    // Use appropriate WHERE clause based on auth type
    if (user.nostrPubkey) {
      await sql`
        UPDATE habit_users
        SET data = data - 'integrationToken'
        WHERE nostr_pubkey = ${user.nostrPubkey}
      `
    } else {
      await sql`
        UPDATE habit_users
        SET data = data - 'integrationToken'
        WHERE api_key = ${user.apiKey}
      `
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to revoke integration token:", error)
    return NextResponse.json({ error: "Failed to revoke token" }, { status: 500 })
  }
}

/**
 * GET /api/v1/auth/token
 * Check token status (does not return the token itself).
 */
export async function GET(request: Request) {
  const user = await verifyApiKey(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = (user.data as unknown as Record<string, unknown>).integrationToken as
    | { hash: string; prefix: string }
    | undefined

  return NextResponse.json({
    hasToken: !!token?.hash,
    prefix: token?.prefix ? `${token.prefix}...` : null,
  })
}
