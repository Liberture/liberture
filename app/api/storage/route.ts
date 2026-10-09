import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import type { StorageData } from "@/lib/habits/types"
import { migrateStorageData, validateStorageData, createBackup } from "@/lib/habits/migrations"
import { getLocalUser, updateLocalUser, isLocalStorageMode } from "@/lib/habits/local-storage"
import { mergeProjects } from "@/lib/habits/project-sync"
import { mergeTodos } from "@/lib/habits/todo-sync"
import { mergeHabits, mergeHabitTombstones, mergeStamped } from "@/lib/habits/habit-sync"
import { mergeCalendarEvents } from "@/lib/habits/calendar-utils"
import { syncOptimizedStorageTables } from "@/lib/habits/optimized-storage"
import { getAuthFromRequest, type AuthInfo } from "@/lib/habits/app-auth"
import { laterBackupAt } from "@/lib/habits/backup-status"
import { mergeCoachRecommendations } from "@/lib/habits/coach/suggestions"

const defaultData: StorageData = {
  habits: [],
  completions: [],
  todos: [],
  projects: [],
  projectTombstones: {},
  todoTombstones: {},
  calendarEvents: [],
  calendarEventTombstones: {},
  lastUpdated: new Date().toISOString(),
  schemaVersion: 7,
  onboarding: {
    completed: false,
    currentStep: 1,
    skipped: false
  },
  profile: {
    checkInTimes: {
      morning: '08:00',
      midday: '12:00',
      evening: '20:00'
    }
  },
  habitStacks: [],
  thoughtRecords: [],
  aiInsights: [],
  focusMode: {
    enabled: false,
    hidePastDates: false,
    showOnlyPending: false,
    singleColumn: false
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    simpleLanguage: false,
    extraReminders: false,
    stepByStepMode: false,
    compassionateMode: false,
    adhdSupport: false
  },
  rewardConfig: {
    celebrationsEnabled: true,
    soundEnabled: false,
    confettiEnabled: true,
    sharePrompts: true,
    variableRewards: true
  },
  accountabilityPartners: [],
  commitmentContracts: []
}

function redactSecretMetadata(data: StorageData): StorageData {
  const redacted = { ...data } as StorageData & { integrationToken?: unknown }
  delete redacted.integrationToken
  return redacted
}

/**
 * Get user data from database using either API key or Nostr pubkey
 */
async function getUserData(auth: AuthInfo, sql: ReturnType<typeof getDb>): Promise<StorageData | null> {
  let result
  
  if (auth.type === 'nostr' && auth.pubkey) {
    result = await sql`
      SELECT data FROM habit_users WHERE nostr_pubkey = ${auth.pubkey.toLowerCase()}
    `
  } else if (auth.type === 'api-key' && auth.apiKey) {
    result = await sql`
      SELECT data FROM habit_users
      WHERE api_key = ${auth.apiKey}
    `
  } else {
    return null
  }

  if (result.length === 0) {
    return null
  }

  return result[0].data || defaultData
}

/**
 * Update user data in database using either API key or Nostr pubkey
 */
async function updateUserData(auth: AuthInfo, data: StorageData, sql: ReturnType<typeof getDb>): Promise<number | null> {
  let result
  
  if (auth.type === 'nostr' && auth.pubkey) {
    result = await sql`
      UPDATE habit_users
      SET data = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
      WHERE nostr_pubkey = ${auth.pubkey.toLowerCase()}
      RETURNING id
    `
  } else if (auth.type === 'api-key' && auth.apiKey) {
    result = await sql`
      UPDATE habit_users
      SET data = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
      WHERE api_key = ${auth.apiKey}
      RETURNING id
    `
  } else {
    return null
  }

  return result[0]?.id as number | undefined ?? null
}

