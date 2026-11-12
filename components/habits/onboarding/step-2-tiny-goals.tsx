"use client"

import { Button } from "@/components/habits/ui/button"
import { useTranslations } from "@/components/i18n/locale-provider"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { habitCategories } from "./habit-categories"
import type { Habit } from "@/lib/habits/types"

interface Step2TinyGoalsProps {
  category: (typeof habitCategories)[number]
  selected: Habit[]
  onToggle: (full: string, tiny: string, medium: string) => void
}

export function Step2TinyGoals({ category, selected, onToggle }: Step2TinyGoalsProps) {
  const app = useTranslations().habits.app
  const t = app.onboardingStep2
  const Icon = category.icon
  const categoryName = app.onboardingStep1.categories[category.id].name

  return (
    <section className="min-w-0 space-y-3 rounded-xl border border-border p-3">
      <div className="space-y-1 text-center">
        <div className="flex flex-col items-center gap-1 font-medium" style={{ color: category.color }}>
          <Icon aria-hidden="true" className="size-7" />
          {categoryName}
        </div>
      </div>
      <div className="mx-auto grid max-w-md gap-2" role="group" aria-label={categoryName}>
        {t.choices[category.id].map(({ full, tiny, medium }) => {
          const isChosen = selected.some(habit => habit.name === full)
          const muted = selected.length > 0 && !isChosen
          return (
            <Button key={full} variant="outline" aria-pressed={isChosen}
              className={cn("h-auto min-h-11 justify-start whitespace-normal py-3 text-left",
                muted && "text-xs font-normal text-muted-foreground")}
              style={isChosen ? { borderColor: category.color } : undefined}
              onClick={() => onToggle(full, tiny, medium)}>
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-muted-foreground"
                style={muted ? undefined : { backgroundColor: category.color }} />
              {full}
              {isChosen && <Check aria-hidden="true" className="ml-auto size-4" style={{ color: category.color }} />}
            </Button>
          )
        })}
      </div>
    </section>
  )
}
