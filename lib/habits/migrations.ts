import { StorageData, Habit, StreakData, OnboardingState, HabitTag } from './types'
import { calculateStreak, inferTimeOfDay } from './habit-utils'

/**
 * Migrate storage data from older versions to current schema
 */
export function migrateStorageData(data: any): StorageData {
  const currentVersion = data.schemaVersion || 1

  let migratedData = { ...data }

  // Migrate from v1 to v2
  if (currentVersion < 2) {
    migratedData = migrateV1ToV2(migratedData)
  }

  // Migrate from v2 to v3
  if (migratedData.schemaVersion < 3) {
    migratedData = migrateV2ToV3(migratedData)
  }

  // Migrate from v3 to v4
  if (migratedData.schemaVersion < 4) {
    migratedData = migrateV3ToV4(migratedData)
  }

  // Migrate from v4 to v5
  if (migratedData.schemaVersion < 5) {
    migratedData = migrateV4ToV5(migratedData)
  }

  // Migrate from v5 to v6
  if (migratedData.schemaVersion < 6) {
    migratedData = migrateV5ToV6(migratedData)
  }

  // Migrate from v6 to v7
  if (migratedData.schemaVersion < 7) {
    migratedData = migrateV6ToV7(migratedData)
  }

  if (!Array.isArray(migratedData.projects)) {
    migratedData.projects = []
  }
  if (!Array.isArray(migratedData.calendarEvents)) {
    migratedData.calendarEvents = []
  }
  if (!migratedData.calendarEventTombstones || typeof migratedData.calendarEventTombstones !== 'object' || Array.isArray(migratedData.calendarEventTombstones)) {
    migratedData.calendarEventTombstones = {}
  }

  return migratedData
}

/**
 * Migrate from schema version 6 to version 7.
 * Adds first-class calendar event storage and tombstones so API-created
 * events survive later smart client saves.
 */
function migrateV6ToV7(data: StorageData): StorageData {
  console.log('[Migration] Migrating data from v6 to v7...')

  const maybeCalendar = data as StorageData & {
    calendarEvents?: unknown
    calendarEventTombstones?: unknown
  }

  console.log('[Migration] Migration to v7 complete!')

  return {
    ...data,
    calendarEvents: Array.isArray(maybeCalendar.calendarEvents) ? maybeCalendar.calendarEvents as StorageData["calendarEvents"] : [],
    calendarEventTombstones:
      maybeCalendar.calendarEventTombstones &&
      typeof maybeCalendar.calendarEventTombstones === 'object' &&
      !Array.isArray(maybeCalendar.calendarEventTombstones)
        ? maybeCalendar.calendarEventTombstones as NonNullable<StorageData["calendarEventTombstones"]>
        : {},
    schemaVersion: 7,
  }
}

/**
 * Migrate from schema version 5 to version 6.
 * Adds todo projects and drops retired chat/Pomodoro settings from the data
 * blob while preserving integrationToken metadata used by API automation.
 */
function migrateV5ToV6(data: StorageData): StorageData {
  console.log('[Migration] Migrating data from v5 to v6...')

  const legacyData = data as StorageData & {
    pomodoro?: unknown
    activePomodoro?: unknown
    pomodoroSessions?: unknown
    settings?: unknown
  }

  const {
    pomodoro: _pomodoro,
    activePomodoro: _activePomodoro,
    pomodoroSessions: _pomodoroSessions,
    settings: _settings,
    ...rest
  } = legacyData

  console.log('[Migration] Migration to v6 complete!')

  return {
    ...rest,
    todos: data.todos || [],
    projects: Array.isArray((data as StorageData & { projects?: unknown }).projects)
      ? (data as StorageData & { projects: StorageData["projects"] }).projects
      : [],
    schemaVersion: 6,
  }
}

/**
 * Migrate from schema version 4 to version 5
 * Adds archiveHistory array to habits so success rate accounts for
 * repeated archive/unarchive cycles.
 */
