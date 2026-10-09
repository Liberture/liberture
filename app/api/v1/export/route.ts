import { NextResponse } from "next/server"
import { markBackedUp } from "@/lib/habits/backup-record"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { migrateStorageData, validateStorageData } from "@/lib/habits/migrations"
import type { StorageData } from "@/lib/habits/types"

type PersistedStorageData = StorageData & {
  integrationToken?: unknown
  pomodoro?: unknown
  activePomodoro?: unknown
  pomodoroSessions?: unknown
  settings?: unknown
  exportedAt?: string
}

/**
 * GET /api/v1/export
 * Returns a full JSON backup for server-side automation: everything the app's
 * own export has, including tombstones, profile, preferences, onboarding and
 * the coach's last suggestions, so a restore loses nothing. Secrets (the
 * script token) and dead pomodoro/settings keys are stripped.
 * Auth: Authorization: Bearer hti_...
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "export")
  if (user instanceof NextResponse) return user

  try {
    const migratedData = migrateStorageData(user.data) as PersistedStorageData
    migratedData.projects = Array.isArray(migratedData.projects) ? migratedData.projects : []

    // Habits created without a reminder have time "", which the validator
    // (written when time was required) rejects; that is valid data, not corruption.
    const forValidation = { ...migratedData, habits: (migratedData.habits ?? []).map((h) => ({ ...h, time: h.time || "anytime" })) }
    if (!validateStorageData(forValidation)) {
      return NextResponse.json({ error: "Stored data failed validation" }, { status: 500 })
    }

    const exportData: PersistedStorageData = {
      ...migratedData,
      todoTombstones: migratedData.todoTombstones ?? {},
      habitTombstones: migratedData.habitTombstones ?? {},
      projectTombstones: migratedData.projectTombstones ?? {},
      calendarEventTombstones: migratedData.calendarEventTombstones ?? {},
      profile: migratedData.profile,
      preferences: migratedData.preferences,
      onboarding: migratedData.onboarding,
      coachRecommendations: migratedData.coachRecommendations,
      exportedAt: new Date().toISOString(),
    }

    delete exportData.integrationToken
    delete exportData.pomodoro
    delete exportData.activePomodoro
    delete exportData.pomodoroSessions
    delete exportData.settings

    // Record the backup. A jsonb_set rather than a full blob write, because the
    // export is a read path and must not race a concurrent save into clobbering
    // the user's habits with whatever we happened to load at the top of this
    // request. Deliberately after validation and not awaited into the response
    // body — a failure to note the backup must not fail the backup itself.
    void markBackedUp(user.userId, exportData.exportedAt!).catch((error) => {
      console.error("Exported, but failed to record lastBackupAt:", error)
    })

    const filenameDate = new Date().toISOString().slice(0, 10)

    return NextResponse.json(exportData, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="habit-tracker-export-${filenameDate}.json"`,
      },
    })
  } catch (error) {
    console.error("Failed to export data:", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}
