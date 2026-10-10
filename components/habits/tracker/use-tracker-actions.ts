"use client"

import { useCallback, useRef } from "react"
import { format } from "date-fns"

import type { CalendarEvent, CoachRecommendationEntry, CoachRecommendationSet, Habit, HabitCompletion, OnboardingState, Project, StorageData, Todo } from "@/lib/habits/types"
import type { CatalogHabit, CatalogProtocol } from "@/lib/habits/protocols/catalog"
import { adoptProtocol, catalogHabitToHabit } from "@/lib/habits/protocols/adopt"
import { customRecommendationToHabit, type CustomHabitSpec } from "@/lib/habits/agent/recommendation"
import { inferTimeOfDay } from "@/lib/habits/habit-utils"
import { carryResponses, markAccepted, respondInSet, suggestionKey, type SuggestionResponse } from "@/lib/habits/coach/suggestions"
import { getCompletionCelebration } from "@/lib/habits/motivational-messages"
import { mergeProjectTombstones } from "@/lib/habits/project-sync"
import { mergeTodoTombstones } from "@/lib/habits/todo-sync"
import { mergeCalendarEventTombstones } from "@/lib/habits/calendar-sync"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"
import { notify } from "@/components/habits/ui/toast"
import type { TrackerData } from "@/components/habits/tracker/use-tracker-data"

/** A catalog habit is a duplicate when an active habit already carries its slug. */
function sameCatalogSlug(existing: Habit[], candidate: Habit): boolean {
  return Boolean(candidate.catalogSlug) && existing.some((h) => !h.archived && h.catalogSlug === candidate.catalogSlug)
}

/**
 * Every write the tracker UI makes. Moved out of habit-tracker.tsx; the
 * mutations are unchanged apart from the undo toasts on the destructive ones
 * (delete, archive, unarchive, adopt, import, clear-all), each of which
 * snapshots exactly what it touches and puts it back on Undo.
 */
