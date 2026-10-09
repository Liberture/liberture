"use client"

import { useId, useState } from "react"
import type { Habit, HabitCompletion } from "@/lib/habits/types"
import { Button } from "@/components/habits/ui/button"
import { AppDialog } from "@/components/habits/ui/app-dialog"
import { Input } from "@/components/habits/ui/input"
import { Check, Target } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useTranslations, useDateLocale } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

export interface HabitDataEntryResult {
  data?: Record<string, number | string>
  markComplete: boolean
  /** Optional free-text note, saved to HabitCompletion.context. */
  context?: string
}

interface HabitDataEntryModalProps {
  habit: Habit
  date: Date
  existingCompletion?: HabitCompletion
  onSave: (result: HabitDataEntryResult) => void
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
  const idPrefix = useId()
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
  const [note, setNote] = useState(existingCompletion?.context ?? "")
  const [touched, setTouched] = useState(false)

  const fields = habit.dataEntry?.fields || []

  const noteValue = (): string | undefined => {
    const trimmed = note.trim()
    // An emptied note clears an existing one; otherwise leave the key off.
    if (trimmed) return trimmed
    return existingCompletion?.context ? "" : undefined
  }

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
      ...(Object.keys(data).length > 0 ? { data } : {}),
      markComplete,
      context: noteValue(),
    })
    onClose()
  }

  const handleQuickComplete = () => {
    onSave({ markComplete: true, context: noteValue() })
    onClose()
  }

  return (
    <AppDialog
      open
      onClose={onClose}
      size="sm"
      dirty={touched}
      title={habit.name}
      description={format(date, t.dateFormat, { locale: dateLocale })}
      footer={
        <>
          <Button onClick={onClose} variant="outline" className="flex-1">
            {t.cancel}
          </Button>
          {!markComplete && (
            <Button
              onClick={handleQuickComplete}
              variant="outline"
              className="flex-1 bg-success/10 border-success/50 text-success hover:bg-success/20 hover:border-success"
            >
              <Check className="h-4 w-4 mr-2" aria-hidden />
              {t.quickComplete}
            </Button>
          )}
          <Button onClick={handleSave} className="flex-1">
            {t.save}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
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

        {/* Mark complete */}
        <button
          type="button"
          role="checkbox"
          aria-checked={markComplete}
          onClick={() => {
            setMarkComplete(!markComplete)
            setTouched(true)
          }}
          className="flex w-full items-center gap-3 p-4 rounded-xl bg-secondary/30 border-2 border-border text-left transition-all"
        >
          <span
            aria-hidden
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg border-2 transition-all flex-shrink-0",
              markComplete
                ? "border-success bg-success text-success-foreground shadow-sm scale-105"
                : "border-border bg-card"
            )}
          >
            {markComplete && <Check className="h-4 w-4" strokeWidth={3} />}
          </span>
          <span>
            <span className="block text-sm font-medium text-foreground">{t.markComplete}</span>
            <span className="block text-xs text-muted-foreground">{t.markCompleteHint}</span>
          </span>
        </button>

        {/* Dynamic field inputs */}
        {fields.map((field, index) => {
          const inputId = `${idPrefix}-field-${index}`
          const currentValue = field.type === "number" && fieldValues[field.id]
            ? parseFloat(fieldValues[field.id])
            : 0
          const hasGoal = field.type === "number" && field.goalValue && field.goalValue > 0
          const goalProgress = hasGoal ? Math.min((currentValue / field.goalValue!) * 100, 100) : 0
          const goalReached = hasGoal && currentValue >= field.goalValue!

          return (
            <div key={field.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor={inputId} className="text-sm font-medium text-foreground">
                  {field.label || formatMessage(t.fieldFallback, { number: index + 1 })}
                  {field.type === "number" && field.unit && (
                    <span className="text-muted-foreground ml-1">({field.unit})</span>
                  )}
                </label>
                {hasGoal && (
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-primary" aria-hidden />
                    <span className={cn("text-xs font-semibold", goalReached ? "text-success" : "text-muted-foreground")}>
                      {currentValue || 0} / {field.goalValue} {field.unit || ""}
                    </span>
                  </div>
                )}
              </div>
              {field.type === "number" ? (
                <>
                  <Input
                    id={inputId}
                    type="number"
                    value={fieldValues[field.id] || ""}
                    onChange={(e) => {
                      setFieldValues({ ...fieldValues, [field.id]: e.target.value })
                      setTouched(true)
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
                    data-autofocus={index === 0 ? "" : undefined}
                  />
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
                      <p className={cn("text-[10px] font-medium", goalReached ? "text-success" : "text-muted-foreground")}>
                        {goalReached ? t.goalReached : formatMessage(t.goalProgress, { percent: Math.round(goalProgress) })}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <textarea
                  id={inputId}
                  value={fieldValues[field.id] || ""}
                  onChange={(e) => {
                    setFieldValues({ ...fieldValues, [field.id]: e.target.value })
                    setTouched(true)
                  }}
                  placeholder={formatMessage(t.textPlaceholder, { label: field.label?.toLowerCase() || t.notesFallback })}
                  className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none transition-all"
                  rows={4}
                  data-autofocus={index === 0 ? "" : undefined}
                />
              )}
            </div>
          )
        })}

        {/* Note — a reflection on this check-in, kept with the completion. */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor={`${idPrefix}-note`} className="text-sm font-medium text-foreground">
              {t.note}
            </label>
            <span className="text-xs text-muted-foreground">{t.optional}</span>
          </div>
          <textarea
            id={`${idPrefix}-note`}
            value={note}
            onChange={(e) => {
              setNote(e.target.value.slice(0, 500))
              setTouched(true)
            }}
            placeholder={t.notePlaceholder}
            className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
            rows={2}
          />
        </div>
      </div>
    </AppDialog>
  )
}
