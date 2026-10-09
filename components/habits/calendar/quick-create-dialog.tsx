"use client"

import { useId, useState } from "react"
import { format } from "date-fns"
import { CalendarDays, CheckSquare } from "lucide-react"
import { AppDialog } from "@/components/habits/ui/app-dialog"
import { Button } from "@/components/habits/ui/button"
import { Input } from "@/components/habits/ui/input"
import { Label } from "@/components/habits/ui/label"
import { cn } from "@/lib/utils"
import { useDateLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatTime, isUntimed, type TimeFormat } from "@/components/habits/calendar/calendar-utils"

export type QuickCreateKind = "event" | "todo"

/**
 * Opened where the user clicked an empty slot: a title plus "event or todo",
 * created in one step. "More options" hands over to the full dialog.
 */
export function QuickCreateDialog({
  start,
  end,
  timeFormat,
  onCreate,
  onMoreOptions,
  onClose,
}: {
  start: Date
  end: Date
  timeFormat: TimeFormat
  onCreate: (kind: QuickCreateKind, title: string) => void
  onMoreOptions: (kind: QuickCreateKind, title: string) => void
  onClose: () => void
}) {
  const t = useTranslations().habits.app.calendarView
  const dateLocale = useDateLocale()
  const id = useId()
  const [kind, setKind] = useState<QuickCreateKind>("event")
  const [title, setTitle] = useState("")
  const [error, setError] = useState(false)
  const untimed = isUntimed(start, end)
  const when =
    format(start, "EEEE, MMM d", { locale: dateLocale }) +
    (untimed ? ` · ${t.allDay}` : ` · ${formatTime(start, timeFormat)} – ${formatTime(end, timeFormat)}`)

  const submit = () => {
    const value = title.trim()
    if (!value) {
      setError(true)
      return
    }
    onCreate(kind, value)
    onClose()
  }

  return (
    <AppDialog
      open
      onClose={onClose}
      title={t.quickCreateTitle}
      description={when}
      size="sm"
      dirty={Boolean(title.trim())}
      footer={
        <>
          <Button type="button" variant="ghost" className="mr-auto" onClick={() => onMoreOptions(kind, title.trim())}>
            {t.moreOptions}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="submit" form={`${id}-form`}>
            {t.create}
          </Button>
        </>
      }
    >
      <form
        id={`${id}-form`}
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="space-y-3"
      >
        <div className="space-y-1.5">
          <span id={`${id}-kind`} className="block text-sm font-medium">
            {t.kindLabel}
          </span>
          <div role="group" aria-labelledby={`${id}-kind`} className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1">
            {(["event", "todo"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={kind === value}
                onClick={() => setKind(value)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
                  kind === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "event" ? <CalendarDays className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
                {value === "event" ? t.kindEvent : t.kindTodo}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-title`}>{t.title}</Label>
          <Input
            id={`${id}-title`}
            value={title}
            data-autofocus
            onChange={(e) => {
              setTitle(e.target.value)
              if (e.target.value.trim()) setError(false)
            }}
            placeholder={kind === "event" ? t.eventTitlePlaceholder : t.todoTitlePlaceholder}
            aria-invalid={error || undefined}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          {error && (
            <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
              {t.titleRequired}
            </p>
          )}
        </div>
      </form>
    </AppDialog>
  )
}
