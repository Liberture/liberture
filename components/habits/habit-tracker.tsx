"use client"

import type React from "react"
import dynamic from "next/dynamic"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { HabitGrid } from "@/components/habits/habit-grid"
import { ScheduleEditor } from "@/components/habits/schedule-editor"
import { AddHabitDialog } from "@/components/habits/add-habit-dialog"
import { EditHabitDialog } from "@/components/habits/edit-habit-dialog"
import { AccountHeader } from "@/components/habits/account-header"
import { inferTimeOfDay } from "@/lib/habits/habit-utils"
import { takePostLoginIntent } from "@/lib/habits/post-login-intent"
import { TodoList } from "@/components/habits/todo-list"
import { CalendarView } from "@/components/habits/calendar-view"
import { HabitSummary } from "@/components/habits/habit-summary"
// recharts is only needed on the Stats view, so it loads on demand rather than
// being parsed on every cold start.
const HabitStatistics = dynamic(
  () => import("@/components/habits/habit-statistics").then((m) => m.HabitStatistics),
  {
    ssr: false,
    loading: () => <StatisticsLoading />,
  }
)

function StatisticsLoading() {
  const t = useTranslations().habits.app.habitTracker
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card/60">
      <span className="text-sm text-muted-foreground">{t.loadingStatistics}</span>
    </div>
  )
}
import { NotificationManager } from "@/components/habits/notification-manager"
import { BackupReminder } from "@/components/habits/backup-reminder"
import { SettingsDialog } from "@/components/habits/settings-dialog"
import { EditTodoDialog } from "@/components/habits/edit-todo-dialog"
import { OnboardingFlow } from "@/components/habits/onboarding/onboarding-flow"
import { MorningDashboard } from "@/components/habits/morning-dashboard"
import { MarketplaceView } from "@/components/habits/marketplace/marketplace-view"
import { HabitMatrix } from "@/components/habits/habit-matrix"
import { HabitDataEntryModal } from "@/components/habits/habit-data-entry-modal"
import { HabitReadingModal } from "@/components/habits/habit-reading-modal"
import { completedCountFor, isReadingHabit, selectPassage } from "@/lib/habits/reading-passages"
import { DateRangeFilter, defaultRange, type DateRange } from "@/components/habits/date-range-filter"

// The helix runs an animation loop over a canvas; it only matters once the
// stats view is open, so keep it out of the initial parse like the calendar.
const HabitHelix = dynamic(() => import("@/components/habits/habit-helix").then((m) => m.HabitHelix), {
  ssr: false,
  loading: () => <HelixLoading />,
})

function HelixLoading() {
  const t = useTranslations().habits.app.habitTracker
  return (
    <div className="flex h-[420px] items-center justify-center rounded-xl border border-border bg-card/60 sm:h-[520px]">
      <span className="text-sm text-muted-foreground">{t.loadingHelix}</span>
    </div>
  )
}
import { DailyTracker } from "@/components/habits/daily-tracker"
import { SwipeViews } from "@/components/habits/swipe-views"
import { TopographicBackground } from "@/components/habits/patterns/topographic-background"
import type { Habit, HabitCompletion, Todo, Project, CalendarEvent, StorageData, OnboardingState, CoachRecommendationSet } from "@/lib/habits/types"
import type { CatalogHabit, CatalogProtocol } from "@/lib/habits/protocols/catalog"
import { adoptProtocol, catalogHabitToHabit } from "@/lib/habits/protocols/adopt"
import { CoachPanel } from "@/components/habits/coach/coach-panel"
import { customRecommendationToHabit, type CustomHabitSpec } from "@/lib/habits/agent/recommendation"
import { format, subDays, startOfDay } from "date-fns"
import { Loader2, ListTodo, CalendarCheck, CalendarDays, Sparkles, Archive, Sunrise, Store, LayoutGrid, CalendarRange, Rows3, BarChart3, MessageCircleHeart } from "lucide-react"
import { getDailyMotivation, getCompletionCelebration } from "@/lib/habits/motivational-messages"
import { Button } from "@/components/habits/ui/button"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"
import { mergeProjectTombstones } from "@/lib/habits/project-sync"
import { mergeTodoTombstones } from "@/lib/habits/todo-sync"
import { mergeCalendarEventTombstones } from "@/lib/habits/calendar-sync"

type ActiveView = "habits" | "stats" | "todos" | "calendar" | "market" | "coach"

/**
 * Nav order and icons — drives both the mobile bar and the desktop segmented
 * control. Labels and titles come from translations, keyed by id.
 */
const VIEWS: Array<{
  id: ActiveView
  icon: typeof CalendarCheck
  /** Bottom bar is four slots wide; Market reaches from the day view instead. */
  mobileNav: boolean
}> = [
  { id: "habits", icon: CalendarCheck, mobileNav: true },
  { id: "todos", icon: ListTodo, mobileNav: true },
  { id: "calendar", icon: CalendarDays, mobileNav: true },
  { id: "stats", icon: BarChart3, mobileNav: true },
  { id: "market", icon: Store, mobileNav: false },
  { id: "coach", icon: MessageCircleHeart, mobileNav: true },
]


/**
 * Whether a saved array came back from the server unchanged.
 *
 * Length first, then a serialise-compare — for ~1k completions that costs about
 * a millisecond, once per save, and buys skipping a full re-render of every
 * list. Reference equality is useless here: the response is freshly parsed JSON.
 */
function sameList(sent: unknown[], received: unknown[] | undefined): boolean {
  if (sent === received) return true
  if (!Array.isArray(received) || sent.length !== received.length) return false
  return JSON.stringify(sent) === JSON.stringify(received)
}

const activeViewOrder: ActiveView[] = VIEWS.map((v) => v.id)

const UNSAVED_DRAFT_KEY = "habit-tracker-unsaved-draft"

interface UnsavedDraft {
  owner: string
  cachedAt: number
  data: StorageData
}

function readUnsavedDraft(): UnsavedDraft | null {
  try {
    const draft = JSON.parse(localStorage.getItem(UNSAVED_DRAFT_KEY) ?? "null") as UnsavedDraft | null
    if (
      !draft || typeof draft.owner !== "string" || typeof draft.cachedAt !== "number" ||
      !Array.isArray(draft.data?.habits) || !Array.isArray(draft.data.completions) ||
      !Array.isArray(draft.data.todos) || !Array.isArray(draft.data.projects) ||
      !Array.isArray(draft.data.calendarEvents)
    ) return null
    return draft
  } catch {
    return null
  }
}

interface HabitTrackerProps {
  apiKey: string
  isNostrAuth?: boolean
  onLogout: () => void
}

