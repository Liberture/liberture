"use client"

import { useState, useEffect } from "react"
import type { Habit, HabitCompletion } from "@/lib/habits/types"
import { Button } from "@/components/habits/ui/button"
import { ModalPortal } from "@/components/habits/ui/modal-portal"
import { Input } from "@/components/habits/ui/input"
import { X, Check, Target } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useTranslations, useDateLocale } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

interface HabitDataEntryModalProps {
  habit: Habit
  date: Date
  existingCompletion?: HabitCompletion
  onSave: (result: { data?: Record<string, number | string>; markComplete: boolean }) => void
  onClose: () => void
}

export function HabitDataEntryModal({
  habit,
  date,
  existingCompletion,
  onSave,
  onClose,
}: HabitDataEntryModalProps) {
  const t = useTranslations().habits.app.habitDataEntryModal
  const dateLocale = useDateLocale()
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    if (existingCompletion?.data) {
      Object.entries(existingCompletion.data).forEach(([key, value]) => {
        initial[key] = value?.toString() || ""
      })
    }
    return initial
  })
  const [markComplete, setMarkComplete] = useState<boolean>(existingCompletion?.completed || false)

  const dataEntryConfig = habit.dataEntry
  const fields = dataEntryConfig?.fields || []

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [onClose])

  const handleSave = () => {
    const data: Record<string, number | string> = {}

    fields.forEach((field) => {
      const value = fieldValues[field.id]
      if (value && value.trim()) {
        if (field.type === "number") {
          data[field.id] = parseFloat(value)
        } else {
          data[field.id] = value.trim()
        }
      }
    })

    onSave({ 
      ...Object.keys(data).length > 0 ? { data } : {},
      markComplete 
    } as any)
    onClose()
  }

  const handleQuickComplete = () => {
    onSave({ markComplete: true })
    onClose()
  }

  return (
    <ModalPortal>
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="border-b border-border bg-muted/20 px-6 py-4 rounded-t-2xl duration-200 animate-in zoom-in-95 slide-in-from-bottom-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div 
                className="h-4 w-4 rounded-full flex-shrink-0 shadow-sm" 
                style={{ backgroundColor: habit.color }} 
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-foreground truncate">{habit.name}</h2>
                <p className="text-sm text-muted-foreground">{format(date, t.dateFormat, { locale: dateLocale })}</p>
              </div>
            </div>
            <Button 
              onClick={onClose} 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 flex-shrink-0 ml-2"
              aria-label={t.close}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Show existing data if present */}
          {existingCompletion?.data && Object.keys(existingCompletion.data).length > 0 && (
            <div className="p-3 rounded-lg bg-accent/30 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">{t.previouslyLogged}</p>
              <div className="space-y-1">
                {fields.map((field) => {
                  const value = existingCompletion.data?.[field.id]
                  if (!value) return null
                  return (
                    <p key={field.id} className="text-sm text-foreground">
                      <span className="font-semibold">{field.label}:</span>{" "}
                      {value} {field.type === "number" && field.unit ? field.unit : ""}
                    </p>
                  )
                })}
              </div>
            </div>
          )}

          {/* Mark Complete Checkbox */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border-2 border-border transition-all">
            <button
              onClick={() => setMarkComplete(!markComplete)}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg border-2 transition-all flex-shrink-0",
                markComplete
                  ? "border-success bg-success text-success-foreground shadow-sm scale-105"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              {markComplete && <Check className="h-4 w-4" strokeWidth={3} />}
            </button>
            <div>
              <p className="text-sm font-medium text-foreground">{t.markComplete}</p>
              <p className="text-xs text-muted-foreground">{t.markCompleteHint}</p>
            </div>
          </div>

          {/* Dynamic Field Inputs */}
          {fields.map((field, index) => {
            const currentValue = field.type === "number" && fieldValues[field.id]
              ? parseFloat(fieldValues[field.id])
              : 0
            const hasGoal = field.type === "number" && field.goalValue && field.goalValue > 0
            const goalProgress = hasGoal ? Math.min((currentValue / field.goalValue!) * 100, 100) : 0
            const goalReached = hasGoal && currentValue >= field.goalValue!

            return (
              <div key={field.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    {field.label || formatMessage(t.fieldFallback, { number: index + 1 })}
                    {field.type === "number" && field.unit && (
                      <span className="text-muted-foreground ml-1">({field.unit})</span>
                    )}
                  </label>
                  {hasGoal && (
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-primary" />
                      <span className={cn(
                        "text-xs font-semibold",
                        goalReached ? "text-success" : "text-muted-foreground"
                      )}>
                        {currentValue || 0} / {field.goalValue} {field.unit || ""}
                      </span>
                    </div>
                  )}
                </div>
                {field.type === "number" ? (
                  <>
                    <Input
                      type="number"
                      value={fieldValues[field.id] || ""}
                      onChange={(e) => {
                        const newValues = { ...fieldValues, [field.id]: e.target.value }
                        setFieldValues(newValues)
                        // Auto-suggest marking complete when goal is reached
                        if (hasGoal && e.target.value) {
                          const numVal = parseFloat(e.target.value)
                          if (!isNaN(numVal) && numVal >= field.goalValue! && !markComplete) {
                            setMarkComplete(true)
                          }
                        }
                      }}
                      placeholder={hasGoal ? formatMessage(t.goalPlaceholder, { goal: field.goalValue!, unit: field.unit || "" }) : formatMessage(t.numberPlaceholder, { label: field.label?.toLowerCase() || t.valueFallback })}
                      className="bg-secondary/50 border-border h-11 text-base"
                      step="any"
                      autoFocus={index === 0}
                    />
                    {/* Goal progress bar */}
                    {hasGoal && (
                      <div className="space-y-1">
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-500 rounded-full",
                              goalReached ? "bg-success" :
                              goalProgress >= 50 ? "bg-exercise" :
                              goalProgress > 0 ? "bg-primary" :
                              "bg-transparent"
                            )}
                            style={{ width: `${goalProgress}%` }}
                          />
                        </div>
                        <p className={cn(
                          "text-[10px] font-medium",
                          goalReached ? "text-success" : "text-muted-foreground"
                        )}>
                          {goalReached ? t.goalReached : formatMessage(t.goalProgress, { percent: Math.round(goalProgress) })}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <textarea
                    value={fieldValues[field.id] || ""}
                    onChange={(e) => {
                      setFieldValues({ ...fieldValues, [field.id]: e.target.value })
                    }}
                    placeholder={formatMessage(t.textPlaceholder, { label: field.label?.toLowerCase() || t.notesFallback })}
                    className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none transition-all"
                    rows={4}
                    autoFocus={index === 0}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border bg-muted/10 px-6 py-4 rounded-b-2xl">
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              {t.cancel}
            </Button>
            {!markComplete && (
              <Button
                onClick={handleQuickComplete}
                variant="outline"
                className="flex-1 bg-success/10 border-success/50 text-success hover:bg-success/20 hover:border-success"
              >
                <Check className="h-4 w-4 mr-2" />
                {t.quickComplete}
              </Button>
            )}
            <Button
              onClick={handleSave}
              className="flex-1"
            >
              {t.save}
            </Button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  )
}
