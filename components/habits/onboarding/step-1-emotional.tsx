"use client"

import { useState } from "react"
import { Button } from "@/components/habits/ui/button"
import type { Habit } from "@/lib/habits/types"
import { Dumbbell, Book, Heart, Sunrise, Sparkles, Target } from "lucide-react"
import { useTranslations } from "@/components/i18n/locale-provider"

interface Step1EmotionalProps {
  initialSelection: string[]
  onNext: (habits: Habit[], story: string) => void
}

const baseCategories = [
  {
    id: "exercise",
    icon: Dumbbell,
    color: "#8B5CF6",
    exampleTime: "07:00"
  },
  {
    id: "reading",
    icon: Book,
    color: "#3B82F6",
    exampleTime: "20:00"
  },
  {
    id: "meditation",
    icon: Heart,
    color: "#10B981",
    exampleTime: "06:30"
  },
  {
    id: "health",
    icon: Sparkles,
    color: "#F59E0B",
    exampleTime: "08:00"
  },
  {
    id: "morning_routine",
    icon: Sunrise,
    color: "#EC4899",
    exampleTime: "06:00"
  },
  {
    id: "personal",
    icon: Target,
    color: "#6366F1",
    exampleTime: "09:00"
  }
]

export function Step1Emotional({ initialSelection, onNext }: Step1EmotionalProps) {
  const t = useTranslations().habits.app.onboardingStep1
  const categories = baseCategories.map((category) => ({
    ...category,
    ...t.categories[category.id as keyof typeof t.categories],
  }))
  const [selection, setSelection] = useState(initialSelection)

  const handleContinue = () => {
    const choices = selection.map(id => categories.find(category => category.id === id)!)
    if (!choices.length) return
    const now = new Date()
    onNext(choices.map(category => ({
      id: crypto.randomUUID(),
      name: category.exampleHabit,
      category: category.id,
      time: category.exampleTime,
      timeOfDay: category.exampleTime < "12:00" ? "morning" : category.exampleTime < "17:00" ? "afternoon" : "evening",
      color: category.color,
      schedule: { type: "daily" },
      priority: 5,
      createdAt: now.toISOString(),
      startDate: now.toLocaleDateString("en-CA"),
    })), choices[0].story)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {categories.map(({ id, name, icon: Icon, color }) => {
          const selected = selection.includes(id)
          return (
            <button key={id} type="button" aria-pressed={selected}
              onClick={() => setSelection(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id])}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 font-medium aria-pressed:ring-2 aria-pressed:ring-primary">
              <Icon className="h-6 w-6" style={{ color }} />
              {name}
            </button>
          )
        })}
      </div>
      <div className="text-center">
        <Button type="button" disabled={!selection.length} onClick={handleContinue}>{t.continue}</Button>
      </div>
    </div>
  )
}
