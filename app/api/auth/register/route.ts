import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { createLocalUser, isLocalStorageMode } from "@/lib/habits/local-storage"
import crypto from "crypto"
import type { StorageData } from "@/lib/habits/types"

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
      await createLocalUser(apiKey, defaultData)
      return NextResponse.json({ apiKey, devMode: true })
    }

    // Production mode: use Neon database
    const sql = getDb()
    await sql`
      INSERT INTO habit_users (api_key, data)
      VALUES (${apiKey}, ${JSON.stringify(defaultData)}::jsonb)
    `

    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error("Failed to register:", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