export function useTrackerActions(data: TrackerData) {
  const app = useTranslations().habits.app
  const t = app.habitTracker
  const common = app.common
  const {
    habits, setHabits,
    completions, setCompletions,
    todos, setTodos,
    projects, setProjects,
    calendarEvents, setCalendarEvents,
    storageData, setStorageData,
    setOnboardingState,
    markDirty,
    habitsRef,
    projectTombstonesRef,
    snapshot, restore,
    updateStorageMeta,
  } = data

  /** Completion toast. Polite, and out of the way of the bottom nav. */
  const showCelebration = useCallback((message: string) => {
    notify.success(message)
  }, [])

  const celebrate = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId)
    if (!habit) return
    const streak = habit.streakData?.current || 0
    showCelebration(getCompletionCelebration(habit, streak + 1))
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
      completedAt: new Date().toISOString(),
    }
    setCompletions([firstCompletion])

    // Update onboarding state
    setOnboardingState({ ...onboarding, completed: true })
    markDirty()
  }

  const handleOnboardingSkip = () => {
    // Mark onboarding as completed/skipped
    setOnboardingState({
      completed: true,
      currentStep: 5,
      skipped: true,
    })
    markDirty()
  }

  /** The dialog requires a name; there is no "New Habit" fallback any more. */
  const addHabit = (habitData: Partial<Habit>) => {
    const name = habitData.name?.trim()
    if (!name) return
    const time = habitData.time || "08:00"
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name,
      ...(habitData.description ? { description: habitData.description } : {}),
      time,
      color: habitData.color || "#6366f1",
      schedule: habitData.schedule || { type: "daily" },
      tags: habitData.tags || [],
      implementationIntention: habitData.implementationIntention,
      randomRemindersEnabled: habitData.randomRemindersEnabled ?? false,
      timeOfDay: habitData.timeOfDay ?? inferTimeOfDay(time),
      ...(habitData.dataEntry ? { dataEntry: habitData.dataEntry } : {}),
      createdAt: new Date().toISOString(),
      // This device's calendar day: createdAt is UTC, and on the (UTC) server
      // a habit added in the evening would otherwise start tomorrow.
      startDate: format(new Date(), "yyyy-MM-dd"),
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
    markDirty()
  }

  /**
   * Delete a habit and its history. Undo puts both back exactly where they
   * were, merged into whatever changed in the meantime.
   */
  const deleteHabitById = useCallback((habitId: string) => {
    const habit = habitsRef.current.find((h) => h.id === habitId)
    if (!habit) return
    const index = habitsRef.current.indexOf(habit)
    const removedCompletions = snapshot().completions.filter((c) => c.habitId === habitId)
    setHabits((current) => current.filter((h) => h.id !== habitId))
    setCompletions((current) => current.filter((c) => c.habitId !== habitId))
    markDirty()
    notify.undo(formatMessage(common.habitDeleted, { name: habit.name }), common.undo, () => {
      setHabits((current) => {
        if (current.some((h) => h.id === habitId)) return current
        const next = [...current]
        next.splice(Math.min(index, next.length), 0, habit)
        return next
      })
      setCompletions((current) => [...current.filter((c) => c.habitId !== habitId), ...removedCompletions])
      markDirty()
    })
  }, [common, habitsRef, markDirty, setCompletions, setHabits, snapshot])

  /** Put one habit back to how it was before an archive/unarchive. */
  const restoreHabit = useCallback((previous: Habit) => {
    setHabits((current) => current.map((h) => (h.id === previous.id ? previous : h)))
    markDirty()
  }, [markDirty, setHabits])

  const archiveHabit = (habitId: string) => {
    const previous = habits.find((h) => h.id === habitId)
    const now = new Date().toISOString()
    setHabits(habits.map((h) => {
      if (h.id !== habitId) return h
      const history = h.archiveHistory ? [...h.archiveHistory] : []
      const lastOpen = history.length > 0 && !history[history.length - 1].unarchivedAt
      if (!lastOpen) history.push({ archivedAt: now })
      return { ...h, archived: true, archivedAt: now, archiveHistory: history }
    }))
    markDirty()
    if (previous) {
      notify.undo(formatMessage(common.habitArchived, { name: previous.name }), common.undo, () => restoreHabit(previous))
    }
  }

  const unarchiveHabit = (habitId: string) => {
    const previous = habits.find((h) => h.id === habitId)
    const now = new Date().toISOString()
    setHabits(habits.map((h) => {
      if (h.id !== habitId) return h
      const history = h.archiveHistory ? [...h.archiveHistory] : []
      if (history.length > 0 && !history[history.length - 1].unarchivedAt) {
        history[history.length - 1] = { ...history[history.length - 1], unarchivedAt: now }
      }
      return { ...h, archived: false, archivedAt: undefined, archiveHistory: history }
    }))
    markDirty()
    if (previous) {
      notify.undo(formatMessage(common.habitRestored, { name: previous.name }), common.undo, () => restoreHabit(previous))
    }
  }

  const saveHabitData = (
    habitId: string,
    date: Date,
    entry: Record<string, number | string> | undefined,
    markComplete: boolean,
    // A note on the check-in (reading reflections and data-entry notes).
    // Reuses the completion field that already existed rather than adding one,
    // which is part of how this stays inside schemaVersion 7.
    context?: string,
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
                data: entry,
                context: context ?? c.context,
              }
            : c,
        ),
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
          data: entry,
          context: context || undefined,
        },
      ])
    }

    // Show celebration toast when marking complete
    const wasAlreadyCompleted = existing?.completed || false
    if (markComplete && !wasAlreadyCompleted) celebrate(habitId)

    markDirty()
  }

  const toggleCompletion = (habitId: string, date: Date, entry?: Record<string, number | string>) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const existing = completions.find((c) => c.habitId === habitId && c.date === dateStr)

    let willBeCompleted = false
    if (existing) {
      if (entry !== undefined) {
        // Update existing entry with new data
        setCompletions(
          completions.map((c) =>
            c.habitId === habitId && c.date === dateStr
              ? { ...c, data: { ...c.data, ...entry } }
              : c,
          ),
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
              : c,
          ),
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
          data: entry,
        },
      ])
    }

    // Show celebration toast when a habit is marked complete
    if (willBeCompleted) celebrate(habitId)

    markDirty()
  }

  /** Create a todo from a whole draft, keeping every field the dialog set (subtasks included). */
  const createTodo = (draft: Partial<Todo>) => {
    const title = draft.title?.trim()
    if (!title) return
    const now = new Date().toISOString()
    const status = draft.status || "incomplete"
    const newTodo: Todo = {
      ...draft,
      id: Date.now().toString(),
      title,
      priority: draft.priority ?? 3,
      status,
      createdAt: now,
      updatedAt: now,
      completedAt: status === "completed" ? now : undefined,
      canTopolinoHelp: draft.canTopolinoHelp ?? false,
    }
    setTodos([...todos, newTodo])
    markDirty()
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
    createTodo({
      title, dueDate, dueTime, priority, description, status, canTopolinoHelp,
      projectId, estimatedMinutes, energyLevel, tags, notes,
    })
  }

  /** The calendar's and todo list's dialogs hand back a whole `Partial<Todo>`. */
  const createTodoFromCalendar = createTodo

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
    markDirty()
    return newProject
  }, [projects, setProjects, markDirty])

  const updateProject = useCallback((id: string, updates: Pick<Project, "name" | "color">) => {
    const name = updates.name.trim()
    if (!name) return
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === id ? { ...project, name, color: updates.color || undefined, updatedAt: new Date().toISOString() } : project,
      ),
    )
    markDirty()
  }, [setProjects, markDirty])

  const recordProjectTombstone = useCallback((id: string, deletedAt: string) => {
    projectTombstonesRef.current = mergeProjectTombstones(projectTombstonesRef.current, { [id]: deletedAt })
    setStorageData((prev) =>
      prev
        ? {
            ...prev,
            projectTombstones: mergeProjectTombstones(prev.projectTombstones, { [id]: deletedAt }),
          }
        : prev,
    )
  }, [projectTombstonesRef, setStorageData])

  const deleteProject = useCallback((id: string) => {
    const now = new Date().toISOString()
    recordProjectTombstone(id, now)
    setProjects((currentProjects) => currentProjects.filter((project) => project.id !== id))
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.projectId === id ? { ...todo, projectId: undefined, updatedAt: now } : todo,
      ),
    )
    markDirty()
  }, [recordProjectTombstone, setProjects, setTodos, markDirty])

  const toggleTodoComplete = (id: string) => {
    const now = new Date().toISOString()
    setTodos(
      todos.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "completed" ? "incomplete" : "completed",
              completedAt: item.status !== "completed" ? now : undefined,
              updatedAt: now,
            }
          : item,
      ),
    )
    markDirty()
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
    setTodos(todos.filter((item) => item.id !== id))
    markDirty()
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
    markDirty()
  }

  /** Edit an event in place, keeping its id (and so its links). */
  const updateCalendarEvent = (id: string, updates: Partial<Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">>) => {
    const now = new Date().toISOString()
    setCalendarEvents(calendarEvents.map((event) => (event.id === id ? { ...event, ...updates, updatedAt: now } : event)))
    markDirty()
  }

  /**
   * Put a todo on the calendar: a time block linked back to it (todoId), the
   * same shape POST /api/v1/todos/:id/schedule creates.
   */
  const scheduleTodo = (todoId: string, startsAt: string, durationMinutes?: number) => {
    const todo = todos.find((item) => item.id === todoId)
    const start = new Date(startsAt)
    if (!todo || Number.isNaN(start.getTime())) return
    const minutes = durationMinutes && durationMinutes > 0 ? durationMinutes : todo.estimatedMinutes || 60
    addCalendarEvent({
      title: todo.title,
      startsAt: start.toISOString(),
      endsAt: new Date(start.getTime() + minutes * 60_000).toISOString(),
      notes: todo.notes || todo.description,
      tags: todo.tags ?? [],
      todoId: todo.id,
    })
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
    markDirty()
  }

  const exportData = () => {
    const backedUpAt = new Date().toISOString()
    // The whole account, not just the arrays: tombstones keep deletions from
    // resurrecting on re-import, and profile/preferences/onboarding are part of
    // what a restore should bring back.
    const exported: StorageData = {
      habits,
      completions,
      todos,
      projects,
      projectTombstones: storageData?.projectTombstones ?? {},
      todoTombstones: storageData?.todoTombstones ?? {},
      calendarEvents,
      calendarEventTombstones: storageData?.calendarEventTombstones ?? {},
      ...(storageData?.profile ? { profile: storageData.profile } : {}),
      ...(storageData?.preferences ? { preferences: storageData.preferences } : {}),
      ...(storageData?.onboarding ? { onboarding: storageData.onboarding } : {}),
      ...(storageData?.coachRecommendations ? { coachRecommendations: storageData.coachRecommendations } : {}),
      lastUpdated: new Date().toISOString(),
      lastBackupAt: backedUpAt,
      schemaVersion: 7,
    }
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" })
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
    updateStorageMeta((current) => ({ ...current, lastBackupAt: backedUpAt }))
  }

  /**
   * Apply a backup the Data tab has already parsed and the user confirmed.
   * Replaces the lists the backup carries; Undo restores the previous ones.
   */
  const importData = (backup: Partial<StorageData>) => {
    const before = snapshot()
    if (Array.isArray(backup.habits)) setHabits(backup.habits)
    if (Array.isArray(backup.completions)) setCompletions(backup.completions)
    if (Array.isArray(backup.todos)) setTodos(backup.todos)
    if (Array.isArray(backup.projects)) setProjects(backup.projects)
    if (Array.isArray(backup.calendarEvents)) setCalendarEvents(backup.calendarEvents)
    markDirty()
    notify.undo(common.dataImported, common.undo, () => restore(before))
  }

  const updateHabit = (habitId: string, updates: Partial<Habit>) => {
    setHabits(habits.map((h) => (h.id === habitId ? { ...h, ...updates } : h)))
    markDirty()
  }

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    const now = new Date().toISOString()
    setTodos(
      todos.map((item) => {
        if (item.id !== id) return item
        const next = { ...item, ...updates, updatedAt: now }
        if (next.status === "completed" && !next.completedAt) next.completedAt = now
        if (next.status !== "completed") next.completedAt = undefined
        return next
      }),
    )
    markDirty()
  }

  /** Settings → Reset account. Can't be undone: the server deleted everything. */
  const resetAccount = async (): Promise<boolean> => {
    try {
      await data.resetAccount()
      notify.success(common.accountReset)
      return true
    } catch (error) {
      console.error("Account reset failed:", error)
      notify.error(common.accountResetFailed)
      return false
    }
  }

  /**
   * Add catalog/coach habits, skipping ones already tracked, and say exactly
   * what happened: all added, some skipped as duplicates, or nothing new.
   */
  const adoptHabits = useCallback((label: string, candidates: Habit[], isDuplicate: (existing: Habit[], candidate: Habit) => boolean) => {
    const current = habitsRef.current
    const fresh: Habit[] = []
    for (const candidate of candidates) {
      if (!isDuplicate([...current, ...fresh], candidate)) fresh.push(candidate)
    }
    const skipped = candidates.length - fresh.length
    if (fresh.length === 0) {
      notify.info(formatMessage(t.alreadyAdded, { name: label }))
      return
    }
    const startDate = format(new Date(), "yyyy-MM-dd")
    for (let i = 0; i < fresh.length; i++) if (!fresh[i].startDate) fresh[i] = { ...fresh[i], startDate }
    const freshIds = new Set(fresh.map((h) => h.id))
    setHabits((list) => [...list, ...fresh.filter((h) => !list.some((existing) => existing.id === h.id))])
    markDirty()
    const message = skipped > 0
      ? formatMessage(t.addedPartial, { name: label, added: fresh.length, skipped })
      : formatMessage(t.added, { name: label })
    notify.undo(message, common.undo, () => {
      setHabits((list) => list.filter((h) => !freshIds.has(h.id)))
      markDirty()
    })
  }, [common, habitsRef, markDirty, setHabits, t])

  /**
   * Marketplace adoption. Catalog entries become plain habits, so nothing here
   * touches the storage schema — see lib/protocols/adopt.ts.
   */
  /** Adopting something the coach suggested answers that suggestion: accepted. */
  const acceptSuggestion = useCallback((match: { slugs?: string[]; names?: string[] }) => {
    updateStorageMeta((current) => {
      const next = markAccepted(current.coachRecommendations, match)
      return next === current.coachRecommendations ? current : { ...current, coachRecommendations: next }
    })
  }, [updateStorageMeta])

  const adoptCatalogProtocol = useCallback((protocol: CatalogProtocol) => {
    // Skip anything already tracked so re-adding a protocol tops it up
    // instead of creating duplicates.
    adoptHabits(protocol.name, adoptProtocol(protocol), sameCatalogSlug)
    acceptSuggestion({ slugs: [protocol.slug] })
  }, [adoptHabits, acceptSuggestion])

  const adoptCatalogHabit = useCallback((entry: CatalogHabit) => {
    adoptHabits(entry.name, [catalogHabitToHabit(entry)], sameCatalogSlug)
    acceptSuggestion({ slugs: [entry.slug] })
  }, [adoptHabits, acceptSuggestion])

  /**
   * A habit the coach invented rather than found in the catalog. It has no
   * slug to dedupe on, so the guard is the name — the realistic mistake is
   * clicking Add twice on the same card, not two coincidentally identical
   * suggestions.
   */
  const adoptCustomHabit = useCallback((spec: CustomHabitSpec) => {
    adoptHabits(spec.name, [customRecommendationToHabit(spec)], (existing, candidate) =>
      existing.some((h) => !h.archived && h.name.trim().toLowerCase() === candidate.name.trim().toLowerCase()),
    )
    acceptSuggestion({ names: [spec.name] })
  }, [adoptHabits, acceptSuggestion])

  /**
   * Keep the coach's latest suggestions in the storage blob so
   * GET /api/v1/coach/recommendations can serve them to a CLI after the chat is
   * closed. Only the last set is kept — this answers "what was I just told",
   * not "what have I ever been told". Rides the normal autosave.
   */
  const recordCoachRecommendations = useCallback((set: CoachRecommendationSet) => {
    // A suggestion the user already dismissed or snoozed stays that way when
    // the coach brings it up again.
    updateStorageMeta((current) => ({ ...current, coachRecommendations: carryResponses(set, current.coachRecommendations) }))
  }, [updateStorageMeta])

  /**
   * Dismiss or snooze (7 days) a coach suggestion: by index in the stored set,
   * by slug or custom name, or as the entry itself. A card from an older
   * reply that is no longer in the stored set is appended with its answer,
   * so it stays hidden. Saved with the blob, so get_recommendations and
   * get_coach_state see it too.
   */
  const respondToSuggestion = useCallback((suggestion: number | string | CoachRecommendationEntry, response: SuggestionResponse) => {
    updateStorageMeta((current) => {
      const set = current.coachRecommendations ?? { generatedAt: new Date().toISOString(), question: "", entries: [] }
      const key = typeof suggestion === "object" ? suggestionKey(suggestion) : suggestion
      const index = typeof suggestion === "number"
        ? suggestion
        : set.entries.findIndex((entry) => suggestionKey(entry) === key || entry.slug === key)
      if (index < 0) {
        if (typeof suggestion !== "object") return current
        const appended = { ...set, entries: [...set.entries, suggestion] }
        return { ...current, coachRecommendations: respondInSet(appended, appended.entries.length - 1, response) }
      }
      const next = respondInSet(set, index, response)
      return next === set ? current : { ...current, coachRecommendations: next }
    })
  }, [updateStorageMeta])

  // Stable identity for the memoised day rows; toggleCompletion itself is
  // redefined each render, so it is reached through a ref.
  const toggleCompletionRef = useRef(toggleCompletion)
  toggleCompletionRef.current = toggleCompletion
  const toggleCompletionForDay = useCallback(
    (habitId: string, date: Date) => toggleCompletionRef.current(habitId, date),
    [],
  )

  return {
    showCelebration,
    handleOnboardingComplete,
    handleOnboardingSkip,
    addHabit,
    deleteHabitById,
    archiveHabit,
    unarchiveHabit,
    saveHabitData,
    toggleCompletion,
    toggleCompletionForDay,
    addTodo,
    createTodo,
    createTodoFromCalendar,
    addProject,
    updateProject,
    deleteProject,
    toggleTodoComplete,
    removeTodo,
    addCalendarEvent,
    scheduleTodo,
    removeCalendarEvent,
    updateCalendarEvent,
    exportData,
    importData,
    updateHabit,
    updateTodo,
    resetAccount,
    adoptCatalogProtocol,
    adoptCatalogHabit,
    adoptCustomHabit,
    recordCoachRecommendations,
    respondToSuggestion,
  }
}
