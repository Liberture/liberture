"use client"

import { useMemo } from "react"
import { format } from "date-fns"

import { HabitDataEntryModal } from "@/components/habits/habit-data-entry-modal"
import { HabitReadingModal } from "@/components/habits/habit-reading-modal"
import { completedCountFor, selectPassage } from "@/lib/habits/reading-passages"
import type { Habit, HabitCompletion } from "@/lib/habits/types"

export interface LogTarget {
  kind: "data" | "reading"
  habitId: string
  date: Date
}

interface HabitLogModalsProps {
  target: LogTarget | null
  habits: Habit[]
  completions: HabitCompletion[]
  onClose: () => void
  onSave: (
    habitId: string,
    date: Date,
    data: Record<string, number | string> | undefined,
    markComplete: boolean,
    context?: string,
  ) => void
}

/**
 * The one copy of the data-entry and reading modals. The day view, the week
 * grid and the matrix all route a cell tap through the tracker, which sets the
 * target here — none of them render modals of their own any more.
 */
export function HabitLogModals({ target, habits, completions, onClose, onSave }: HabitLogModalsProps) {
  const habit = target ? habits.find((h) => h.id === target.habitId) : undefined

  const completion = useMemo(() => {
    if (!target) return undefined
    const dateStr = format(target.date, "yyyy-MM-dd")
    return completions.find((c) => c.habitId === target.habitId && c.date === dateStr)
  }, [target, completions])

  /**
   * Which passage to show. Derived from the date (and, in sequence mode, from
   * how many days are already done) rather than stored, so reopening the modal
   * shows the same text and nothing extra reaches the storage blob.
   */
  const passage = useMemo(() => {
    if (target?.kind !== "reading" || !habit?.readingContent) return undefined
    return selectPassage(habit.readingContent, format(target.date, "yyyy-MM-dd"), completedCountFor(habit.id, completions))
  }, [target, habit, completions])

  if (!target || !habit) return null

  if (target.kind === "reading") {
    if (!passage) return null
    return (
      <HabitReadingModal
        habit={habit}
        date={target.date}
        passage={passage}
        existingCompletion={completion}
        onSave={(result) => {
          // A reading habit records which passage was read, using the data map
          // that already exists rather than a new completion field.
          onSave(habit.id, target.date, { passageId: result.passageId }, result.markComplete, result.context)
          onClose()
        }}
        onClose={onClose}
      />
    )
  }

  return (
    <HabitDataEntryModal
      habit={habit}
      date={target.date}
      existingCompletion={completion}
      onSave={(result) => {
        onSave(habit.id, target.date, result.data, result.markComplete, result.context)
        onClose()
      }}
      onClose={onClose}
    />
  )
}
