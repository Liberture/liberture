import { NextResponse } from "next/server"
import { runAllMigrations, addIntegrationTokenColumns, addNostrPubkeyColumn } from "@/lib/habits/db-migrate"

export async function POST(request: Request) {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) {
    return NextResponse.json({ error: "ADMIN_SECRET not configured" }, { status: 500 })
  }

  const auth = request.headers.get("Authorization")
  if (auth !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Run all migrations
    await runAllMigrations()
    
    return NextResponse.json({ 
      success: true, 
      message: "All migrations complete",
      migrations: [
        "integration_token_columns",
        "nostr_pubkey_column",
        "optimized_storage_tables"
      ]
    })
  } catch (error) {
    console.error("Migration failed:", error)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}
