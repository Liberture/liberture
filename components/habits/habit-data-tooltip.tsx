"use client"

import type { ReactElement } from "react"
import { HelpTooltip } from "@/components/ui/tooltip"
import type { HabitCompletion, Habit } from "@/lib/habits/types"

interface HabitDataTooltipProps {
  completion: HabitCompletion
  habit: Habit
  children: ReactElement
}

export function HabitDataTooltip({ completion, habit, children }: HabitDataTooltipProps) {

  const hasData = completion.data && Object.keys(completion.data).length > 0
  const fields = habit.dataEntry?.fields || []

  if (!hasData) {
    return <>{children}</>
  }

  return (
    <HelpTooltip label={
      <div className="min-w-40 max-w-60 space-y-1">
        {fields.map(field => {
          const value = completion.data?.[field.id]
          if (value === undefined) return null
          return (
            <div key={field.id} className="text-xs">
              <span className="font-medium">{field.label}: </span>
              {value} {field.type === "number" && field.unit}
            </div>
          )
        })}
      </div>
    }>
      {children}
    </HelpTooltip>
  )
}
