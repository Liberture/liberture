import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import type { StorageData } from "@/lib/habits/types"
import { syncOptimizedStorageTables } from "@/lib/habits/optimized-storage"
import { getAuthFromRequest } from "@/lib/habits/app-auth"

// POST - Import storage.json data into the signed-in user's account.
// Auth is the app's own (Nostr session cookie or a legacy ht_ key), never a raw
// api_key match: Nostr accounts' api_key used to be derivable from the public
// key, which made this route writable by anyone who knew an npub.
export async function POST(request: Request) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 })
    }

    const sql = getDb()

    const userCheck = auth.type === "api-key"
      ? await sql`SELECT id FROM habit_users WHERE api_key = ${auth.apiKey ?? ""}`
      : await sql`SELECT id FROM habit_users WHERE nostr_pubkey = ${(auth.pubkey ?? "").toLowerCase()}`

    if (userCheck.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 401 })
    }
    const userId = userCheck[0].id as number

    const importedData = await request.json()

    // Validate basic structure
    if (!importedData || typeof importedData !== "object") {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    const currentDataResult = await sql`
      SELECT data FROM habit_users WHERE id = ${userId}
    `
    const currentData = currentDataResult[0]?.data as
      | (StorageData & { integrationToken?: unknown })
      | undefined

    // Build the storage data from the imported file, accepting full
    // StorageData format and export format (with exportedAt).
    const importedSchemaVersion = typeof importedData.schemaVersion === "number" ? importedData.schemaVersion : 7
    const storageData: StorageData = {
      habits: Array.isArray(importedData.habits) ? importedData.habits : [],
      completions: Array.isArray(importedData.completions) ? importedData.completions : [],
      todos: Array.isArray(importedData.todos) ? importedData.todos : [],
      projects: Array.isArray(importedData.projects) ? importedData.projects : [],
      projectTombstones: importedData.projectTombstones && typeof importedData.projectTombstones === "object" && !Array.isArray(importedData.projectTombstones) ? importedData.projectTombstones : {},
      todoTombstones: importedData.todoTombstones && typeof importedData.todoTombstones === "object" && !Array.isArray(importedData.todoTombstones) ? importedData.todoTombstones : {},
      calendarEvents: Array.isArray(importedData.calendarEvents) ? importedData.calendarEvents : [],
      calendarEventTombstones: importedData.calendarEventTombstones && typeof importedData.calendarEventTombstones === "object" && !Array.isArray(importedData.calendarEventTombstones) ? importedData.calendarEventTombstones : {},
      lastUpdated: new Date().toISOString(),
      schemaVersion: Math.max(importedSchemaVersion, 7),
      onboarding: importedData.onboarding,
      profile: importedData.profile,
      habitStacks: Array.isArray(importedData.habitStacks) ? importedData.habitStacks : [],
      thoughtRecords: Array.isArray(importedData.thoughtRecords) ? importedData.thoughtRecords : [],
      aiInsights: Array.isArray(importedData.aiInsights) ? importedData.aiInsights : [],
      focusMode: importedData.focusMode,
      accessibility: importedData.accessibility,
      rewardConfig: importedData.rewardConfig,
      accountabilityPartners: Array.isArray(importedData.accountabilityPartners) ? importedData.accountabilityPartners : [],
      commitmentContracts: Array.isArray(importedData.commitmentContracts) ? importedData.commitmentContracts : [],
    }
    const dataToSave = currentData?.integrationToken
      ? { ...storageData, integrationToken: currentData.integrationToken }
      : storageData

    await sql`
      UPDATE habit_users
      SET data = ${JSON.stringify(dataToSave)}::jsonb, updated_at = NOW()
      WHERE id = ${userId}
    `

    await syncOptimizedStorageTables(sql, userId, storageData)

    return NextResponse.json({
      success: true,
      imported: {
        habits: storageData.habits.length,
        completions: storageData.completions.length,
        todos: storageData.todos.length,
        projects: storageData.projects.length,
        calendarEvents: storageData.calendarEvents.length,
      },
    })
  } catch (error) {
    console.error("Failed to import data:", error)
    return NextResponse.json({ error: "Failed to import data" }, { status: 500 })
  }
}