// GET - Read storage data
export async function GET(request: Request) {
  try {
    const auth = await getAuthFromRequest(request)

    if (!auth) {
      return NextResponse.json({ error: "Valid API key or Nostr session required." }, { status: 401 })
    }

    // Local storage mode (only for API key auth)
    if (isLocalStorageMode()) {
      if (auth.type === 'nostr') {
        return NextResponse.json({ error: "Nostr auth requires database mode" }, { status: 400 })
      }
      
      const data = await getLocalUser(auth.apiKey!)

      if (!data) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
      }

      // Apply migrations if needed
      const currentVersion = data.schemaVersion || 1
      const targetVersion = 7

      if (currentVersion < targetVersion) {
        console.log(`[Storage][DEV] Migrating data from v${currentVersion} to v${targetVersion}`)
        const migratedData = migrateStorageData(data)

        if (validateStorageData(migratedData)) {
          await updateLocalUser(auth.apiKey!, migratedData)
          return NextResponse.json(redactSecretMetadata(migratedData))
        }
      }

      return NextResponse.json(redactSecretMetadata(data as StorageData))
    }

    // Production mode: use Neon database
    const sql = getDb()
    let data = await getUserData(auth, sql)

    if (!data) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if migration is needed
    const currentVersion = data.schemaVersion || 1
    const targetVersion = 7

    if (currentVersion < targetVersion) {
      console.log(`[Storage] Migrating data from v${currentVersion} to v${targetVersion}`)

      // Create backup before migration
      const backup = createBackup(data)

      try {
        // Apply migrations
        const migratedData = migrateStorageData(data)

        // Validate migrated data
        if (!validateStorageData(migratedData)) {
          console.error('[Storage] Migration validation failed, using backup')
          data = JSON.parse(backup)
        } else {
          // Save migrated data back to database
          const userId = await updateUserData(auth, migratedData, sql)
          if (userId) await syncOptimizedStorageTables(sql, userId, migratedData)
          data = migratedData
          console.log('[Storage] Migration successful and saved')
        }
      } catch (migrationError) {
        console.error('[Storage] Migration failed:', migrationError)
        console.log('[Storage] Using backup data')
        data = JSON.parse(backup)
      }
    }

    return NextResponse.json(redactSecretMetadata(data as StorageData))
  } catch (error) {
    console.error("Failed to read storage:", error)
    return NextResponse.json({ error: "Failed to read data" }, { status: 500 })
  }
}

/**
 * Merge completions arrays.
 *
 * Habit completions do not have tombstones, so treating a stale/offline client
 * as the source of truth for missing entries is destructive: an installed PWA or
 * background tab can POST an old completions array and erase rows that were
 * restored or added by the API. Until completions get explicit deletion
 * tombstones, smart merge must be conservative and preserve the union of client
 * and server records.
 */
function completionTimestamp(completion: StorageData['completions'][0]): string {
  return completion.completedAt ?? completion.date ?? ""
}

function mergeCompletionRecord(
  clientCompletion: StorageData['completions'][0],
  serverCompletion: StorageData['completions'][0],
): StorageData['completions'][0] {
  const clientTime = completionTimestamp(clientCompletion)
  const serverTime = completionTimestamp(serverCompletion)
  const newer = serverTime > clientTime ? serverCompletion : clientCompletion
  const older = newer === serverCompletion ? clientCompletion : serverCompletion

  return {
    ...older,
    ...newer,
    // Preserve data-entry fields from both sides. If both wrote the same field,
    // prefer the newer record chosen above.
    data: {
      ...(older.data ?? {}),
      ...(newer.data ?? {}),
    },
    // Newer explicit toggles win; stale partial records lose by timestamp.
    completed: Boolean(newer.completed),
    completedAt: newer.completedAt ?? older.completedAt,
  }
}

function mergeCompletions(
  clientCompletions: StorageData['completions'],
  serverCompletions: StorageData['completions'],
  _lastUpdated: string
): StorageData['completions'] {
  const merged = new Map<string, StorageData['completions'][0]>()

  for (const c of serverCompletions ?? []) {
    const key = `${c.habitId}:${c.date}`
    merged.set(key, c)
  }

  for (const c of clientCompletions ?? []) {
    const key = `${c.habitId}:${c.date}`
    const existing = merged.get(key)
    merged.set(key, existing ? mergeCompletionRecord(c, existing) : c)
  }

  return Array.from(merged.values())
}

/**
 * An empty habits + todos snapshot with completion history is not a coherent
 * user edit. It can be produced by a stale tab or a bad local draft, and used
 * to erase the two collections while leaving statistics looking intact.
 */
function isSuspiciousEmptySnapshot(data: StorageData, currentData: StorageData | null): boolean {
  if (!currentData) return false
  return data.habits.length === 0
    && data.todos.length === 0
    && data.completions.length > 0
    && currentData.habits.length > 0
    && currentData.todos.length > 0
}

function rejectedEmptySnapshot(currentData: StorageData): NextResponse {
  return NextResponse.json({
    error: "Refused to replace populated habits and todos with an inconsistent empty snapshot.",
    code: "suspicious_empty_snapshot",
    data: redactSecretMetadata(currentData),
  }, { status: 409 })
}

