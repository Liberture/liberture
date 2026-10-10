export interface DataEntryField {
  id: string
  type: "number" | "text"
  label: string
  unit?: string // For number type
  placeholder?: string
  goalValue?: number // Daily target (e.g., 25 pull-ups, 120 push-ups)
}

/** One passage a reading habit can present. */
export interface ReadingPassage {
  /** Stable within the habit. Catalog content reuses the quote id. */
  id: string
  title?: string
  /** The passage itself. Blank lines separate paragraphs. */
  body: string
  attribution?: string // "Marcus Aurelius"
  source?: string // "Meditations, 5.1"
  url?: string
  /** How to actually use it today, when the passage benefits from a nudge. */
  application?: string
}

/**
 * Turns a habit into one you complete by *reading* rather than doing.
 *
 * Optional and additive, exactly like `dataEntry`: a tracker instance that does
 * not know this field sees an ordinary habit and toggles it, and the completion
 * written is an ordinary completion. That is what keeps the storage blob at
 * schemaVersion 7 — see lib/protocols/adopt.ts for the same reasoning.
 */
export interface ReadingContent {
  enabled: boolean
  /**
   * daily    — one passage per calendar day, deterministic from the date
   * sequence — walk the list in order, advancing per completed day
   */
  mode: "daily" | "sequence"
  passages: ReadingPassage[]
  /** Shown above the reflection box. */
  prompt?: string
  /** When true the modal offers a reflection saved to `HabitCompletion.context`. */
  captureReflection?: boolean
  /** Rough read time in minutes, shown on the card. */
  minutes?: number
}

// Neuroscience-backed feature interfaces
export interface ImplementationIntention {
  trigger: string // "After I [trigger]"
  behavior: string // "I will [behavior]"
  obstacles?: Array<{
    obstacle: string // "If [obstacle]"
    strategy: string // "Then I will [strategy]"
  }>
}

export interface IdentityConfig {
  identityType: string // "runner", "reader", "meditator", etc.
  milestones: Array<{
    days: number
    message: string
    achieved: boolean
  }>
}

export interface StreakData {
  current: number // Current consecutive days (weeks for times-per-week habits)
  longest: number // All-time longest streak
  /** What current/longest count. Missing on older stored data, which counted days. */
  unit?: "days" | "weeks"
  freezesAvailable: number // Streak freezes earned
  freezesUsed: number // Total freezes used
  lastCompletedDate?: string // YYYY-MM-DD
  milestones: Array<{
    days: number
    achievedDate?: string
    celebrated: boolean
  }>
}

export interface TinyHabitConfig {
  tinyVersion: string // "1 pushup"
  mediumVersion?: string // "10 pushups"
  fullVersion: string // "30-minute workout"
  currentLevel: "tiny" | "medium" | "full"
  readyToLevelUp?: boolean
}

export interface HabitStack {
  id: string
  name: string // "Morning Routine"
  habitIds: string[] // Ordered list
  description?: string
}

export interface ThoughtRecord {
  id: string
  habitId: string
  date: string // YYYY-MM-DD
  situation: string
  thought: string
  emotion: string
  reframe: string // Generated or user-written
  aiGenerated: boolean
}

export interface AIInsight {
  id: string
  type: "pattern" | "recommendation" | "prediction" | "correlation"
  title: string
  description: string
  confidence: number // 0-1
  actionable: boolean
  action?: {
    type: string
    habitId?: string
    params?: Record<string, any>
  }
  createdAt: string // ISO timestamp
  dismissed: boolean
}

export interface TemptationBundle {
  reward: string // "Listen to podcast"
  onlyDuring: boolean // Can only do reward during habit
}

export interface EnvironmentSetup {
  cues: string[] // Visual reminders
  frictionReduction: string[] // Remove obstacles
  checklist: Array<{
    item: string
    completed: boolean
  }>
}

export type HabitTag = "exercise" | "reading" | "meditation" | "health" | "productivity" | "social" | "creative" | "personal" | "nutrition" | "sleep" | "mindfulness" | "learning" | "finance" | "selfcare"

