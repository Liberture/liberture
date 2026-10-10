"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type {
  CalendarEvent,
  Habit,
  HabitCompletion,
  OnboardingState,
  Project,
  StorageData,
  Todo,
  UserPreferences,
  UserProfile,
} from "@/lib/habits/types"
import { DEFAULT_PREFERENCES } from "@/lib/habits/types"
import { withCompletionStarts } from "@/lib/habits/habit-utils"
import { mergeProjectTombstones } from "@/lib/habits/project-sync"
import { mergeTodoTombstones } from "@/lib/habits/todo-sync"
import { mergeCalendarEventTombstones } from "@/lib/habits/calendar-sync"
import { notify } from "@/components/habits/ui/toast"

/**
 * The tracker's data layer: everything that is loaded from, kept in sync with,
 * and saved back to /api/storage. Lifted out of habit-tracker.tsx verbatim —
 * the save/merge/tombstone logic is subtle and was moved, not rewritten. The
 * component only reads the state and calls the setters plus `markDirty`.
 */

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

const UNSAVED_DRAFT_KEY = "habit-tracker-unsaved-draft"

/**
 * This device's copies of account data, cleared by a reset. Sign-in keys
 * (habit-tracker-api-key, -auth-type, -nostr-*) are left alone on purpose.
 */
const DEVICE_DATA_KEYS = [
  UNSAVED_DRAFT_KEY,
  "habit-coach-thread-started-at",
  "habit-tracker-backup-snoozed-until",
  "habit-tracker-settings-tab",
  "habit-grid:info-col-widths",
  "morning-dashboard-shown",
  "liberture-reminder-claims:",
]

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

/** Everything the user can change in one go; used for undo snapshots. */
export interface TrackerSnapshot {
  habits: Habit[]
  completions: HabitCompletion[]
  todos: Todo[]
  projects: Project[]
  calendarEvents: CalendarEvent[]
}

export type ResolvedPreferences = typeof DEFAULT_PREFERENCES & UserPreferences

interface UseTrackerDataOptions {
  apiKey: string
  isNostrAuth: boolean
  authHeaders: Record<string, string>
  /** Toast when a save finds the account was reset on another device. */
  accountResetMessage: string
  /** Shown when the server rejects a stale local copy. */
  staleCopyMessage: string
}

