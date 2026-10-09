"use client"

import { useId, useState } from "react"
import { format } from "date-fns"
import { AppDialog } from "@/components/habits/ui/app-dialog"
import { Button } from "@/components/habits/ui/button"
import { Input } from "@/components/habits/ui/input"
import { Label } from "@/components/habits/ui/label"
import type { Todo } from "@/lib/habits/types"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

const DURATIONS = [15, 30, 45, 60, 90, 120]

function defaultStart(todo: Todo) {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  now.setHours(now.getHours() + 1)
  return {
    date: todo.dueDate || format(now, "yyyy-MM-dd"),
    time: todo.dueTime || format(now, "HH:mm"),
  }
}

/** Blocks time for a todo on the calendar (creates a linked event). */
export function ScheduleTodoDialog({
  todo,
  onSchedule,
  onClose,
}: {
  todo: Todo
  onSchedule: (todoId: string, startsAt: string, durationMinutes: number) => void
  onClose: () => void
}) {
  const t = useTranslations().habits.app.todoList.scheduleDialog
  const common = useTranslations().habits.app.common
  const id = useId()
  const initial = defaultStart(todo)
  const [date, setDate] = useState(initial.date)
  const [time, setTime] = useState(initial.time)
  const estimate = todo.estimatedMinutes && todo.estimatedMinutes > 0 ? todo.estimatedMinutes : 30
  const durations = DURATIONS.includes(estimate) ? DURATIONS : [...DURATIONS, estimate].sort((a, b) => a - b)
  const [duration, setDuration] = useState(estimate)
  const [error, setError] = useState(false)

  const submit = () => {
    const start = new Date(`${date}T${time}`)
    if (!date || !time || Number.isNaN(start.getTime())) {
      setError(true)
      return
    }
    onSchedule(todo.id, start.toISOString(), duration)
    onClose()
  }

  return (
    <AppDialog
      open
      onClose={onClose}
      title={t.title}
      description={formatMessage(t.description, { title: todo.title })}
      size="sm"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            {common.cancel}
          </Button>
          <Button type="submit" form={`${id}-form`}>
            {t.submit}
          </Button>
        </>
      }
    >
      <form
        id={`${id}-form`}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-date`}>{t.date}</Label>
            <Input
              id={`${id}-date`}
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setError(false)
              }}
              aria-invalid={error || undefined}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-time`}>{t.time}</Label>
            <Input
              id={`${id}-time`}
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value)
                setError(false)
              }}
              aria-invalid={error || undefined}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-duration`}>{t.duration}</Label>
          <select
            id={`${id}-duration`}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {durations.map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatMessage(t.durationOption, { minutes })}
              </option>
            ))}
          </select>
        </div>
        {error && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {t.invalid}
          </p>
        )}
      </form>
    </AppDialog>
  )
}