export interface Habit {
  id: string
  name: string
  /**
   * Free text: why it matters, or what counts as done. Optional and additive,
   * so no schema bump (v7 ceiling): older instances round-trip it untouched.
   */
  description?: string
  /** Set by server-side edits (assistant API) so an older tab's save can't revert them. */
  updatedAt?: string
  time: string
  color: string
  schedule: {
    type: "daily" | "specific_days" | "times_per_week"
    days?: number[] // 0=Sunday, 1=Monday, etc.
    timesPerWeek?: number
  }
  dataEntry?: {
    enabled: boolean
    fields: DataEntryField[]
  }
  randomRemindersEnabled?: boolean
  // New neuroscience-backed fields
  priority?: number // 1-5 (5 = highest)
  category?: string // "exercise", "reading", "meditation", "personal", etc.
  tags?: HabitTag[]
  timeOfDay?: "morning" | "afternoon" | "evening" | "anytime"
  archived?: boolean
  archivedAt?: string // ISO timestamp
  archiveHistory?: Array<{ archivedAt: string; unarchivedAt?: string }>
  createdAt: string // ISO timestamp
  /**
   * "YYYY-MM-DD" the habit counts as active from, when that is earlier than
   * createdAt's day. Set by withCompletionStarts (days logged before it was
   * created: an assistant backfilling "I did it yesterday"), and by
   * server-side creation to the user's local day, since createdAt is a UTC
   * instant that can fall on the next calendar day. Never edited by hand.
   */
  startDate?: string
  /**
   * Marketplace provenance. Both are optional and purely informational — a habit
   * adopted from the catalog is an ordinary habit in every other respect, so a
   * tracker instance without the marketplace reads and writes it unchanged.
   */
  protocolSlug?: string // Protocol it was adopted as part of, if any
  catalogSlug?: string // Catalog entry it came from, so re-adoption is detectable
  /**
   * Read-to-complete. A habit carrying this opens the reading modal instead of
   * toggling — see `ReadingContent`. Optional for the same reason the two fields
   * above are: an instance that doesn't know it just toggles the habit normally.
   */
  readingContent?: ReadingContent
  implementationIntention?: ImplementationIntention
  identity?: IdentityConfig
  tinyHabit?: TinyHabitConfig
  streakData?: StreakData
  temptationBundle?: TemptationBundle
  environmentSetup?: EnvironmentSetup
}

export interface HabitCompletion {
  habitId: string
  date: string // YYYY-MM-DD format
  completed: boolean // Explicitly track completion status
  completedAt?: string // ISO timestamp - optional if only data is saved
  data?: {
    [fieldId: string]: number | string // Dynamic key-value pairs for each field
  }
  // New neuroscience-backed fields
  emotionalBenefits?: string[] // ["energized", "proud", "calm"]
  energyLevel?: number // 1-5
  difficulty?: number // 1-5
  celebrationViewed?: boolean
  context?: string // Notes about completion context
}

export interface Todo {
  id: string
  title: string
  description?: string
  dueDate?: string // YYYY-MM-DD format
  dueTime?: string // HH:MM format
  priority: 1 | 2 | 3 | 4 | 5
  status: "incomplete" | "in_progress" | "completed"
  completedAt?: string // ISO timestamp
  createdAt: string // ISO timestamp
  updatedAt?: string // ISO timestamp for API/client merge conflict resolution
  canTopolinoHelp?: boolean // Tag indicating if Topolino can assist with this task

  // New "Pro" fields
  projectId?: string
  estimatedMinutes?: number
  energyLevel?: "low" | "medium" | "high"
  tags?: string[]
  subtasks?: Array<{
    id: string
    title: string
    completed: boolean
  }>
  notes?: string
}

export interface CalendarEvent {
  id: string
  title: string
  startsAt: string // ISO timestamp
  endsAt: string // ISO timestamp
  location?: string
  notes?: string
  tags?: string[]
  todoId?: string
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp for API/client merge conflict resolution
}

export interface Project {
  id: string
  name: string
  color?: string
  createdAt: string // ISO timestamp
  updatedAt?: string // ISO timestamp
}

