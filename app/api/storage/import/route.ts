import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import type { StorageData } from "@/lib/habits/types"
import { syncOptimizedStorageTables } from "@/lib/habits/optimized-storage"

function getApiKeyFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7)
  }
  return null
}

// POST - Import storage.json data into user's account
export async function POST(request: Request) {
  try {
    const apiKey = getApiKeyFromRequest(request)

    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 })
    }

    const sql = getDb()

    // Verify user exists
    const userCheck = await sql`
      SELECT id FROM habit_users WHERE api_key = ${apiKey}
    `

    if (userCheck.length === 0) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const importedData = await request.json()

    // Validate basic structure
    if (!importedData || typeof importedData !== "object") {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    const currentDataResult = await sql`
      SELECT data FROM habit_users WHERE api_key = ${apiKey}
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
      WHERE api_key = ${apiKey}
    `

    await syncOptimizedStorageTables(sql, userCheck[0].id as number, storageData)

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
