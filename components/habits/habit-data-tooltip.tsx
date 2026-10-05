"use client"

import { useState } from "react"
import type { HabitCompletion, Habit } from "@/lib/habits/types"
import { cn } from "@/lib/utils"

interface HabitDataTooltipProps {
  completion: HabitCompletion
  habit: Habit
  children: React.ReactNode
}

export function HabitDataTooltip({ completion, habit, children }: HabitDataTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const hasData = completion.data && Object.keys(completion.data).length > 0
  const fields = habit.dataEntry?.fields || []

  if (!hasData) {
    return <>{children}</>
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 min-w-[160px] max-w-[240px]">
            <div className="space-y-1">
              {fields.map((field) => {
                const value = completion.data?.[field.id]
                if (value === undefined) return null
                
                return (
                  <div key={field.id} className="text-xs">
                    <span className="font-medium text-foreground">
                      {field.label}:
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {value} {field.type === "number" && field.unit ? field.unit : ""}
                    </span>
                  </div>
                )
              })}
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-border" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-popover" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