export function useTrackerData({ apiKey, isNostrAuth, authHeaders, staleCopyMessage, accountResetMessage }: UseTrackerDataOptions) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<HabitCompletion[]>([])
  // Days logged before a habit was created (the assistant backfilling "I did it
  // yesterday") must count in stats, streaks and charts: derive each habit's
  // startDate from its earliest completion. Same array back when nothing
  // changed, so this settles after one pass and never marks the data dirty.
  useEffect(() => {
    setHabits((current) => withCompletionStarts(current, completions))
  }, [completions])
  const [todos, setTodos] = useState<Todo[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [cachedLocally, setCachedLocally] = useState(false)
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
  /**
   * Bumped by every change that lives only on `storageData` (preferences,
   * profile, backup time, coach suggestions). A save that started before such
   * a change must not mark the data clean or overwrite it with the server echo.
   */
  const metaVersionRef = useRef(0)

  // Onboarding state
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    completed: false,
    currentStep: 1,
    skipped: false,
  })
  const [storageData, setStorageData] = useState<StorageData | null>(null)

  const markDirty = useCallback(() => setIsDirty(true), [])

  const draftOwner = useCallback(() => {
    if (!isNostrAuth) return apiKey
    try {
      return localStorage.getItem("habit-tracker-nostr-pubkey") ?? ""
    } catch {
      return ""
    }
  }, [apiKey, isNostrAuth])

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
      const migratedCompletion = { ...completion }

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
    // iOS restores pages from the back/forward cache without a visibilitychange.
    window.addEventListener("pageshow", onWake)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onWake)
      window.removeEventListener("focus", onWake)
      window.removeEventListener("online", onWake)
      window.removeEventListener("pageshow", onWake)
    }
  }, [isLoading, refreshFromServer])

  // Live updates: the server pushes an event the moment this user's data
  // changes anywhere (ChatGPT/Claude through MCP, another device, the API),
  // so changes show up without a reload. The poll above stays as a fallback.
  // Mobile browsers drop the stream in the background; EventSource reconnects
  // when the page comes back and "ready" triggers a check for anything missed.
  useEffect(() => {
    if (isLoading || typeof EventSource === "undefined") return
    const url = apiKey ? `/api/storage/events?apiKey=${encodeURIComponent(apiKey)}` : "/api/storage/events"
    const source = new EventSource(url)
    const onChange = (event: MessageEvent<string>) => {
      try {
        const { lastUpdated } = JSON.parse(event.data) as { lastUpdated?: string | null }
        // Our own save echoing back: nothing new to fetch.
        if (lastUpdated && lastUpdated === lastUpdatedRef.current) return
      } catch {
        // Malformed payload: just check.
      }
      refreshFromServer()
    }
    const onReady = () => refreshFromServer()
    source.addEventListener("change", onChange)
    source.addEventListener("ready", onReady)
    return () => {
      source.removeEventListener("change", onChange)
      source.removeEventListener("ready", onReady)
      source.close()
    }
  }, [isLoading, apiKey, refreshFromServer])

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
    const sentMetaVersion = metaVersionRef.current
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
        // The account was reset elsewhere: take the fresh account, drop this copy.
        if (result.code === "account_reset" && result.data) {
          applyServerData(result.data)
          setIsDirty(false)
          setSaveFailed(false)
          localStorage.removeItem(UNSAVED_DRAFT_KEY)
          setCachedLocally(false)
          notify.info(accountResetMessage)
          return
        }
        if (result.code === "suspicious_empty_snapshot" && result.data) {
          applyServerData(result.data)
          setIsDirty(false)
          setSaveFailed(false)
          localStorage.removeItem(UNSAVED_DRAFT_KEY)
          setCachedLocally(false)
          notify.error(staleCopyMessage)
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
        calendarEventsRef.current === sentCalendarEvents &&
        metaVersionRef.current === sentMetaVersion

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
        // the live arrays (and the blob-only fields they may have edited),
        // only refresh non-mutable fields, and leave isDirty=true so the
        // debounce picks up the new edits next.
        setStorageData((prev) =>
          prev
            ? {
                ...result.data,
                habits: prev.habits,
                completions: prev.completions,
                todos: prev.todos,
                projects: prev.projects,
                calendarEvents: prev.calendarEvents,
                preferences: prev.preferences,
                profile: prev.profile,
                coachRecommendations: prev.coachRecommendations,
                lastBackupAt: prev.lastBackupAt,
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
  }, [habits, completions, todos, projects, calendarEvents, isDirty, authHeaders, onboardingState, storageData, draftOwner, applyServerData, staleCopyMessage, accountResetMessage])

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

  /**
   * Change a field that lives only on the blob (not one of the arrays). Rides
   * the normal dirty/autosave path, like lastBackupAt and coachRecommendations
   * always did.
   */
  const updateStorageMeta = useCallback((update: (current: StorageData) => StorageData) => {
    metaVersionRef.current++
    // No blob yet (first run): start from an empty shell so the change is not
    // dropped. The arrays always come from component state on save.
    setStorageData((current) => update(current ?? ({} as StorageData)))
    setIsDirty(true)
  }, [])

  const preferences = useMemo<ResolvedPreferences>(
    () => ({ ...DEFAULT_PREFERENCES, ...storageData?.preferences }),
    [storageData?.preferences],
  )

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    updateStorageMeta((current) => ({
      ...current,
      preferences: { ...current.preferences, ...patch, updatedAt: new Date().toISOString() },
    }))
  }, [updateStorageMeta])

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    updateStorageMeta((current) => ({
      ...current,
      profile: { ...current.profile, ...patch, updatedAt: new Date().toISOString() },
    }))
  }, [updateStorageMeta])

  /**
   * Settings → Reset account. The server wipes the account in one transaction
   * (lib/habits/account-reset.ts); here we adopt the fresh data — onboarding
   * takes over the screen — and drop what this device kept on the side.
   * Throws when the server refuses, leaving everything as it was.
   */
  const resetAccount = useCallback(async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    const response = await fetch("/api/account/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ confirm: "reset" }),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.data) throw new Error(result?.error ?? `Reset failed with status ${response.status}`)

    applyServerData(result.data)
    setIsDirty(false)
    setSaveFailed(false)
    setCachedLocally(false)
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && DEVICE_DATA_KEYS.some((prefix) => key.startsWith(prefix))) localStorage.removeItem(key)
      }
    } catch {
      // Storage blocked: nothing to clear.
    }
    // The server already deleted this device's push subscription; drop it in the browser too.
    try {
      const registration = await navigator.serviceWorker?.getRegistration()
      const subscription = await registration?.pushManager.getSubscription()
      await subscription?.unsubscribe()
    } catch {
      // No service worker or push: nothing to do.
    }
  }, [authHeaders, applyServerData])

  /** The arrays as they are right now, for undo. */
  const snapshot = useCallback((): TrackerSnapshot => ({
    habits: habitsRef.current,
    completions: completionsRef.current,
    todos: todosRef.current,
    projects: projectsRef.current,
    calendarEvents: calendarEventsRef.current,
  }), [])

  const restore = useCallback((snap: TrackerSnapshot) => {
    setHabits(snap.habits)
    setCompletions(snap.completions)
    setTodos(snap.todos)
    setProjects(snap.projects)
    setCalendarEvents(snap.calendarEvents)
    setIsDirty(true)
  }, [])

  return {
    habits, setHabits,
    completions, setCompletions,
    todos, setTodos,
    projects, setProjects,
    calendarEvents, setCalendarEvents,
    storageData, setStorageData,
    onboardingState, setOnboardingState,
    isLoading, isSaving, isDirty, saveFailed, cachedLocally,
    markDirty,
    habitsRef,
    projectTombstonesRef,
    preferences, updatePreferences,
    updateProfile, updateStorageMeta,
    snapshot, restore,
    resetAccount,
  }
}

export type TrackerData = ReturnType<typeof useTrackerData>