export function HabitTracker({ apiKey, isNostrAuth = false, onLogout }: HabitTrackerProps) {
  const t = useTranslations().habits.app.habitTracker
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<HabitCompletion[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [dates, setDates] = useState<Date[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [cachedLocally, setCachedLocally] = useState(false)
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)
  const [editingHabitForDialog, setEditingHabitForDialog] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  // /tracker?view=todos etc. (PWA shortcuts, assistant links) opens that view.
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    if (typeof window === "undefined") return "habits"
    const requested = new URLSearchParams(window.location.search).get("view")
    return VIEWS.some((v) => v.id === requested) ? (requested as ActiveView) : "habits"
  })
  /** Whether this instance has a coach configured, even when disconnected. */
  const [coachConfigured, setCoachConfigured] = useState(false)
  const [viewDirection, setViewDirection] = useState<"forward" | "back">("forward")

  const [isDirty, setIsDirty] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Mirror the user-mutable arrays in refs so we can detect edits that
  // happen during an in-flight save (the closure inside saveData captures
  // values from when the request started, refs always hold the latest).
  const habitsRef = useRef<Habit[]>([])
  const completionsRef = useRef<HabitCompletion[]>([])
  const todosRef = useRef<Todo[]>([])
  const projectsRef = useRef<Project[]>([])
  const calendarEventsRef = useRef<CalendarEvent[]>([])
  const projectTombstonesRef = useRef<NonNullable<StorageData["projectTombstones"]>>({})
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const isMobile = useMobile()
  const [showArchived, setShowArchived] = useState(false)
  const [showMorningDashboard, setShowMorningDashboard] = useState(false)
  const [timeOfDayFilter, setTimeOfDayFilter] = useState<string | null>(null)
  // Desktop-only: the 7-day grid vs. the full-history completion matrix.
  const [habitsLayout, setHabitsLayout] = useState<"day" | "grid" | "matrix">("day")

  // Historical summary state
  // Stats period, shared by the summary and the detailed charts. Last 7 days.
  const [statsRange, setStatsRange] = useState<DateRange>(() => defaultRange())

  // Onboarding state
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    completed: false,
    currentStep: 1,
    skipped: false
  })
  const [storageData, setStorageData] = useState<StorageData | null>(null)
  const [motivationalMessage, setMotivationalMessage] = useState<string>("")
  const [celebrationToast, setCelebrationToast] = useState<string | null>(null)
  const celebrationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Nostr migration state
  const [linkedNostrPubkey, setLinkedNostrPubkey] = useState<string | null>(null)
  const authHeaders = useMemo<Record<string, string>>(() => {
    const headers: Record<string, string> = {}
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`
    return headers
  }, [apiKey])

  // Asked once per session. The coach is an optional deployment that most
  // instances will not have, so the tab stays hidden until we know it is there.
  useEffect(() => {
    let cancelled = false
    fetch("/api/agent/status", { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { configured?: boolean; available?: boolean } | null) => {
        if (!cancelled) setCoachConfigured(Boolean(body?.configured ?? body?.available))
      })
      .catch(() => {
        if (!cancelled) setCoachConfigured(false)
      })
    return () => {
      cancelled = true
    }
  }, [authHeaders])

  // Came from the landing page's "Connect your assistant": new users get the
  // wizard, whose first step is connecting; everyone else lands on Settings →
  // Voice assistants.
  useEffect(() => {
    if (isLoading) return
    if (takePostLoginIntent() !== "connect" || !onboardingState.completed) return
    try {
      localStorage.setItem("habit-tracker-settings-tab", "assistants")
    } catch {}
    setShowSettings(true)
  }, [isLoading, onboardingState.completed])

  // For the header's Nostr profile (picture, name, NIP-05).
  const [nostrPubkey, setNostrPubkey] = useState<string | null>(null)
  useEffect(() => {
    if (!isNostrAuth) return
    try {
      setNostrPubkey(localStorage.getItem("habit-tracker-nostr-pubkey"))
    } catch {
      setNostrPubkey(null)
    }
  }, [isNostrAuth])

  const draftOwner = useCallback(() => {
    if (!isNostrAuth) return apiKey
    try {
      return localStorage.getItem("habit-tracker-nostr-pubkey") ?? ""
    } catch {
      return ""
    }
  }, [apiKey, isNostrAuth])

  // Fetch Nostr status for legacy users
  useEffect(() => {
    if (!isNostrAuth && apiKey) {
      fetch("/api/auth/nostr/status", {
        headers: authHeaders,
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.linkedNpub) {
            setLinkedNostrPubkey(data.linkedNpub)
          }
        })
        .catch(() => {
          // Ignore errors, just means we can't show status
        })
    }
  }, [apiKey, authHeaders, isNostrAuth])

  // Handler for Nostr migration completion
  const handleNostrMigration = useCallback((pubkey: string, npub: string) => {
    setLinkedNostrPubkey(npub)
  }, [])

  // Apply a server payload to local state (used by the initial load and by
  // silent background refreshes). Runs the legacy-format migrations inline.
  const applyServerData = useCallback((data: StorageData) => {
    // Migrate habits from old dataEntry format to new fields array format
    const migratedHabits = (data.habits || []).map((habit: any) => {
      if (habit.dataEntry?.enabled && !habit.dataEntry?.fields) {
        // Old format detected, migrate to new format
        const fields = []

        if (habit.dataEntry.type === "number" || habit.dataEntry.type === "both") {
          fields.push({
            id: crypto.randomUUID(),
            type: "number" as const,
            label: habit.dataEntry.numberLabel || "Value",
            unit: habit.dataEntry.numberUnit,
          })
        }

        if (habit.dataEntry.type === "text" || habit.dataEntry.type === "both") {
          fields.push({
            id: crypto.randomUUID(),
            type: "text" as const,
            label: habit.dataEntry.textLabel || "Notes",
          })
        }

        return {
          ...habit,
          dataEntry: {
            enabled: true,
            fields,
          },
        }
      }
      return habit
    })
    setHabits(migratedHabits)

    // Migrate completions to add 'completed' field and new data structure
    const migratedCompletions = (data.completions || []).map((completion: any) => {
      let migratedCompletion = { ...completion }

      // Migrate 'completed' field if missing
      if (migratedCompletion.completed === undefined) {
        migratedCompletion.completed = true
        migratedCompletion.completedAt = completion.completedAt || new Date().toISOString()
      }

      // Migrate data from old format (numberValue/textValue) to new format (field IDs)
      if (migratedCompletion.data && (migratedCompletion.data.numberValue !== undefined || migratedCompletion.data.textValue !== undefined)) {
        const habit = migratedHabits.find((h: any) => h.id === completion.habitId)
        if (habit?.dataEntry?.fields) {
          const newData: Record<string, number | string> = {}

          // Map old numberValue to first number field
          if (migratedCompletion.data.numberValue !== undefined) {
            const numberField = habit.dataEntry.fields.find((f: any) => f.type === "number")
            if (numberField) {
              newData[numberField.id] = migratedCompletion.data.numberValue
            }
          }

          // Map old textValue to first text field
          if (migratedCompletion.data.textValue !== undefined) {
            const textField = habit.dataEntry.fields.find((f: any) => f.type === "text")
            if (textField) {
              newData[textField.id] = migratedCompletion.data.textValue
            }
          }

          migratedCompletion.data = newData
        }
      }

      return migratedCompletion
    })
    setCompletions(migratedCompletions)

    // Migrate todos from completed boolean to status field
    const migratedTodos = (data.todos || []).map((todo: any) => {
      if (todo.status) {
        return todo // Already migrated
      }
      // Migrate from completed boolean to status
      return {
        ...todo,
        status: (todo as any).completed ? "completed" : "incomplete",
      }
    })
    setTodos(migratedTodos)
    setProjects(Array.isArray(data.projects) ? data.projects : [])
    setCalendarEvents(Array.isArray(data.calendarEvents) ? data.calendarEvents : [])

    // Load onboarding state
    if (data.onboarding) {
      setOnboardingState(data.onboarding)
    }

    // Store full data for onboarding completion
    setStorageData(data)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      let data: StorageData | null = null
      try {
        const response = await fetch("/api/storage", {
          headers: authHeaders,
        })
        if (response.ok) {
          data = await response.json()
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        const draft = readUnsavedDraft()
        if (draft?.owner && draft.owner === draftOwner()) {
          data = draft.data
          setIsDirty(true)
          setCachedLocally(true)
        }
        if (data) applyServerData(data)
        setIsLoading(false)
      }
    }
    loadData()
  }, [authHeaders, applyServerData, draftOwner])

  // Keep refs aligned with the latest user-mutable state.
  useEffect(() => {
    habitsRef.current = habits
  }, [habits])
  useEffect(() => {
    completionsRef.current = completions
  }, [completions])
  useEffect(() => {
    todosRef.current = todos
  }, [todos])
  useEffect(() => {
    projectsRef.current = projects
  }, [projects])
  useEffect(() => {
    calendarEventsRef.current = calendarEvents
  }, [calendarEvents])
  useEffect(() => {
    projectTombstonesRef.current = storageData?.projectTombstones ?? {}
  }, [storageData?.projectTombstones])
  const isDirtyRef = useRef(isDirty)
  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])
  const isSavingRef = useRef(isSaving)
  useEffect(() => {
    isSavingRef.current = isSaving
  }, [isSaving])
  const lastUpdatedRef = useRef<string | null>(null)
  useEffect(() => {
    lastUpdatedRef.current = storageData?.lastUpdated ?? null
  }, [storageData?.lastUpdated])

  // Persist every pending edit synchronously in the browser. The server copy
  // remains authoritative once it acknowledges the same draft.
  useEffect(() => {
    if (isLoading || !isDirty) return
    const owner = draftOwner()
    if (!owner) return
    const baseData = storageData ? { ...storageData } : {}
    delete (baseData as Record<string, unknown>).pomodoro
    delete (baseData as Record<string, unknown>).activePomodoro
    delete (baseData as Record<string, unknown>).pomodoroSessions
    delete (baseData as Record<string, unknown>).settings

    try {
      localStorage.setItem(UNSAVED_DRAFT_KEY, JSON.stringify({
        owner,
        cachedAt: Date.now(),
        data: {
          ...baseData,
          habits,
          completions,
          todos,
          projects,
          projectTombstones: projectTombstonesRef.current,
          calendarEvents,
          onboarding: onboardingState,
          lastUpdated: storageData?.lastUpdated ?? new Date().toISOString(),
          schemaVersion: Math.max(storageData?.schemaVersion ?? 7, 7),
        },
      } satisfies UnsavedDraft))
      setCachedLocally(true)
    } catch {
      setCachedLocally(false)
    }
  }, [calendarEvents, completions, draftOwner, habits, isDirty, isLoading, onboardingState, projects, storageData, todos])

  useEffect(() => {
    const warnAboutUnsavedChanges = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current && !isSavingRef.current) return
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warnAboutUnsavedChanges)
    return () => window.removeEventListener("beforeunload", warnAboutUnsavedChanges)
  }, [])

  // Silently pull server-side changes (another device, the API, a script)
  // into the UI. First hits the cheap meta endpoint; only downloads the full
  // blob when the server's lastUpdated differs from ours. Never runs while
  // local edits are pending — the save's smart merge covers that path.
  const refreshFromServer = useCallback(async () => {
    if (isDirtyRef.current || isSavingRef.current) return
    try {
      const metaResponse = await fetch("/api/storage/meta", {
        headers: authHeaders,
        cache: "no-store",
      })
      if (!metaResponse.ok) return
      const meta: { lastUpdated?: string | null } = await metaResponse.json()
      if (!meta.lastUpdated || meta.lastUpdated === lastUpdatedRef.current) return

      const response = await fetch("/api/storage", {
        headers: authHeaders,
        cache: "no-store",
      })
      if (!response.ok) return
      const data: StorageData = await response.json()
      // The user may have started editing while we fetched; applying the
      // response now would clobber those edits, so let the save merge win.
      if (isDirtyRef.current || isSavingRef.current) return
      applyServerData(data)
    } catch {
      // Background refresh must stay silent; the next tick will retry.
    }
  }, [authHeaders, applyServerData])

  useEffect(() => {
    if (isLoading) return
    const interval = setInterval(refreshFromServer, 30_000)
    const onWake = () => {
      if (document.visibilityState === "visible") refreshFromServer()
    }
    document.addEventListener("visibilitychange", onWake)
    window.addEventListener("focus", onWake)
    window.addEventListener("online", onWake)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onWake)
      window.removeEventListener("focus", onWake)
      window.removeEventListener("online", onWake)
    }
  }, [isLoading, refreshFromServer])

  const saveData = useCallback(async () => {
    if (!isDirty) return

    // Capture the array references we are about to send. After the fetch
    // we compare against the refs to see whether the user mutated state
    // mid-request; if they did, applying the (now stale) server response
    // would silently revert their edits.
    const sentHabits = habits
    const sentCompletions = completions
    const sentTodos = todos
    const sentProjects = projects
    const sentCalendarEvents = calendarEvents
    const cachedDraft = readUnsavedDraft()
    const sentDraftVersion = cachedDraft?.owner === draftOwner() ? cachedDraft.cachedAt : null

    setIsSaving(true)
    try {
      const baseData = storageData ? { ...storageData } : {}
      delete (baseData as Record<string, unknown>).pomodoro
      delete (baseData as Record<string, unknown>).activePomodoro
      delete (baseData as Record<string, unknown>).pomodoroSessions
      delete (baseData as Record<string, unknown>).settings

      const data: StorageData = {
        ...baseData,
        habits: sentHabits,
        completions: sentCompletions,
        todos: sentTodos,
        projects: sentProjects,
        projectTombstones: projectTombstonesRef.current,
        calendarEvents: sentCalendarEvents,
        onboarding: onboardingState,
        lastUpdated: storageData?.lastUpdated ?? new Date().toISOString(),
        schemaVersion: Math.max(storageData?.schemaVersion ?? 7, 7),
      }

      const response = await fetch("/api/storage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
          // Smart merge: server merges completions/todos arrays instead of overwriting
          // This prevents API changes from being lost when UI saves stale data
          "X-Merge-Strategy": "smart",
        },
        body: JSON.stringify(data),
      })

      if (response.status === 409) {
        const result = await response.json()
        if (result.code === "suspicious_empty_snapshot" && result.data) {
          applyServerData(result.data)
          setIsDirty(false)
          setSaveFailed(false)
          localStorage.removeItem(UNSAVED_DRAFT_KEY)
          setCachedLocally(false)
          alert(t.staleCopyRejected)
          return
        }
      }

      if (!response.ok) throw new Error(`Save failed with status ${response.status}`)
      const result = await response.json()
      if (!result.data) throw new Error("Save response did not include data")
      setSaveFailed(false)
      const stateUnchanged =
        habitsRef.current === sentHabits &&
        completionsRef.current === sentCompletions &&
        todosRef.current === sentTodos &&
        projectsRef.current === sentProjects &&
        calendarEventsRef.current === sentCalendarEvents

      if (stateUnchanged) {
        // The response echoes what we just sent, as fresh objects. Adopting
        // them unconditionally hands every list a new identity, which
        // invalidates each useMemo and re-renders the whole tree about two
        // seconds after every toggle — the lag you feel is this, not the tap.
        // Only take an array when the server actually changed it (an API
        // write merged in, say).
        if (!sameList(sentHabits, result.data.habits)) setHabits(result.data.habits)
        if (!sameList(sentCompletions, result.data.completions)) setCompletions(result.data.completions)
        if (!sameList(sentTodos, result.data.todos)) setTodos(result.data.todos)
        if (!sameList(sentProjects, result.data.projects ?? [])) setProjects(result.data.projects ?? [])
        if (!sameList(sentCalendarEvents, result.data.calendarEvents ?? [])) {
          setCalendarEvents(result.data.calendarEvents ?? [])
        }
        setStorageData(result.data)
        setIsDirty(false)
        // The save landed, so the local safety copy for this version is spent.
        const draft = readUnsavedDraft()
        if (draft?.owner === draftOwner() && draft.cachedAt === sentDraftVersion) {
          localStorage.removeItem(UNSAVED_DRAFT_KEY)
          setCachedLocally(false)
        }
      } else {
        // The user mutated state while this save was in flight. Keep
        // the live arrays, only refresh non-mutable fields, and leave
        // isDirty=true so the debounce picks up the new edits next.
        setStorageData((prev) =>
          prev
            ? {
                ...result.data,
                habits: prev.habits,
                completions: prev.completions,
                todos: prev.todos,
                projects: prev.projects,
                calendarEvents: prev.calendarEvents,
                projectTombstones: mergeProjectTombstones(result.data.projectTombstones, prev.projectTombstones),
                todoTombstones: mergeTodoTombstones(result.data.todoTombstones, prev.todoTombstones),
                calendarEventTombstones: mergeCalendarEventTombstones(result.data.calendarEventTombstones, prev.calendarEventTombstones),
              }
            : result.data,
        )
      }
    } catch (error) {
      console.error("Failed to save data:", error)
      setSaveFailed(true)
    } finally {
      setIsSaving(false)
    }
  }, [habits, completions, todos, projects, calendarEvents, isDirty, authHeaders, onboardingState, storageData, draftOwner, applyServerData, t])

  useEffect(() => {
    if (isDirty) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveData()
      }, 2000)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [isDirty, saveData])

  useEffect(() => {
    if (!isDirty) return
    const retry = () => {
      if (!isSavingRef.current) saveData()
    }
    const interval = setInterval(retry, 15_000)
    window.addEventListener("online", retry)
    return () => {
      clearInterval(interval)
      window.removeEventListener("online", retry)
    }
  }, [isDirty, saveData])

  // Keep the visible date window anchored to the current day. Rechecked on a
  // timer and whenever the tab wakes so a new day slides in without a reload;
  // identity is preserved when the day hasn't changed to avoid re-renders.
  useEffect(() => {
    const syncDates = () => {
      const today = startOfDay(new Date())
      setDates((prev) => {
        if (prev.length > 0 && prev[0].getTime() === today.getTime()) return prev
        return Array.from({ length: 7 }, (_, i) => subDays(today, i))
      })
    }
    syncDates()
    const interval = setInterval(syncDates, 60_000)
    const onWake = () => {
      if (document.visibilityState === "visible") syncDates()
    }
    document.addEventListener("visibilitychange", onWake)
    window.addEventListener("focus", onWake)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onWake)
      window.removeEventListener("focus", onWake)
    }
  }, [])

  // Set motivational message once data is loaded
  useEffect(() => {
    if (!isLoading && habits.length > 0) {
      setMotivationalMessage(getDailyMotivation(habits, completions))
    }
  }, [isLoading, habits.length, completions.length, habits, completions, dates])

  // Morning dashboard logic
  useEffect(() => {
    const hour = new Date().getHours()
    const isMorning = hour >= 5 && hour < 11
    const lastShown = localStorage.getItem("morning-dashboard-shown")
    const today = format(new Date(), "yyyy-MM-dd")

    if (isMorning && lastShown !== today && !isLoading && habits.length > 0) {
      setShowMorningDashboard(true)
    }
    
    // Check for query param view=morning
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('view') === 'morning') {
        setTimeOfDayFilter('morning')
      }
    }
    // `dates` changes on day rollover, so a tab left open overnight
    // re-evaluates the morning dashboard for the new day.
  }, [isLoading, habits.length, dates])

  const handleStartDay = () => {
    setShowMorningDashboard(false)
    localStorage.setItem("morning-dashboard-shown", format(new Date(), "yyyy-MM-dd"))
  }

  const handleOnboardingComplete = (habit: Habit, onboarding: OnboardingState) => {
    // Add the habit created during onboarding
    setHabits([habit])

    // Create first completion if user did it during onboarding
    const today = format(new Date(), "yyyy-MM-dd")
    const firstCompletion: HabitCompletion = {
      habitId: habit.id,
      date: today,
      completed: true,
      completedAt: new Date().toISOString()
    }
    setCompletions([firstCompletion])

    // Update onboarding state
    setOnboardingState({ ...onboarding, completed: true })
    setIsDirty(true)
  }

  const handleOnboardingSkip = () => {
    // Mark onboarding as completed/skipped
    setOnboardingState({
      completed: true,
      currentStep: 5,
      skipped: true
    })
    setIsDirty(true)
  }

  const addHabit = (habitData: Partial<Habit>) => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name: habitData.name || "New Habit",
      ...(habitData.description ? { description: habitData.description } : {}),
      time: habitData.time || "08:00",
      color: habitData.color || `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`,
      schedule: habitData.schedule || { type: "daily" },
      tags: habitData.tags || [],
      implementationIntention: habitData.implementationIntention,
      randomRemindersEnabled: habitData.randomRemindersEnabled ?? false,
      timeOfDay: habitData.timeOfDay ?? inferTimeOfDay(habitData.time || "08:00"),
      ...(habitData.dataEntry ? { dataEntry: habitData.dataEntry } : {}),
      createdAt: new Date().toISOString(),
      // Initialize streak data for new habits
      streakData: {
        current: 0,
        longest: 0,
        freezesAvailable: 0,
        freezesUsed: 0,
        milestones: [
          { days: 3, celebrated: false },
          { days: 7, celebrated: false },
          { days: 14, celebrated: false },
          { days: 21, celebrated: false },
          { days: 30, celebrated: false },
          { days: 66, celebrated: false },
        ],
      },
      priority: habitData.priority || 3,
      category: habitData.category || "personal",
      archived: false,
    }
    setHabits([...habits, newHabit])
    setIsDirty(true)
  }

  const deleteHabitById = useCallback((habitId: string) => {
    setHabits((current) => current.filter((h) => h.id !== habitId))
    setCompletions((current) => current.filter((c) => c.habitId !== habitId))
    setIsDirty(true)
  }, [])

  const archiveHabit = (habitId: string) => {
    const now = new Date().toISOString()
    setHabits(habits.map((h) => {
      if (h.id !== habitId) return h
      const history = h.archiveHistory ? [...h.archiveHistory] : []
      const lastOpen = history.length > 0 && !history[history.length - 1].unarchivedAt
      if (!lastOpen) history.push({ archivedAt: now })
      return { ...h, archived: true, archivedAt: now, archiveHistory: history }
    }))
    setIsDirty(true)
  }

  const unarchiveHabit = (habitId: string) => {
    const now = new Date().toISOString()
    setHabits(habits.map((h) => {
      if (h.id !== habitId) return h
      const history = h.archiveHistory ? [...h.archiveHistory] : []
      if (history.length > 0 && !history[history.length - 1].unarchivedAt) {
        history[history.length - 1] = { ...history[history.length - 1], unarchivedAt: now }
      }
      return { ...h, archived: false, archivedAt: undefined, archiveHistory: history }
    }))
    setIsDirty(true)
  }

  const saveHabitData = (
    habitId: string,
    date: Date,
    data: Record<string, number | string> | undefined,
    markComplete: boolean,
    // Reading habits save a one-line reflection here. Reuses the completion
    // field that already existed rather than adding one, which is part of how
    // read-to-complete stays inside schemaVersion 7.
    context?: string
  ) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const existing = completions.find((c) => c.habitId === habitId && c.date === dateStr)

    if (existing) {
      // Update existing entry
      setCompletions(
        completions.map((c) =>
          c.habitId === habitId && c.date === dateStr
            ? {
                ...c,
                completed: markComplete,
                completedAt: new Date().toISOString(),
                data,
                context: context ?? c.context,
              }
            : c
        )
      )
    } else {
      // Create new entry
      setCompletions([
        ...completions,
        {
          habitId,
          date: dateStr,
          completed: markComplete,
          completedAt: markComplete ? new Date().toISOString() : undefined,
          data,
          context,
        },
      ])
    }

    // Show celebration toast when marking complete
    const wasAlreadyCompleted = existing?.completed || false
    if (markComplete && !wasAlreadyCompleted) {
      const habit = habits.find((h) => h.id === habitId)
      if (habit) {
        const streak = habit.streakData?.current || 0
        const message = getCompletionCelebration(habit, streak + 1)
        setCelebrationToast(message)
        if (celebrationTimeoutRef.current) clearTimeout(celebrationTimeoutRef.current)
        celebrationTimeoutRef.current = setTimeout(() => setCelebrationToast(null), 3000)
      }
    }

    setIsDirty(true)
  }

  const toggleCompletion = (habitId: string, date: Date, data?: Record<string, number | string>) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const existing = completions.find((c) => c.habitId === habitId && c.date === dateStr)

    let willBeCompleted = false
    if (existing) {
      if (data !== undefined) {
        // Update existing entry with new data
        setCompletions(
          completions.map((c) =>
            c.habitId === habitId && c.date === dateStr
              ? { ...c, data: { ...c.data, ...data } }
              : c
          )
        )
      } else {
        // Toggle completion status
        willBeCompleted = !existing.completed
        setCompletions(
          completions.map((c) =>
            c.habitId === habitId && c.date === dateStr
              ? {
                  ...c,
                  completed: !c.completed,
                  completedAt: new Date().toISOString(),
                }
              : c
          )
        )
      }
    } else {
      willBeCompleted = true
      // Create new entry
      setCompletions([
        ...completions,
        {
          habitId,
          date: dateStr,
          completed: true,
          completedAt: new Date().toISOString(),
          data: data,
        },
      ])
    }

    // Show celebration toast when a habit is marked complete
    if (willBeCompleted) {
      const habit = habits.find((h) => h.id === habitId)
      if (habit) {
        const streak = habit.streakData?.current || 0
        const message = getCompletionCelebration(habit, streak + 1)
        setCelebrationToast(message)
        if (celebrationTimeoutRef.current) clearTimeout(celebrationTimeoutRef.current)
        celebrationTimeoutRef.current = setTimeout(() => setCelebrationToast(null), 3000)
      }
    }

    setIsDirty(true)
  }

  const addTodo = (
    title: string,
    dueDate?: string,
    dueTime?: string,
    priority: Todo["priority"] = 3,
    description?: string,
    status?: Todo["status"],
    canTopolinoHelp?: boolean,
    projectId?: string,
    estimatedMinutes?: number,
    energyLevel?: Todo["energyLevel"],
    tags?: string[],
    notes?: string,
  ) => {
    const now = new Date().toISOString()
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      description,
      dueDate,
      dueTime,
      priority,
      status: status || "incomplete",
      createdAt: now,
      updatedAt: now,
      completedAt: status === "completed" ? now : undefined,
      canTopolinoHelp: canTopolinoHelp ?? false,
      projectId,
      estimatedMinutes,
      energyLevel,
      tags,
      notes,
    }
    setTodos([...todos, newTodo])
    setIsDirty(true)
  }

  /**
   * The calendar's todo dialog hands back a `Partial<Todo>` rather than
   * `addTodo`'s long positional argument list, so adapt here instead of
   * teaching the calendar that signature.
   */
  const createTodoFromCalendar = (updates: Partial<Todo>) => {
    const title = updates.title?.trim()
    if (!title) return
    addTodo(
      title,
      updates.dueDate,
      updates.dueTime,
      updates.priority ?? 3,
      updates.description,
      updates.status,
      updates.canTopolinoHelp,
      updates.projectId,
      updates.estimatedMinutes,
      updates.energyLevel,
      updates.tags,
      updates.notes,
    )
  }

  const addProject = useCallback((name: string): Project => {
    const normalizedName = name.trim()
    const existingProject = projects.find(
      (project) => project.name.toLowerCase() === normalizedName.toLowerCase(),
    )
    if (existingProject) return existingProject

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: normalizedName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setProjects((currentProjects) => [...currentProjects, newProject])
    setIsDirty(true)
    return newProject
  }, [projects])

  const updateProject = useCallback((id: string, updates: Pick<Project, "name" | "color">) => {
    const name = updates.name.trim()
    if (!name) return
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === id ? { ...project, name, color: updates.color || undefined, updatedAt: new Date().toISOString() } : project,
      ),
    )
    setIsDirty(true)
  }, [])

  const recordProjectTombstone = (id: string, deletedAt: string) => {
    projectTombstonesRef.current = mergeProjectTombstones(projectTombstonesRef.current, { [id]: deletedAt })
    setStorageData((prev) =>
      prev
        ? {
            ...prev,
            projectTombstones: mergeProjectTombstones(prev.projectTombstones, { [id]: deletedAt }),
          }
        : prev,
    )
  }

  const deleteProject = useCallback((id: string) => {
    const now = new Date().toISOString()
    recordProjectTombstone(id, now)
    setProjects((currentProjects) => currentProjects.filter((project) => project.id !== id))
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.projectId === id ? { ...todo, projectId: undefined, updatedAt: now } : todo,
      ),
    )
    setIsDirty(true)
  }, [])

  const toggleTodoComplete = (id: string) => {
    const now = new Date().toISOString()
    setTodos(
      todos.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === "completed" ? "incomplete" : "completed",
              completedAt: t.status !== "completed" ? now : undefined,
              updatedAt: now,
            }
          : t,
      ),
    )
    setIsDirty(true)
  }

  const recordTodoTombstone = (id: string, deletedAt: string) => {
    setStorageData((prev) =>
      prev
        ? {
            ...prev,
            todoTombstones: mergeTodoTombstones(prev.todoTombstones, { [id]: deletedAt }),
          }
        : prev,
    )
  }

  const removeTodo = (id: string) => {
    recordTodoTombstone(id, new Date().toISOString())
    setTodos(todos.filter((t) => t.id !== id))
    setIsDirty(true)
  }

  const addCalendarEvent = (eventData: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString()
    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      ...eventData,
      tags: eventData.tags ?? [],
      createdAt: now,
      updatedAt: now,
    }
    setCalendarEvents([...calendarEvents, newEvent])
    setIsDirty(true)
  }

  const recordCalendarEventTombstone = (id: string, deletedAt: string) => {
    setStorageData((prev) =>
      prev
        ? {
            ...prev,
            calendarEventTombstones: mergeCalendarEventTombstones(prev.calendarEventTombstones, { [id]: deletedAt }),
          }
        : prev,
    )
  }

  const removeCalendarEvent = (id: string) => {
    recordCalendarEventTombstone(id, new Date().toISOString())
    setCalendarEvents(calendarEvents.filter((event) => event.id !== id))
    setIsDirty(true)
  }

  const exportData = () => {
    const backedUpAt = new Date().toISOString()
    const data: StorageData = {
      habits,
      completions,
      todos,
      projects,
      projectTombstones: storageData?.projectTombstones ?? {},
      calendarEvents,
      calendarEventTombstones: storageData?.calendarEventTombstones ?? {},
      lastUpdated: new Date().toISOString(),
      lastBackupAt: backedUpAt,
      schemaVersion: 7,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `habit-tracker-backup-${format(new Date(), "yyyy-MM-dd")}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Remember it. The download itself is fire-and-forget — the browser gives
    // us no completion signal — so this counts the moment the file was handed
    // over, which is the best available approximation. Goes through the normal
    // dirty/autosave path rather than its own request.
    setStorageData((current) => (current ? { ...current, lastBackupAt: backedUpAt } : current))
    setIsDirty(true)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        if (data.habits && Array.isArray(data.habits)) {
          setHabits(data.habits)
        }
        if (data.completions && Array.isArray(data.completions)) {
          setCompletions(data.completions)
        }
        if (data.todos && Array.isArray(data.todos)) {
          setTodos(data.todos)
        }
        if (data.projects && Array.isArray(data.projects)) {
          setProjects(data.projects)
        }
        if (data.calendarEvents && Array.isArray(data.calendarEvents)) {
          setCalendarEvents(data.calendarEvents)
        }
        setIsDirty(true)
      } catch (error) {
        console.error("Failed to import data:", error)
        alert(t.importFailed)
      }
    }
    reader.readAsText(file)
  }

  const updateSchedule = (habitId: string, schedule: Habit["schedule"]) => {
    setHabits(habits.map((h) => (h.id === habitId ? { ...h, schedule } : h)))
    setEditingHabitId(null)
    setIsDirty(true)
  }

  const updateHabit = (habitId: string, updates: Partial<Habit>) => {
    setHabits(habits.map((h) => (h.id === habitId ? { ...h, ...updates } : h)))
    setIsDirty(true)
  }

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    const now = new Date().toISOString()
    setTodos(
      todos.map((t) => {
        if (t.id !== id) return t
        const next = { ...t, ...updates, updatedAt: now }
        if (next.status === "completed" && !next.completedAt) next.completedAt = now
        if (next.status !== "completed") next.completedAt = undefined
        return next
      }),
    )
    setIsDirty(true)
  }

  const clearAllData = async () => {
    setHabits([])
    setCompletions([])
    setTodos([])
    setProjects([])
    setCalendarEvents([])
    setIsDirty(true)
  }

  const activeHabits = useMemo(
    () => showArchived
      ? habits
      : habits.filter((h) => !h.archived && (!timeOfDayFilter || h.timeOfDay === timeOfDayFilter)),
    [habits, showArchived, timeOfDayFilter]
  )
  const archivedCount = useMemo(() => habits.filter((h) => h.archived).length, [habits])
  const calendarHabits = useMemo(() => habits.filter((h) => !h.archived), [habits])

  const sortedActiveHabits = useMemo(
    () => [...activeHabits].sort((a, b) =>
      (a.time || "00:00").localeCompare(b.time || "00:00")
    ),
    [activeHabits]
  )

  const switchActiveView = useCallback((nextView: ActiveView) => {
    if (nextView === activeView) return
    setViewDirection(activeViewOrder.indexOf(nextView) > activeViewOrder.indexOf(activeView) ? "forward" : "back")
    setActiveView(nextView)
  }, [activeView])

  const openAddDialog = useCallback(() => setShowAddDialog(true), [])
  /**
   * Keep the Coach tab visible when configured, including during login and outages. Filtered here and not out of
   * VIEWS itself, because VIEWS also drives the swipe order and removing an
   * entry would shift every index behind it.
   */
  const navViews = useMemo(
    () => VIEWS.filter((v) => v.id !== "coach" || coachConfigured),
    [coachConfigured]
  )

  const mobileViews = navViews.filter((view) => view.mobileNav)

  const activeViewMeta = VIEWS.find((v) => v.id === activeView) ?? VIEWS[0]
  const activeViewTitle = t.views[activeViewMeta.id]
  const desktopViewTitle = t.viewTitles[activeViewMeta.id]
  const pendingSaveMessage = saveFailed
    ? cachedLocally ? t.saveFailedCached : t.saveFailedKeepOpen
    : cachedLocally ? t.savedLocallySyncing : t.unsavedChanges

  // Stable identity for the memoised day rows; toggleCompletion itself is
  // redefined each render, so it is reached through a ref.
  const toggleCompletionRef = useRef(toggleCompletion)
  toggleCompletionRef.current = toggleCompletion
  const toggleCompletionForDay = useCallback(
    (habitId: string, date: Date) => toggleCompletionRef.current(habitId, date),
    []
  )
  const openHabitEditor = useCallback((habitId: string) => setEditingHabitForDialog(habitId), [])

  /**
   * "Log data" on a habit row. This used to point at openHabitEditor, which
   * dropped the date on the floor and opened the habit's settings instead of
   * the data-entry modal — the modal only existed inside HabitGrid, so the day
   * view had no way to reach it. It lives here now so both views share it.
   */
  const [dataEntryTarget, setDataEntryTarget] = useState<{ habitId: string; date: Date } | null>(null)

  const openHabitData = useCallback((habitId: string, date: Date) => {
    setDataEntryTarget({ habitId, date })
  }, [])

  const closeHabitData = useCallback(() => setDataEntryTarget(null), [])

  const [readingTarget, setReadingTarget] = useState<{ habitId: string; date: Date } | null>(null)
  const closeReading = useCallback(() => setReadingTarget(null), [])

  /**
   * Completing a habit from the day view. Three cases, in order of specificity:
   * a reading habit opens the reading modal, a habit that collects data opens
   * the entry modal, and everything else toggles as it always did.
   *
   * Reading is checked first because a habit carrying both is conceptually a
   * reading habit — the passage is the point, and the modal carries its own
   * completion action either way. Both modals stay reachable once the habit is
   * already done, which is why neither branch checks completion state.
   */
  const toggleOrLogForDay = useCallback((habitId: string, date: Date) => {
    const habit = habitsRef.current.find((h) => h.id === habitId)
    if (isReadingHabit(habit?.readingContent)) {
      setReadingTarget({ habitId, date })
      return
    }
    if (habit?.dataEntry?.enabled) {
      setDataEntryTarget({ habitId, date })
      return
    }
    toggleCompletionRef.current(habitId, date)
  }, [])

  const dataEntryHabit = dataEntryTarget ? habits.find((h) => h.id === dataEntryTarget.habitId) : undefined

  const dataEntryCompletion = useMemo(() => {
    if (!dataEntryTarget) return undefined
    const dateStr = format(dataEntryTarget.date, "yyyy-MM-dd")
    return completions.find((c) => c.habitId === dataEntryTarget.habitId && c.date === dateStr)
  }, [dataEntryTarget, completions])

  const dataEntryModal =
    dataEntryTarget && dataEntryHabit ? (
      <HabitDataEntryModal
        habit={dataEntryHabit}
        date={dataEntryTarget.date}
        existingCompletion={dataEntryCompletion}
        onSave={(result) => {
          saveHabitData(dataEntryHabit.id, dataEntryTarget.date, result.data, result.markComplete)
          setDataEntryTarget(null)
        }}
        onClose={closeHabitData}
      />
    ) : null

  const readingHabit = readingTarget ? habits.find((h) => h.id === readingTarget.habitId) : undefined

  const readingCompletion = useMemo(() => {
    if (!readingTarget) return undefined
    const dateStr = format(readingTarget.date, "yyyy-MM-dd")
    return completions.find((c) => c.habitId === readingTarget.habitId && c.date === dateStr)
  }, [readingTarget, completions])

  /**
   * Which passage to show. Derived from the date (and, in sequence mode, from
   * how many days are already done) rather than stored, so reopening the modal
   * shows the same text and nothing extra reaches the storage blob.
   */
  const readingPassage = useMemo(() => {
    if (!readingTarget || !readingHabit?.readingContent) return undefined
    return selectPassage(
      readingHabit.readingContent,
      format(readingTarget.date, "yyyy-MM-dd"),
      completedCountFor(readingHabit.id, completions)
    )
  }, [readingTarget, readingHabit, completions])

  const readingModal =
    readingTarget && readingHabit && readingPassage ? (
      <HabitReadingModal
        habit={readingHabit}
        date={readingTarget.date}
        passage={readingPassage}
        existingCompletion={readingCompletion}
        onSave={(result) => {
          saveHabitData(
            readingHabit.id,
            readingTarget.date,
            // A reading habit records which passage was read, using the data map
            // that already exists rather than a new completion field.
            { passageId: result.passageId },
            result.markComplete,
            result.context
          )
          setReadingTarget(null)
        }}
        onClose={closeReading}
      />
    ) : null

  const showCelebration = useCallback((message: string) => {
    setCelebrationToast(message)
    if (celebrationTimeoutRef.current) clearTimeout(celebrationTimeoutRef.current)
    celebrationTimeoutRef.current = setTimeout(() => setCelebrationToast(null), 3000)
  }, [])

  /**
   * Marketplace adoption. Catalog entries become plain habits, so nothing here
   * touches the storage schema — see lib/protocols/adopt.ts.
   */
  const adoptCatalogProtocol = useCallback((protocol: CatalogProtocol) => {
    const adopted = adoptProtocol(protocol)
    setHabits((current) => {
      // Skip anything already tracked so re-adding a protocol tops it up
      // instead of creating duplicates.
      const existing = new Set(
        current.filter((h) => !h.archived && h.catalogSlug).map((h) => h.catalogSlug as string)
      )
      const fresh = adopted.filter((h) => !h.catalogSlug || !existing.has(h.catalogSlug))
      if (fresh.length === 0) return current
      return [...current, ...fresh]
    })
    setIsDirty(true)
    showCelebration(formatMessage(t.added, { name: protocol.name }))
  }, [showCelebration, t])

  const adoptCatalogHabit = useCallback((entry: CatalogHabit) => {
    setHabits((current) => {
      const alreadyTracked = current.some((h) => !h.archived && h.catalogSlug === entry.slug)
      if (alreadyTracked) return current
      return [...current, catalogHabitToHabit(entry)]
    })
    setIsDirty(true)
    showCelebration(formatMessage(t.added, { name: entry.name }))
  }, [showCelebration, t])

  /**
   * A habit the coach invented rather than found in the catalog. It has no
   * slug to dedupe on, so the guard is the name — the realistic mistake is
   * clicking Add twice on the same card, not two coincidentally identical
   * suggestions.
   */
  const adoptCustomHabit = useCallback((spec: CustomHabitSpec) => {
    setHabits((current) => {
      const alreadyTracked = current.some(
        (h) => !h.archived && h.name.trim().toLowerCase() === spec.name.trim().toLowerCase()
      )
      if (alreadyTracked) return current
      return [...current, customRecommendationToHabit(spec)]
    })
    setIsDirty(true)
    showCelebration(formatMessage(t.added, { name: spec.name }))
  }, [showCelebration, t])

  /**
   * Keep the coach's latest suggestions in the storage blob so
   * GET /api/v1/coach/recommendations can serve them to a CLI after the chat is
   * closed. Only the last set is kept — this answers "what was I just told",
   * not "what have I ever been told". Rides the normal autosave.
   */
  const recordCoachRecommendations = useCallback((set: CoachRecommendationSet) => {
    setStorageData((current) => (current ? { ...current, coachRecommendations: set } : current))
    setIsDirty(true)
  }, [])

  if (isLoading) {
    return (
      <div className="topo-pattern lb-see-through flex items-center justify-center h-screen">
        <TopographicBackground />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t.loadingHabits}</p>
        </div>
      </div>
    )
  }

  // Show onboarding for new users
  if (!onboardingState.completed) {
    return (
      <OnboardingFlow
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
        apiKey={apiKey}
        isNostrAuth={isNostrAuth}
      />
    )
  }

  if (showMorningDashboard) {
    return (
      <MorningDashboard
        habits={habits}
        completions={completions}
        profile={storageData?.profile}
        onStartDay={handleStartDay}
        onDismiss={() => setShowMorningDashboard(false)}
      />
    )
  }

  if (isMobile) {
    return (
      <div className="topo-pattern lb-see-through flex h-dvh flex-col overflow-hidden">
        <TopographicBackground />
        <header className="flex-shrink-0 border-b border-border/50 bg-background px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
          {/* Fixed geometry: the name truncates and the action buttons keep a
              constant size, so nothing reflows as views or filters change. */}
          <div className="flex h-12 items-center justify-between gap-2">
            <AccountHeader
              compact
              pubkey={nostrPubkey}
              fallbackName={storageData?.profile?.name}
              onSettings={() => setShowSettings(true)}
              onLogout={onLogout}
            />
          </div>
          <div className="mt-2 flex h-7 items-baseline justify-between gap-3">
            <h1 className="min-w-0 truncate text-xl font-bold text-foreground">{activeViewTitle}</h1>
            <p className="shrink-0 text-xs text-muted-foreground">
              {isSaving && (
                <span className="inline-flex items-center gap-1 text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t.saving}
                </span>
              )}
              {!isSaving && isDirty && <span className="text-exercise">{pendingSaveMessage}</span>}
              {!isSaving && !isDirty && <span>{t.saved}</span>}
            </p>
          </div>
        </header>

        <SwipeViews
          views={activeViewOrder}
          active={activeView}
          onChange={switchActiveView}
          className="min-h-0 flex-1"
          panelClassName="lb-scroll p-4 pb-[calc(7.25rem+env(safe-area-inset-bottom))]"
          renderView={(view) => (
            <>
            {view === "habits" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1">
                    {([["day", t.layouts.day], ["grid", t.layouts.week]] as const).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setHabitsLayout(id)}
                        aria-pressed={habitsLayout === id}
                        className={cn(
                          "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          habitsLayout === id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <BackupReminder
                    habits={habits}
                    lastBackupAt={storageData?.lastBackupAt}
                    onExport={exportData}
                  />

                  {/* Motivational Banner - Mobile */}
                  {motivationalMessage && habits.length > 0 && habitsLayout !== "day" && (
                    <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-work/10 p-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                      <p className="text-xs text-foreground">{motivationalMessage}</p>
                    </div>
                  )}

                  {/* Mobile shows the day view; the 7-day grid stays available below. */}
                  {habitsLayout === "day" ? (
                    <DailyTracker
                      habits={habits}
                      completions={completions}
                      displayName={storageData?.profile?.name}
                      motivationalMessage={motivationalMessage}
                      onToggleCompletion={toggleOrLogForDay}
                      onLogData={openHabitData}
                      onEditHabit={openHabitEditor}
                      onDeleteHabit={deleteHabitById}
                      onAddHabit={openAddDialog}
                      onBrowseMarket={() => switchActiveView("market")}
                      onOpenCoach={coachConfigured ? () => switchActiveView("coach") : undefined}
                      onOpenStats={() => switchActiveView("stats")}
                      timeOfDayFilter={timeOfDayFilter}
                      onTimeOfDayFilterChange={setTimeOfDayFilter}
                    />
                  ) : (
                    <HabitGrid
                      habits={sortedActiveHabits}
                      dates={dates}
                      completions={completions}
                      onToggleCompletion={toggleCompletion}
                      onSaveHabitData={saveHabitData}
                      onEditSchedule={setEditingHabitId}
                      onAddHabit={openAddDialog}
                      onDeleteHabit={deleteHabitById}
                      onEditHabit={openHabitEditor}
                      onUnarchiveHabit={unarchiveHabit}
                    />
                  )}

                  {archivedCount > 0 && (
                    <button
                      onClick={() => setShowArchived(!showArchived)}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      {formatMessage(showArchived ? t.hideArchivedShort : t.showArchivedShort, { count: archivedCount })}
                    </button>
                  )}

                </div>
              ) : view === "stats" ? (
                <div className="space-y-4">
                  <DateRangeFilter value={statsRange} onChange={setStatsRange} />
                  <HabitSummary
                    habits={activeHabits}
                    completions={completions}
                    range={statsRange}
                  />
                  <HabitHelix habits={activeHabits} completions={completions} />
                  <HabitStatistics
                    habits={activeHabits}
                    completions={completions}
                    range={statsRange}
                  />
                </div>
              ) : view === "todos" ? (
                <TodoList
                  todos={todos}
                  projects={projects}
                  onToggleComplete={toggleTodoComplete}
                  onRemove={removeTodo}
                  onAddTodo={addTodo}
                  onAddProject={addProject}
                  onUpdateProject={updateProject}
                  onDeleteProject={deleteProject}
                  onEdit={(todo) => setEditingTodoId(todo.id)}
                />
              ) : view === "calendar" ? (
                <CalendarView
                  events={calendarEvents}
                  todos={todos}
                  habits={calendarHabits}
                  completions={completions}
                  onAddEvent={addCalendarEvent}
                  onRemoveEvent={removeCalendarEvent}
                  projects={projects}
                  onAddProject={addProject}
                  onCreateTodo={createTodoFromCalendar}
                  onUpdateTodo={updateTodo}
                  onDeleteTodo={removeTodo}
                />
              ) : view === "market" ? (
                <MarketplaceView
                  habits={habits}
                  onAdoptProtocol={adoptCatalogProtocol}
                  onAdoptHabit={adoptCatalogHabit}
                />
              ) : (
                <CoachPanel
                  apiKey={apiKey}
                  habits={habits}
                  onAdoptProtocol={adoptCatalogProtocol}
                  onAdoptHabit={adoptCatalogHabit}
                  onAdoptCustom={adoptCustomHabit}
                  onRecommendations={recordCoachRecommendations}
                />
              )}
            </>
          )}
        />

        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-lg">
          <div className="relative grid gap-2 p-3" style={{ gridTemplateColumns: `repeat(${mobileViews.length}, minmax(0, 1fr))` }}>
            {/* Sliding pill. Width is one column; the offset is that width per
                slot. Hidden when the active view isn't on the bar (Market). */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-y-3 left-3 rounded-lg bg-primary shadow-sm transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform",
                mobileViews.some((v) => v.id === activeView) ? "opacity-100" : "opacity-0",
              )}
              style={{
                width: `calc((100% - ${1.5 + (mobileViews.length - 1) * 0.5}rem) / ${mobileViews.length})`,
                transform: `translateX(calc(${Math.max(mobileViews.findIndex((v) => v.id === activeView), 0)} * (100% + 0.5rem)))`,
              }}
            />
            {mobileViews.map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => switchActiveView(id)}
                aria-current={activeView === id ? "page" : undefined}
                className={cn(
                  "relative z-10 flex flex-col items-center gap-1.5 rounded-2xl py-4 transition-[color,transform] duration-200 ease-out active:scale-[0.98]",
                  activeView === id
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <Icon className="size-6" />
                <span className="text-sm font-semibold">{t.views[id]}</span>
              </button>
            ))}
          </div>
        </div>

        {showAddDialog && (
          <AddHabitDialog
            onSave={addHabit}
            onClose={() => setShowAddDialog(false)}
          />
        )}

        {editingHabitId && (
          <ScheduleEditor
            habit={habits.find((h) => h.id === editingHabitId)!}
            onSave={updateSchedule}
            onClose={() => setEditingHabitId(null)}
          />
        )}

        {editingHabitForDialog && habits.find((h) => h.id === editingHabitForDialog) && (
          <EditHabitDialog
            habit={habits.find((h) => h.id === editingHabitForDialog)!}
            onSave={updateHabit}
            onDelete={deleteHabitById}
            onArchive={archiveHabit}
            onUnarchive={unarchiveHabit}
            onClose={() => setEditingHabitForDialog(null)}
          />
        )}

        {editingTodoId && todos.find((t) => t.id === editingTodoId) && (
          <EditTodoDialog
            todo={todos.find((t) => t.id === editingTodoId)!}
            projects={projects}
            onAddProject={addProject}
            onSave={updateTodo}
            onDelete={removeTodo}
            onClose={() => setEditingTodoId(null)}
          />
        )}

        {dataEntryModal}

        {readingModal}

        {showSettings && (
          <SettingsDialog
            onExport={exportData}
            lastBackupAt={storageData?.lastBackupAt}
            onImport={importData}
            onClose={() => setShowSettings(false)}
            habits={habits}
            completions={completions}
            todos={todos}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={setNotificationsEnabled}
            onClearAllData={clearAllData}
            apiKey={apiKey}
            isNostrAuth={isNostrAuth}
            onLogout={onLogout}
            linkedNostrPubkey={linkedNostrPubkey}
            pubkey={nostrPubkey}
            profileName={storageData?.profile?.name}
            onNostrMigration={handleNostrMigration}
          />
        )}

        <NotificationManager habits={habits} completions={completions} enabled={!isLoading && notificationsEnabled} />

        {/* Celebration Toast - Mobile */}
        {celebrationToast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-card border border-success/30 shadow-lg rounded-xl px-4 py-2.5 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-success flex-shrink-0" />
              <span className="text-xs font-medium text-foreground">{celebrationToast}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="topo-pattern lb-see-through flex flex-col h-screen">
      <TopographicBackground />
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
              {navViews.map(({ id, icon: Icon }) => (
                <Button
                  key={id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveView(id)}
                  aria-current={activeView === id ? "page" : undefined}
                  className={cn(
                    "gap-2 rounded-lg transition-colors",
                    activeView === id
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.views[id]}
                </Button>
              ))}
            </div>
            {activeView === "habits" && (
            <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHabitsLayout("day")}
                aria-pressed={habitsLayout === "day"}
                className={cn(
                  "text-xs rounded-lg px-2 gap-1 transition-colors",
                  habitsLayout === "day"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <Rows3 className="h-3 w-3" />
                {t.layouts.day}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHabitsLayout("grid")}
                aria-pressed={habitsLayout === "grid"}
                className={cn(
                  "text-xs rounded-lg px-2 gap-1 transition-colors",
                  habitsLayout === "grid"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <LayoutGrid className="h-3 w-3" />
                {t.layouts.week}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHabitsLayout("matrix")}
                aria-pressed={habitsLayout === "matrix"}
                className={cn(
                  "text-xs rounded-lg px-2 gap-1 transition-colors",
                  habitsLayout === "matrix"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <CalendarRange className="h-3 w-3" />
                {t.layouts.matrix}
              </Button>
            </div>
            )}
            <div className="border-l border-border pl-4">
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                {desktopViewTitle}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isSaving && (
                  <span className="inline-flex items-center gap-1 text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t.saving}
                  </span>
                )}
                {!isSaving && isDirty && <span className="text-exercise">{pendingSaveMessage}</span>}
                {!isSaving && !isDirty && <span className="text-muted-foreground">{t.allChangesSaved}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AccountHeader
              pubkey={nostrPubkey}
              fallbackName={storageData?.profile?.name}
              onSettings={() => setShowSettings(true)}
              onLogout={onLogout}
            />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <SwipeViews
          views={activeViewOrder}
          active={activeView}
          onChange={switchActiveView}
          className="flex-1"
          panelClassName="lb-scroll p-6"
          renderView={(view) => (
            <>
              {view === "habits" ? (
                <div className="space-y-6">
                  <BackupReminder
                    habits={habits}
                    lastBackupAt={storageData?.lastBackupAt}
                    onExport={exportData}
                  />

                  {/* Motivational Banner */}
                  {motivationalMessage && habits.length > 0 && habitsLayout !== "day" && (
                    <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-work/10 p-4 flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                      <p className="text-sm text-foreground">{motivationalMessage}</p>
                    </div>
                  )}

                  {habitsLayout === "day" ? (
                    <DailyTracker
                      habits={habits}
                      completions={completions}
                      displayName={storageData?.profile?.name}
                      motivationalMessage={motivationalMessage}
                      onToggleCompletion={toggleOrLogForDay}
                      onLogData={openHabitData}
                      onEditHabit={openHabitEditor}
                      onDeleteHabit={deleteHabitById}
                      onAddHabit={openAddDialog}
                      onBrowseMarket={() => switchActiveView("market")}
                      onOpenCoach={coachConfigured ? () => switchActiveView("coach") : undefined}
                      onOpenStats={() => switchActiveView("stats")}
                      timeOfDayFilter={timeOfDayFilter}
                      onTimeOfDayFilterChange={setTimeOfDayFilter}
                    />
                  ) : habitsLayout === "matrix" ? (
                    <HabitMatrix
                      habits={sortedActiveHabits}
                      completions={completions}
                      // Not the plain toggle: a habit with data fields or a
                      // reading passage has to open its modal here too, the
                      // same as the day view. The matrix was marking those
                      // complete and silently skipping the entry step.
                      onToggleCompletion={toggleOrLogForDay}
                    />
                  ) : (
                    <HabitGrid
                      habits={sortedActiveHabits}
                      dates={dates}
                      completions={completions}
                      onToggleCompletion={toggleCompletion}
                      onSaveHabitData={saveHabitData}
                      onEditSchedule={setEditingHabitId}
                      onAddHabit={openAddDialog}
                      onDeleteHabit={deleteHabitById}
                      onEditHabit={openHabitEditor}
                      onUnarchiveHabit={unarchiveHabit}
                    />
                  )}

                  {archivedCount > 0 && (
                    <button
                      onClick={() => setShowArchived(!showArchived)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                    >
                      <Archive className="h-4 w-4" />
                      {formatMessage(showArchived ? t.hideArchived : t.showArchived, { count: archivedCount })}
                    </button>
                  )}

            </div>
          ) : view === "stats" ? (
                <div className="space-y-4">
                  <DateRangeFilter value={statsRange} onChange={setStatsRange} />
                  <HabitSummary
                    habits={activeHabits}
                    completions={completions}
                    range={statsRange}
                  />
                  <HabitHelix habits={activeHabits} completions={completions} />
                  <HabitStatistics
                    habits={activeHabits}
                    completions={completions}
                    range={statsRange}
                  />
                </div>
              ) : view === "todos" ? (
            <div className="max-w-4xl">
              <TodoList
                todos={todos}
                projects={projects}
                onToggleComplete={toggleTodoComplete}
                onRemove={removeTodo}
                onAddTodo={addTodo}
                onAddProject={addProject}
                onUpdateProject={updateProject}
                onDeleteProject={deleteProject}
                onEdit={(todo) => setEditingTodoId(todo.id)}
              />
            </div>
          ) : view === "calendar" ? (
            <CalendarView
              events={calendarEvents}
              todos={todos}
              habits={calendarHabits}
              completions={completions}
              onAddEvent={addCalendarEvent}
              onRemoveEvent={removeCalendarEvent}
              projects={projects}
              onAddProject={addProject}
              onCreateTodo={createTodoFromCalendar}
              onUpdateTodo={updateTodo}
              onDeleteTodo={removeTodo}
            />
          ) : view === "market" ? (
            <MarketplaceView
              habits={habits}
              onAdoptProtocol={adoptCatalogProtocol}
              onAdoptHabit={adoptCatalogHabit}
            />
          ) : (
            <CoachPanel
              apiKey={apiKey}
              habits={habits}
              onAdoptProtocol={adoptCatalogProtocol}
              onAdoptHabit={adoptCatalogHabit}
              onAdoptCustom={adoptCustomHabit}
              onRecommendations={recordCoachRecommendations}
            />
          )}
            </>
          )}
        />
      </div>

      {showAddDialog && (
          <AddHabitDialog
            onSave={addHabit}
            onClose={() => setShowAddDialog(false)}
          />
      )}

      {editingHabitId && (
        <ScheduleEditor
          habit={habits.find((h) => h.id === editingHabitId)!}
          onSave={updateSchedule}
          onClose={() => setEditingHabitId(null)}
        />
      )}

      {editingHabitForDialog && habits.find((h) => h.id === editingHabitForDialog) && (
        <EditHabitDialog
          habit={habits.find((h) => h.id === editingHabitForDialog)!}
          onSave={updateHabit}
          onDelete={deleteHabitById}
          onArchive={archiveHabit}
          onUnarchive={unarchiveHabit}
          onClose={() => setEditingHabitForDialog(null)}
        />
      )}

      {editingTodoId && todos.find((t) => t.id === editingTodoId) && (
        <EditTodoDialog
          todo={todos.find((t) => t.id === editingTodoId)!}
          projects={projects}
          onAddProject={addProject}
          onSave={updateTodo}
          onDelete={removeTodo}
          onClose={() => setEditingTodoId(null)}
        />
      )}

      {dataEntryModal}

      {readingModal}

      {showSettings && (
        <SettingsDialog
          onExport={exportData}
          lastBackupAt={storageData?.lastBackupAt}
          onImport={importData}
          onClose={() => setShowSettings(false)}
          habits={habits}
          completions={completions}
          todos={todos}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={setNotificationsEnabled}
          onClearAllData={clearAllData}
          apiKey={apiKey}
          isNostrAuth={isNostrAuth}
          onLogout={onLogout}
          linkedNostrPubkey={linkedNostrPubkey}
          pubkey={nostrPubkey}
          profileName={storageData?.profile?.name}
          onNostrMigration={handleNostrMigration}
        />
      )}

      <NotificationManager habits={habits} completions={completions} enabled={!isLoading && notificationsEnabled} />

      {/* Celebration Toast */}
      {celebrationToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-card border border-success/30 shadow-lg rounded-xl px-5 py-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-success flex-shrink-0" />
            <span className="text-sm font-medium text-foreground">{celebrationToast}</span>
          </div>
        </div>
      )}
    </div>
  )
}