function migrateV4ToV5(data: StorageData): StorageData {
  console.log('[Migration] Migrating data from v4 to v5...')

  const habits = (data.habits || []).map(habit => {
    if (habit.archiveHistory) return habit

    let archiveHistory: Array<{ archivedAt: string; unarchivedAt?: string }> = []
    if (habit.archived && habit.archivedAt) {
      archiveHistory = [{ archivedAt: habit.archivedAt }]
    } else if (!habit.archived && habit.archivedAt) {
      // Previously archived then unarchived — we don't know the original range,
      // so record a degenerate (zero-length) entry to preserve the timestamp.
      archiveHistory = [{ archivedAt: habit.archivedAt, unarchivedAt: habit.archivedAt }]
    }

    return { ...habit, archiveHistory }
  })

  console.log('[Migration] Migration to v5 complete!')

  return {
    ...data,
    habits,
    schemaVersion: 5,
  }
}

/**
 * Migrate from schema version 3 to version 4
 * Adds createdAt and archivedAt to habits
 */
function migrateV3ToV4(data: StorageData): StorageData {
  console.log('[Migration] Migrating data from v3 to v4...')

  const habits = (data.habits || []).map(habit => {
    // Try to find first completion date for createdAt
    const habitCompletions = (data.completions || []).filter(c => c.habitId === habit.id)
    let createdAt = habit.createdAt

    if (!createdAt) {
      if (habitCompletions.length > 0) {
        const sortedCompletions = [...habitCompletions].sort((a, b) => a.date.localeCompare(b.date))
        createdAt = new Date(sortedCompletions[0].date).toISOString()
      } else {
        // Fallback to lastUpdated or now
        createdAt = data.lastUpdated || new Date().toISOString()
      }
    }

    return {
      ...habit,
      createdAt,
      archivedAt: habit.archived && !habit.archivedAt ? data.lastUpdated || new Date().toISOString() : habit.archivedAt
    }
  })

  console.log('[Migration] Migration to v4 complete!')

  return {
    ...data,
    habits,
    schemaVersion: 4,
  }
}

/**
 * Migrate from schema version 1 to version 2
 * Adds neuroscience-backed features and fields
 */
function migrateV1ToV2(data: any): StorageData {
  console.log('[Migration] Migrating data from v1 to v2...')

  const habits: Habit[] = data.habits || []
  const completions = data.completions || []

  // Migrate each habit with new fields
  const migratedHabits = habits.map(habit => {
    // Calculate initial streak from existing completions
    const streakData = calculateStreak(habit.id, completions)

    // Infer time of day from habit time
    const timeOfDay = inferTimeOfDay(habit.time)

    return {
      ...habit,
      // Set defaults for new fields
      priority: habit.priority || 3, // Medium priority by default
      category: habit.category || inferCategory(habit.name),
      timeOfDay: habit.timeOfDay || timeOfDay,
      archived: habit.archived || false,
      streakData: habit.streakData || streakData,
      // Optional fields remain undefined unless already set
      implementationIntention: habit.implementationIntention,
      identity: habit.identity,
      tinyHabit: habit.tinyHabit,
      temptationBundle: habit.temptationBundle,
      environmentSetup: habit.environmentSetup
    }
  })

  // Determine if user should skip onboarding (existing users)
  const hasExistingHabits = habits.length > 0
  const onboarding: OnboardingState = data.onboarding || {
    completed: hasExistingHabits, // Skip onboarding for existing users
    currentStep: hasExistingHabits ? 5 : 1,
    skipped: false
  }

  // Create migrated data structure
  const migratedData: StorageData = {
    ...data,
    habits: migratedHabits,
    schemaVersion: 2,
    onboarding,
    profile: data.profile || {
      checkInTimes: {
        morning: '08:00',
        midday: '12:00',
        evening: '20:00'
      }
    },
    habitStacks: data.habitStacks || [],
    thoughtRecords: data.thoughtRecords || [],
    aiInsights: data.aiInsights || [],
    focusMode: data.focusMode || {
      enabled: false,
      hidePastDates: false,
      showOnlyPending: false,
      singleColumn: false
    },
    accessibility: data.accessibility || {
      reduceMotion: false,
      highContrast: false,
      simpleLanguage: false,
      extraReminders: false,
      stepByStepMode: false,
      compassionateMode: false,
      adhdSupport: false
    },
    rewardConfig: data.rewardConfig || {
      celebrationsEnabled: true,
      soundEnabled: false,
      confettiEnabled: true,
      sharePrompts: true,
      variableRewards: true
    },
    projects: Array.isArray(data.projects) ? data.projects : [],
    calendarEvents: Array.isArray(data.calendarEvents) ? data.calendarEvents : [],
    calendarEventTombstones:
      data.calendarEventTombstones &&
      typeof data.calendarEventTombstones === 'object' &&
      !Array.isArray(data.calendarEventTombstones)
        ? data.calendarEventTombstones
        : {},
    accountabilityPartners: data.accountabilityPartners || [],
    commitmentContracts: data.commitmentContracts || []
  }

  console.log('[Migration] Migration to v2 complete!')
  console.log(`[Migration] Migrated ${migratedHabits.length} habits`)
  console.log(`[Migration] Onboarding status: ${onboarding.completed ? 'completed' : 'pending'}`)

  return migratedData
}

