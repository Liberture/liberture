"use client"

import type { Habit } from "@/lib/habits/types"
import { HabitDialog } from "@/components/habits/habit-dialog"

interface EditHabitDialogProps {
  habit: Habit
  onSave: (habitId: string, updates: Partial<Habit>) => void
  onDelete: (habitId: string) => void
  onArchive?: (habitId: string) => void
  onUnarchive?: (habitId: string) => void
  onClose: () => void
}

export function EditHabitDialog({ habit, onSave, onDelete, onArchive, onUnarchive, onClose }: EditHabitDialogProps) {
  return (
    <HabitDialog
      mode="edit"
      habit={habit}
      onUpdate={onSave}
      onDelete={onDelete}
      onArchive={onArchive}
      onUnarchive={onUnarchive}
      onClose={onClose}
    />
  )
}
