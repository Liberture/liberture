"use client"

import { Card } from "@/components/habits/ui/card"
import { Button } from "@/components/habits/ui/button"
import { Sun, TrendingUp, Clock } from "lucide-react"
import { Habit, HabitCompletion } from "@/lib/habits/types"
import { format } from "date-fns"
import { useDateLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

interface MiddayCheckinProps {
  habits: Habit[]
  completions: HabitCompletion[]
  onComplete: (habitId: string) => void
  onRemindLater: () => void
  onDismiss: () => void
}

export function MiddayCheckin({
  habits,
  completions,
  onComplete,
  onRemindLater,
  onDismiss
}: MiddayCheckinProps) {
  const t = useTranslations().habits.app.middayCheckin
  const dateLocale = useDateLocale()
  const today = format(new Date(),"yyyy-MM-dd")
  const todayCompletions = completions.filter(c => c.date === today && c.completed)

  const activeHabits = habits.filter(h => !h.archived)
  const completedCount = todayCompletions.length
  const totalCount = activeHabits.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // Find next pending habit (prioritize by priority, then time)
  const pendingHabits = activeHabits
    .filter(h => !todayCompletions.some(c => c.habitId === h.id))
    .sort((a, b) => {
      // Sort by priority first
      const priorityDiff = (b.priority || 3) - (a.priority || 3)
      if (priorityDiff !== 0) return priorityDiff

      // Then by time
      return a.time.localeCompare(b.time)
    })

  const nextHabit = pendingHabits[0]

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <Card className="w-96 shadow-2xl border-2 border-work/30">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-work/10 rounded-full">
              <Sun className="h-5 w-5 text-work" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {t.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(),"h:mm a", { locale: dateLocale })}
              </p>
            </div>
            <button
              onClick={onDismiss}
              aria-label={t.dismissAriaLabel}
              className="text-muted-foreground hover:text-muted-foreground"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t.todaysProgress}</span>
              <span className="font-semibold text-foreground">
                {completedCount} / {totalCount}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-work to-nutrition transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Status Message */}
          {completedCount === 0 ? (
            <Card className="p-3 bg-exercise/10 border-exercise/30">
              <p className="text-sm text-exercise">
                {t.noneYet}
              </p>
            </Card>
          ) : progressPercent === 100 ? (
            <Card className="p-3 bg-nutrition/10 border-nutrition/30">
              <p className="text-sm text-nutrition font-semibold">
                {t.allDone}
              </p>
            </Card>
          ) : progressPercent >= 50 ? (
            <Card className="p-3 bg-work/10 border-work/30">
              <p className="text-sm text-work">
                <TrendingUp className="h-4 w-4 inline mr-1" />
                {t.overHalfway}
              </p>
            </Card>
          ) : (
            <Card className="p-3 bg-exercise/10 border-exercise/30">
              <p className="text-sm text-exercise">
                {t.keepGoing}
              </p>
            </Card>
          )}

          {/* Next Habit */}
          {nextHabit && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t.upNext}
              </p>
              <Card className="p-3 bg-gradient-to-r from-primary/10 to-work/10 border-0">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: nextHabit.color }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {nextHabit.name}
                    </p>
                    {nextHabit.implementationIntention && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatMessage(t.intention, { trigger: nextHabit.implementationIntention.trigger, behavior: nextHabit.implementationIntention.behavior })}
                      </p>
                    )}
                  </div>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2 pt-2">
            {nextHabit && (
              <Button
                onClick={() => onComplete(nextHabit.id)}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {t.iDidIt}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onRemindLater}
              className="flex-1"
            >
              {t.remindLater}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
