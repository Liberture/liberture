"use client"

import type { Habit } from "@/lib/habits/types"
import { HabitDialog } from "@/components/habits/habit-dialog"

interface AddHabitDialogProps {
  onSave: (habitData: Partial<Habit>) => void
  onClose: () => void
}

export function AddHabitDialog({ onSave, onClose }: AddHabitDialogProps) {
  return <HabitDialog mode="create" onCreate={onSave} onClose={onClose} />
}