/**
 * Assistant permission scopes are owned by /api/v1/auth/permissions, not by
 * the client blob. Whatever the client sent, keep the server's copy.
 */
function carryIntegrationPermissions(data: StorageData, currentData: StorageData | null) {
  const target = data as StorageData & { integrationPermissions?: unknown }
  const current = (currentData as (StorageData & { integrationPermissions?: unknown }) | null)?.integrationPermissions
  if (current) {
    target.integrationPermissions = current
  } else {
    delete target.integrationPermissions
  }
}

/**
 * update_profile (MCP) writes profile and preferences server-side with
 * updatedAt; keep the newer copy so a tab that loaded earlier can't revert it.
 */
function mergeProfileAndPreferences(data: StorageData, currentData: StorageData, clientLastUpdated: string | undefined) {
  const profile = mergeStamped(data.profile, currentData.profile, clientLastUpdated)
  if (profile) data.profile = profile
  const preferences = mergeStamped(data.preferences, currentData.preferences, clientLastUpdated)
  if (preferences) data.preferences = preferences
}

// POST - Write storage data
export async function POST(request: Request) {
  try {
    const auth = await getAuthFromRequest(request)

    if (!auth) {
      return NextResponse.json({ error: "Valid API key or Nostr session required." }, { status: 401 })
    }

    const data: StorageData = await request.json()
    data.projects = Array.isArray(data.projects) ? data.projects : []
    data.calendarEvents = Array.isArray(data.calendarEvents) ? data.calendarEvents : []
    if (!data.projectTombstones || typeof data.projectTombstones !== 'object' || Array.isArray(data.projectTombstones)) {
      data.projectTombstones = {}
    }
    if (!data.calendarEventTombstones || typeof data.calendarEventTombstones !== 'object' || Array.isArray(data.calendarEventTombstones)) {
      data.calendarEventTombstones = {}
    }
    delete (data as StorageData & { pomodoro?: unknown }).pomodoro
    delete (data as StorageData & { activePomodoro?: unknown }).activePomodoro
    delete (data as StorageData & { pomodoroSessions?: unknown }).pomodoroSessions
    delete (data as StorageData & { settings?: unknown }).settings
    
    // Check for merge mode via header: X-Merge-Strategy: smart
    // If set, we merge completions/todos/calendar events instead of overwriting
    const mergeStrategy = request.headers.get('X-Merge-Strategy')
    
    const now = new Date().toISOString()
    const clientLastUpdated = data.lastUpdated // Preserve what the client thought was the last sync
    data.lastUpdated = now
    data.schemaVersion = Math.max(data.schemaVersion ?? 7, 7)

    // Local storage mode (only for API key auth)
    if (isLocalStorageMode()) {
      if (auth.type === 'nostr') {
        return NextResponse.json({ error: "Nostr auth requires database mode" }, { status: 400 })
      }

      if (mergeStrategy === 'smart') {
        const currentData = await getLocalUser(auth.apiKey!)

        if (!currentData) {
          return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
        }

        if (isSuspiciousEmptySnapshot(data, currentData)) {
          return rejectedEmptySnapshot(currentData)
        }

        const currentIntegrationToken = (currentData as StorageData & { integrationToken?: unknown }).integrationToken
        if (currentIntegrationToken) {
          ;(data as StorageData & { integrationToken?: unknown }).integrationToken = currentIntegrationToken
        }
        carryIntegrationPermissions(data, currentData)

        // Same reasoning as the token above: /api/v1/export writes this
        // server-side, and a client that loaded beforehand would save it back
        // to undefined.
        data.lastBackupAt = laterBackupAt(data.lastBackupAt, currentData.lastBackupAt)

        data.habitTombstones = mergeHabitTombstones(data.habitTombstones, currentData.habitTombstones)
        data.habits = mergeHabits(data.habits, currentData.habits, clientLastUpdated, data.habitTombstones)
        data.completions = mergeCompletions(data.completions, currentData.completions, clientLastUpdated)
        const mergedProjects = mergeProjects({
          clientProjects: data.projects,
          serverProjects: currentData.projects,
          clientTombstones: data.projectTombstones,
          serverTombstones: currentData.projectTombstones,
        })
        data.projects = mergedProjects.projects
        data.projectTombstones = mergedProjects.projectTombstones
        const mergedTodos = mergeTodos({
          clientTodos: data.todos,
          serverTodos: currentData.todos,
          clientLastUpdated,
          clientTombstones: data.todoTombstones,
          serverTombstones: currentData.todoTombstones,
        })
        data.todos = mergedTodos.todos
        data.todoTombstones = mergedTodos.todoTombstones
        const mergedCalendar = mergeCalendarEvents({
          clientEvents: data.calendarEvents,
          serverEvents: currentData.calendarEvents,
          clientLastUpdated,
          clientTombstones: data.calendarEventTombstones,
          serverTombstones: currentData.calendarEventTombstones,
        })
        data.calendarEvents = mergedCalendar.calendarEvents
        data.calendarEventTombstones = mergedCalendar.calendarEventTombstones
        mergeProfileAndPreferences(data, currentData, clientLastUpdated)
      }
      
      const success = await updateLocalUser(auth.apiKey!, data)

      if (!success) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
      }

      return NextResponse.json({ 
        success: true, 
        lastUpdated: data.lastUpdated, 
        data: redactSecretMetadata(data),
        devMode: true 
      })
    }

    // Production mode: use Neon database
    const sql = getDb()
    
    const currentData = await getUserData(auth, sql)
    if (isSuspiciousEmptySnapshot(data, currentData)) {
      return rejectedEmptySnapshot(currentData!)
    }
    const currentIntegrationToken = (currentData as (StorageData & { integrationToken?: unknown }) | null)?.integrationToken
    if (currentIntegrationToken) {
      const dataWithToken = data as StorageData & { integrationToken?: unknown }
      dataWithToken.integrationToken = currentIntegrationToken
    }
    carryIntegrationPermissions(data, currentData)

    // Never let a save move the backup date backwards. /api/v1/export records
    // it server-side, so a client that loaded before that export is holding a
    // stale (usually absent) value. Outside the merge branch on purpose: this
    // has to hold for a plain overwrite too.
    data.lastBackupAt = laterBackupAt(data.lastBackupAt, currentData?.lastBackupAt)
    // respond_to_suggestion (MCP) writes suggestion statuses server-side; a tab
    // that loaded before must not undo them.
    data.coachRecommendations = mergeCoachRecommendations(data.coachRecommendations, currentData?.coachRecommendations)

    // If merge strategy is enabled, merge arrays
    if (mergeStrategy === 'smart') {
      if (currentData) {
        // Merge completions and todos arrays using the client's last known sync time
        data.habitTombstones = mergeHabitTombstones(data.habitTombstones, currentData.habitTombstones)
        data.habits = mergeHabits(data.habits, currentData.habits, clientLastUpdated, data.habitTombstones)
        data.completions = mergeCompletions(data.completions, currentData.completions, clientLastUpdated)
        const mergedProjects = mergeProjects({
          clientProjects: data.projects,
          serverProjects: currentData.projects,
          clientTombstones: data.projectTombstones,
          serverTombstones: currentData.projectTombstones,
        })
        data.projects = mergedProjects.projects
        data.projectTombstones = mergedProjects.projectTombstones
        const mergedTodos = mergeTodos({
          clientTodos: data.todos,
          serverTodos: currentData.todos,
          clientLastUpdated,
          clientTombstones: data.todoTombstones,
          serverTombstones: currentData.todoTombstones,
        })
        data.todos = mergedTodos.todos
        data.todoTombstones = mergedTodos.todoTombstones
        const mergedCalendar = mergeCalendarEvents({
          clientEvents: data.calendarEvents,
          serverEvents: currentData.calendarEvents,
          clientLastUpdated,
          clientTombstones: data.calendarEventTombstones,
          serverTombstones: currentData.calendarEventTombstones,
        })
        data.calendarEvents = mergedCalendar.calendarEvents
        data.calendarEventTombstones = mergedCalendar.calendarEventTombstones
        mergeProfileAndPreferences(data, currentData, clientLastUpdated)
      }
    }
    
    const userId = await updateUserData(auth, data, sql)

    if (!userId) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    await syncOptimizedStorageTables(sql, userId, data)

    return NextResponse.json({ 
      success: true, 
      lastUpdated: data.lastUpdated,
      data: redactSecretMetadata(data) // Return full merged data without token metadata
    })
  } catch (error) {
    console.error("Failed to write storage:", error)
    return NextResponse.json({ success: false, error: "Failed to save data" }, { status: 500 })
  }
}