// Onboarding and user profile
export interface OnboardingState {
  completed: boolean
  currentStep: number // 1-5
  emotionalConnection?: {
    category: string
    story: string
  }
  skipped: boolean
}

export interface UserProfile {
  name?: string
  missionStatement?: string
  focusHabits?: string[] // Max 1-3 habit IDs
  checkInTimes?: {
    morning?: string // HH:MM
    midday?: string // HH:MM
    evening?: string // HH:MM
  }
  /** ISO time of the last change. */
  updatedAt?: string
  /** When each field last changed; the storage POST merges field by field (see mergeFieldStamped). */
  fieldsUpdatedAt?: Record<string, string>
}

/**
 * App preferences, saved in the blob so they follow the account across
 * devices and so assistants can read them (MCP get_profile). Every field is
 * optional: absent means the default in DEFAULT_PREFERENCES.
 */
export interface UserPreferences {
  /** Reminders on/off for this account. Browser permission is separate. */
  notifications?: boolean
  /** The user said "not now" to the browser-permission prompt (ISO time). */
  notificationPromptDismissedAt?: string
  theme?: "system" | "light" | "dark"
  /** 0 = Sunday, 1 = Monday. */
  weekStartsOn?: 0 | 1
  timeFormat?: "24h" | "12h"
  /** IANA zone, e.g. America/Argentina/Buenos_Aires. Lets the server know what "today" is. */
  timeZone?: string
  /** Show the morning dashboard between 05:00 and 11:00. */
  morningDashboard?: boolean
  /** YYYY-MM-DD the morning dashboard was last dismissed. */
  morningDashboardDismissedOn?: string
  habitsLayout?: "day" | "week" | "matrix"
  /** HH:MM pre-filled for new habits; empty = no reminder. */
  defaultReminderTime?: string
  /** Language for messages the server sends (push check-ins). Mirrors the `lang` cookie. */
  language?: "en" | "es"
  /** Proactive coach check-ins and the limits every coach (in-app or an assistant) must respect. */
  coach?: CoachPreferences
  /** ISO time of the last change. */
  updatedAt?: string
  /** When each field last changed; the storage POST merges field by field (see mergeFieldStamped). */
  fieldsUpdatedAt?: Record<string, string>
}

/**
 * Check-ins are off until the user sets a time. Quiet hours and the daily
 * cap apply to every nudge: server push check-ins and an assistant's
 * automations (MCP record_coach_nudge) alike.
 */
export interface CoachPreferences {
  checkIns?: {
    /** HH:MM local; absent = off. Two priorities and a first action. */
    morning?: string
    /** HH:MM local; absent = off. The next thing still worth doing. */
    afternoon?: string
    /** Weekly review; absent = off. day 0 = Sunday. */
    weekly?: { day: number; time: string }
  }
  /** Ask when a habit has gone unlogged for several due days ("skipped, or forgot to log?"). */
  missedLogging?: boolean
  /** No nudges between start and end (HH:MM, may wrap midnight). */
  quietHours?: { start: string; end: string }
  /** Coach messages per local day, all coaches combined. Habit reminders don't count. */
  maxNudgesPerDay?: number
}

export const DEFAULT_COACH_PREFERENCES: Required<Pick<CoachPreferences, "missedLogging" | "quietHours" | "maxNudgesPerDay">> = {
  missedLogging: false,
  quietHours: { start: "22:00", end: "08:00" },
  maxNudgesPerDay: 3,
}

export const DEFAULT_PREFERENCES: Required<Omit<UserPreferences, "notificationPromptDismissedAt" | "morningDashboardDismissedOn" | "timeZone" | "updatedAt" | "fieldsUpdatedAt" | "language" | "coach">> = {
  notifications: true,
  theme: "system",
  weekStartsOn: 1,
  timeFormat: "24h",
  morningDashboard: true,
  habitsLayout: "day",
  defaultReminderTime: "",
}

// Accessibility and user preferences
export interface AccessibilityPreferences {
  reduceMotion: boolean
  highContrast: boolean
  simpleLanguage: boolean
  extraReminders: boolean
  stepByStepMode: boolean
  compassionateMode: boolean // Hide streaks, positive language only
  adhdSupport: boolean // Focus mode default, timers, minimal distractions
}

