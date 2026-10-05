"use client"

import { useState } from "react"
import type { Habit } from "@/lib/habits/types"
import { Button } from "@/components/habits/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

interface ScheduleEditorProps {
  habit: Habit
  onSave: (habitId: string, schedule: Habit["schedule"]) => void
  onClose: () => void
}

export function ScheduleEditor({ habit, onSave, onClose }: ScheduleEditorProps) {
  const t = useTranslations().habits.app.scheduleEditor
  const [scheduleType, setScheduleType] = useState<"daily" | "specific_days" | "times_per_week">(
    habit.schedule?.type || "daily",
  )
  const [selectedDays, setSelectedDays] = useState<number[]>(habit.schedule?.days || [])
  const [timesPerWeek, setTimesPerWeek] = useState<number>(habit.schedule?.timesPerWeek || 3)

  const dayNames = [0, 1, 2, 3, 4, 5, 6].map((value) => ({ name: t.dayNames[value], value }))

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()))
  }

  const handleSave = () => {
    let schedule: Habit["schedule"]

    if (scheduleType === "daily") {
      schedule = { type: "daily" }
    } else if (scheduleType === "specific_days") {
      schedule = { type: "specific_days", days: selectedDays }
    } else {
      schedule = { type: "times_per_week", timesPerWeek }
    }

    onSave(habit.id, schedule)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6 duration-200 animate-in zoom-in-95 slide-in-from-bottom-4">
          <h2 className="text-xl font-semibold text-foreground">{formatMessage(t.title, { name: habit.name })}</h2>
          <Button onClick={onClose} variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={t.close}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Schedule Type Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">{t.scheduleType}</label>
            <div className="grid gap-2">
              <button
                onClick={() => setScheduleType("daily")}
                className={cn(
                  "px-4 py-3 rounded-lg border-2 text-left transition-all",
                  scheduleType === "daily"
                    ? "border-primary bg-primary/10 text-foreground font-medium"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50",
                )}
              >
                <div className="font-medium">{t.daily}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.dailyHint}</div>
              </button>

              <button
                onClick={() => setScheduleType("specific_days")}
                className={cn(
                  "px-4 py-3 rounded-lg border-2 text-left transition-all",
                  scheduleType === "specific_days"
                    ? "border-primary bg-primary/10 text-foreground font-medium"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50",
                )}
              >
                <div className="font-medium">{t.specificDays}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.specificDaysHint}</div>
              </button>

              <button
                onClick={() => setScheduleType("times_per_week")}
                className={cn(
                  "px-4 py-3 rounded-lg border-2 text-left transition-all",
                  scheduleType === "times_per_week"
                    ? "border-primary bg-primary/10 text-foreground font-medium"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50",
                )}
              >
                <div className="font-medium">{t.timesPerWeek}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.timesPerWeekHint}</div>
              </button>
            </div>
          </div>

          {/* Specific Days Selector */}
          {scheduleType === "specific_days" && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">{t.selectDays}</label>
              <div className="grid grid-cols-2 gap-2">
                {dayNames.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                      selectedDays.includes(day.value)
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    {day.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Times Per Week Selector */}
          {scheduleType === "times_per_week" && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">{formatMessage(t.timesPerWeekValue, { count: timesPerWeek })}</label>
              <input
                type="range"
                min="1"
                max="7"
                value={timesPerWeek}
                onChange={(e) => setTimesPerWeek(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1x</span>
                <span>7x</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={onClose} variant="outline" className="flex-1">
            {t.cancel}
          </Button>
          <Button onClick={handleSave} className="flex-1">
            {t.save}
          </Button>
        </div>
      </div>
    </div>
  )
}
