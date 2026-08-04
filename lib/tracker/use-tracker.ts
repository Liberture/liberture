"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import type { PillarId } from "@/lib/translations"
import { findProtocol } from "./catalog"
import { loadState, saveState, clearState } from "./storage"
import { dateKey, inferTimeOfDay, summarize } from "./streaks"
import { EMPTY_STATE, type CatalogHabit, type Habit, type TrackerState } from "./types"

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `h_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

function toHabit(source: CatalogHabit, protocolSlug?: string): Habit {
  return {
    id: makeId(),
    name: source.name,
    why: source.why,
    pillar: source.pillar,
    time: source.time,
    schedule: source.schedule,
    difficulty: source.difficulty,
    timeOfDay: inferTimeOfDay(source.time),
    protocolSlug,
    sourceSlug: source.slug,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Single owner of tracker state. Reads localStorage after mount (never during
 * render) so server and client markup agree, then writes back on every change.
 */
export function useTracker() {
  const [state, setState] = useState<TrackerState>(EMPTY_STATE)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setState(loadState())
    setHydrated(true)
  }, [])

  // Persist only after the initial read, so we never overwrite saved data with EMPTY_STATE.
  useEffect(() => {
    if (!hydrated) return
    saveState(state)
  }, [state, hydrated])

  const update = useCallback((fn: (prev: TrackerState) => TrackerState) => {
    setState(fn)
  }, [])

  const addHabits = useCallback(
    (sources: CatalogHabit[], protocolSlug?: string) => {
      update((prev) => {
        // Adopting the same catalog entry twice would create duplicate rows in Today.
        const taken = new Set(prev.habits.map((h) => h.sourceSlug).filter(Boolean))
        const fresh = sources.filter((s) => !taken.has(s.slug)).map((s) => toHabit(s, protocolSlug))
        if (fresh.length === 0) return prev
        return { ...prev, habits: [...prev.habits, ...fresh] }
      })
    },
    [update],
  )

  const adoptProtocol = useCallback(
    (slug: string) => {
      const protocol = findProtocol(slug)
      if (!protocol) return
      update((prev) => {
        const taken = new Set(prev.habits.map((h) => h.sourceSlug).filter(Boolean))
        const fresh = protocol.habits
          .filter((h) => !taken.has(h.slug))
          .map((h) => toHabit(h, slug))
        return {
          ...prev,
          habits: [...prev.habits, ...fresh],
          adoptedProtocols: prev.adoptedProtocols.includes(slug)
            ? prev.adoptedProtocols
            : [...prev.adoptedProtocols, slug],
        }
      })
    },
    [update],
  )

  const dropProtocol = useCallback(
    (slug: string) => {
      update((prev) => ({
        ...prev,
        habits: prev.habits.filter((h) => h.protocolSlug !== slug),
        adoptedProtocols: prev.adoptedProtocols.filter((s) => s !== slug),
      }))
    },
    [update],
  )

  const removeHabit = useCallback(
    (habitId: string) => {
      update((prev) => ({
        ...prev,
        habits: prev.habits.filter((h) => h.id !== habitId),
        completions: prev.completions.filter((c) => c.habitId !== habitId),
      }))
    },
    [update],
  )

  const updateHabit = useCallback(
    (habitId: string, patch: Partial<Habit>) => {
      update((prev) => ({
        ...prev,
        habits: prev.habits.map((h) =>
          h.id === habitId
            ? { ...h, ...patch, timeOfDay: patch.time ? inferTimeOfDay(patch.time) : h.timeOfDay }
            : h,
        ),
      }))
    },
    [update],
  )

  const toggleCompletion = useCallback(
    (habitId: string, date: Date = new Date()) => {
      const key = dateKey(date)
      update((prev) => {
        const exists = prev.completions.some((c) => c.habitId === habitId && c.date === key)
        return {
          ...prev,
          completions: exists
            ? prev.completions.filter((c) => !(c.habitId === habitId && c.date === key))
            : [...prev.completions, { habitId, date: key, completedAt: new Date().toISOString() }],
        }
      })
    },
    [update],
  )

  const isCompleted = useCallback(
    (habitId: string, date: Date = new Date()) => {
      const key = dateKey(date)
      return state.completions.some((c) => c.habitId === habitId && c.date === key)
    },
    [state.completions],
  )

  const setFocusPillars = useCallback(
    (pillars: PillarId[]) => update((prev) => ({ ...prev, focusPillars: pillars })),
    [update],
  )

  const completeOnboarding = useCallback(
    (displayName?: string) =>
      update((prev) => ({
        ...prev,
        onboarded: true,
        displayName: displayName?.trim() || prev.displayName,
        createdAt: prev.createdAt ?? new Date().toISOString(),
      })),
    [update],
  )

  const reset = useCallback(() => {
    clearState()
    setState(EMPTY_STATE)
  }, [])

  const replaceState = useCallback((next: TrackerState) => setState(next), [])

  const stats = useMemo(() => {
    const active = state.habits.filter((h) => !h.archived)
    const summaries = active.map((h) => summarize(h, state.completions))
    const bestStreak = summaries.reduce((max, s) => Math.max(max, s.longest), 0)
    const currentBest = summaries.reduce((max, s) => Math.max(max, s.current), 0)
    const avg7 =
      summaries.length === 0
        ? 0
        : Math.round(summaries.reduce((sum, s) => sum + s.rate7, 0) / summaries.length)
    return {
      habitCount: active.length,
      protocolCount: state.adoptedProtocols.length,
      totalCompletions: state.completions.length,
      bestStreak,
      currentBest,
      avg7,
    }
  }, [state.habits, state.completions, state.adoptedProtocols])

  return {
    state,
    hydrated,
    stats,
    addHabits,
    adoptProtocol,
    dropProtocol,
    removeHabit,
    updateHabit,
    toggleCompletion,
    isCompleted,
    setFocusPillars,
    completeOnboarding,
    reset,
    replaceState,
  }
}