// Social and accountability
export interface AccountabilityPartner {
  id: string
  name: string
  email?: string
  sharedHabitIds: string[]
  shareToken: string
  notificationFrequency: "daily" | "weekly"
  createdAt: string
}

export interface CommitmentContract {
  id: string
  habitId: string
  commitment: string
  duration: number // days
  consequence: string
  signed: boolean
  signedAt?: string
  partnerId?: string // Optional accountability partner
}

// Reward configuration
export interface RewardConfig {
  celebrationsEnabled: boolean
  soundEnabled: boolean
  confettiEnabled: boolean
  sharePrompts: boolean
  variableRewards: boolean // Random rewards (30% chance)
}

// Focus mode state
export interface FocusModeState {
  enabled: boolean
  hidePastDates: boolean
  showOnlyPending: boolean
  singleColumn: boolean
}

/**
 * One thing the coach suggested.
 *
 * `pillar` is a plain string rather than `PillarId` because `pillars.ts`
 * imports from this file, and typing it properly here would close the cycle.
 * The API route narrows it when it resolves the entry into a card.
 */
export interface CoachRecommendationEntry {
  kind: "protocol" | "habit" | "custom"
  /** Catalog slug for protocol/habit. Absent for custom. */
  slug?: string
  /** Why the coach thinks this fits, in its own words. */
  reason: string
  /** What the user did with it. Absent = pending. */
  status?: "pending" | "accepted" | "dismissed" | "snoozed"
  /** ISO time a snooze ends; the suggestion is pending again after it. */
  snoozedUntil?: string
  respondedAt?: string
  /** The habit to create. Present only for kind "custom". */
  custom?: {
    name: string
    why: string
    time: string
    pillar: string
    scheduleType: "daily" | "specific_days" | "times_per_week"
    days?: number[]
    timesPerWeek?: number
  }
}

export interface CoachRecommendationSet {
  /** ISO timestamp of the reply these came from. */
  generatedAt: string
  /** The question that produced them, for context when read back later. */
  question: string
  entries: CoachRecommendationEntry[]
}

export interface StorageData {
  habits: Habit[]
  completions: HabitCompletion[]
  todos: Todo[]
  projects: Project[]
  projectTombstones?: Record<string, string> // project id -> ISO deletion timestamp
  todoTombstones?: Record<string, string> // todo id -> ISO deletion timestamp
  habitTombstones?: Record<string, string> // habit id -> ISO deletion timestamp (assistant deletes)
  calendarEvents: CalendarEvent[]
  calendarEventTombstones?: Record<string, string> // calendar event id -> ISO deletion timestamp
  lastUpdated: string
  /**
   * The coach's most recent suggestions, kept so they can be fetched back out
   * of GET /api/v1/coach/recommendations after the chat is closed. Only the
   * last set: this is a pointer to "what was I just told", not a history.
   */
  coachRecommendations?: CoachRecommendationSet
  /**
   * When this account last exported a full backup — the in-app Export button or
   * GET /api/v1/export. Optional and additive on purpose: an older instance
   * that has never heard of it round-trips it untouched, so no schema bump.
   * Absent means "never backed up", which is not the same as "backed up long
   * ago" — see lib/backup-status.ts.
   */
  lastBackupAt?: string
  /**
   * When the account was last reset (Settings → Reset account). The storage
   * POST refuses a save made from a copy older than this, so another open tab
   * can't bring the deleted data back.
   */
  resetAt?: string
  // New neuroscience-backed fields
  schemaVersion?: number // Data version for migrations
  onboarding?: OnboardingState
  profile?: UserProfile
  preferences?: UserPreferences
  habitStacks?: HabitStack[]
  thoughtRecords?: ThoughtRecord[]
  aiInsights?: AIInsight[]
  focusMode?: FocusModeState
  accessibility?: AccessibilityPreferences
  rewardConfig?: RewardConfig
  accountabilityPartners?: AccountabilityPartner[]
  commitmentContracts?: CommitmentContract[]
}
