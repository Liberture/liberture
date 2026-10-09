"use client"

import type { Habit } from "@/lib/habits/types"
import { HabitDialog } from "@/components/habits/habit-dialog"

interface AddHabitDialogProps {
  onSave: (habitData: Partial<Habit>) => void
  onClose: () => void
  /** HH:MM pre-filled for the new habit (preferences.defaultReminderTime). */
  defaultTime?: string
}

export function AddHabitDialog({ onSave, onClose, defaultTime }: AddHabitDialogProps) {
  return <HabitDialog mode="create" onCreate={onSave} onClose={onClose} defaultTime={defaultTime} />
}
