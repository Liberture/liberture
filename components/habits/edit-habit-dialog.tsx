"use client"

import type { Habit, HabitCompletion } from "@/lib/habits/types"
import { HabitDialog } from "@/components/habits/habit-dialog"

interface EditHabitDialogProps {
  habit: Habit
  completions: HabitCompletion[]
  weekStartsOn: 0 | 1
  onSave: (habitId: string, updates: Partial<Habit>) => void
  onDelete: (habitId: string) => void
  onArchive?: (habitId: string) => void
  onUnarchive?: (habitId: string) => void
  onClose: () => void
}

export function EditHabitDialog({ habit, completions, weekStartsOn, onSave, onDelete, onArchive, onUnarchive, onClose }: EditHabitDialogProps) {
  return (
    <HabitDialog
      mode="edit"
      habit={habit}
      completions={completions}
      weekStartsOn={weekStartsOn}
      onUpdate={onSave}
      onDelete={onDelete}
      onArchive={onArchive}
      onUnarchive={onUnarchive}
      onClose={onClose}
    />
  )
}