/**
 * Migrate from schema version 2 to version 3
 * Adds tags field seeded from existing category
 */
function migrateV2ToV3(data: StorageData): StorageData {
  console.log('[Migration] Migrating data from v2 to v3...')

  const habits = (data.habits || []).map(habit => {
    const tags: HabitTag[] = habit.tags || []

    // Seed tags from existing category if no tags set
    if (tags.length === 0 && habit.category) {
      const validTags: HabitTag[] = [
        "exercise", "reading", "meditation", "health", "productivity",
        "social", "creative", "personal", "nutrition", "sleep",
        "mindfulness", "learning", "finance", "selfcare"
      ]
      if (validTags.includes(habit.category as HabitTag)) {
        tags.push(habit.category as HabitTag)
      }
    }

    return {
      ...habit,
      tags,
    }
  })

  console.log('[Migration] Migration to v3 complete!')
  console.log(`[Migration] Tagged ${habits.filter(h => h.tags && h.tags.length > 0).length} habits`)

  return {
    ...data,
    habits,
    projects: Array.isArray((data as StorageData & { projects?: unknown }).projects)
      ? (data as StorageData & { projects: StorageData["projects"] }).projects
      : [],
    schemaVersion: 3,
  }
}

/**
 * Infer habit category from habit name using common keywords
 */
function inferCategory(habitName: string): string {
  const name = habitName.toLowerCase()

  // Exercise related
  if (name.match(/exercise|workout|run|gym|walk|yoga|fitness|stretch|sports?/)) {
    return 'exercise'
  }

  // Reading related
  if (name.match(/read|book|article|study|learn/)) {
    return 'reading'
  }

  // Meditation/mindfulness related
  if (name.match(/meditat|mindful|breathe|calm|journal|gratitude/)) {
    return 'meditation'
  }

  // Health related
  if (name.match(/water|sleep|vitamin|medicine|health|diet|nutrition/)) {
    return 'health'
  }

  // Productivity related
  if (name.match(/work|write|code|plan|organize|clean/)) {
    return 'productivity'
  }

  // Social/relationships
  if (name.match(/call|text|friend|family|social|connect/)) {
    return 'social'
  }

  // Creative
  if (name.match(/draw|paint|music|create|art|craft/)) {
    return 'creative'
  }

  // Default to personal
  return 'personal'
}

/**
 * Validate migrated data structure
 */
export function validateStorageData(data: StorageData): boolean {
  try {
    // Check required fields
    if (!Array.isArray(data.habits)) return false
    if (!Array.isArray(data.completions)) return false
    if (!Array.isArray(data.todos)) return false
    if (!Array.isArray(data.projects)) return false
    if (typeof data.lastUpdated !== 'string') return false
    if (!data.schemaVersion || data.schemaVersion < 2) return false
    // Accept v2 through v7
    if (data.schemaVersion > 7) return false
    if (!Array.isArray(data.calendarEvents)) return false

    // Check each habit has required fields
    for (const habit of data.habits) {
      if (!habit.id || !habit.name || !habit.time || !habit.color) return false
      if (!habit.schedule || !habit.schedule.type) return false
    }

    return true
  } catch (error) {
    console.error('[Migration] Validation error:', error)
    return false
  }
}

/**
 * Create a backup of data before migration
 */
export function createBackup(data: StorageData): string {
  return JSON.stringify(data)
}

/**
 * Restore data from backup
 */
export function restoreFromBackup(backup: string): StorageData {
  return JSON.parse(backup)
}
