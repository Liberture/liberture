import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { createLocalUser, isLocalStorageMode } from "@/lib/habits/local-storage"
import crypto from "crypto"
import type { StorageData } from "@/lib/habits/types"
import { freshStorageData } from "@/lib/habits/default-data"


export async function POST() {
  try {
    if (process.env.DISABLE_REGISTRATION === "true") {
      return NextResponse.json(
        { error: "Registration is disabled on this private instance" },
        { status: 403 }
      )
    }

    const apiKey = `ht_${crypto.randomBytes(24).toString("hex")}`

    // Use local storage if DATABASE_URL is not set (development mode)
    if (isLocalStorageMode()) {
      console.log('[DEV MODE] Using local file storage')
      await createLocalUser(apiKey, freshStorageData())
      return NextResponse.json({ apiKey, devMode: true })
    }

    // Production mode: use Neon database
    const sql = getDb()
    await sql`
      INSERT INTO habit_users (api_key, data)
      VALUES (${apiKey}, ${JSON.stringify(freshStorageData())}::jsonb)
    `

    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error("Failed to register:", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
