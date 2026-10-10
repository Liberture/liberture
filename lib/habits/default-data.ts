import type { StorageData } from "@/lib/habits/types"

/**
 * The blob a brand-new account starts with — also what "Reset account"
 * writes back. A function, not a constant, so `lastUpdated` is the moment it
 * is created rather than when the server process started.
 */
export function freshStorageData(now: string = new Date().toISOString()): StorageData {
  return {
    habits: [],
    completions: [],
    todos: [],
    projects: [],
    projectTombstones: {},
    todoTombstones: {},
    calendarEvents: [],
    calendarEventTombstones: {},
    lastUpdated: now,
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
}
