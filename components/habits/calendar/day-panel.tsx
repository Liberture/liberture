"use client"

import { useState } from "react"
import { addDays, format } from "date-fns"
import { Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Link2, MapPin, Tag } from "lucide-react"
import { Button } from "@/components/habits/ui/button"
import type { CalendarEvent, Habit, HabitCompletion, Todo } from "@/lib/habits/types"
import { cn } from "@/lib/utils"
import { useDateLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"
import { priorityLabel } from "@/components/habits/todos/todo-meta"
import { formatClock, formatEventRange, type TimeFormat } from "@/components/habits/calendar/calendar-utils"

export type DayHabit = { habit: Habit; completion?: HabitCompletion }

/** Agenda for the selected day: events, todos due and habits, plus upcoming events. */
export function DayPanel({
  day,
  onSelectDay,
  events,
  todos,
  habits,
  upcoming,
  todoById,
  timeFormat,
  onEditEvent,
  onEditTodo,
  onToggleTodo,
  onToggleHabit,
}: {
  day: Date
  onSelectDay: (day: Date) => void
  events: CalendarEvent[]
  todos: Todo[]
  habits: DayHabit[]
  upcoming: CalendarEvent[]
  todoById: Map<string, Todo>
  timeFormat: TimeFormat
  onEditEvent: (event: CalendarEvent) => void
  onEditTodo: (todo: Todo) => void
  onToggleTodo: (todo: Todo) => void
  onToggleHabit?: (habitId: string, date: string) => void
}) {
  const t = useTranslations().habits.app.calendarView
  const listT = useTranslations().habits.app.todoList
  const dateLocale = useDateLocale()
  const [showUpcoming, setShowUpcoming] = useState(false)
  const dayKey = format(day, "yyyy-MM-dd")

  const empty = (text: string) => <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">{text}</p>

  const renderEvent = (event: CalendarEvent) => {
    const linkedTodo = event.todoId ? todoById.get(event.todoId) : undefined
    return (
      <li key={event.id}>
        <button
          type="button"
          onClick={() => onEditEvent(event)}
          aria-label={formatMessage(t.editEvent, { title: event.title })}
          className="w-full rounded-lg border border-border border-l-4 border-l-work bg-background p-3 text-left transition-colors hover:bg-muted/40"
        >
          <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {formatEventRange(event, t, timeFormat, dateLocale)}
          </p>
          {(event.location || linkedTodo || event.tags?.length) && (
            <span className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
              {event.location && (
                <span className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5">
                  <MapPin className="h-3 w-3" /> {event.location}
                </span>
              )}
              {linkedTodo && (
                <span className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5">
                  <Link2 className="h-3 w-3" /> {linkedTodo.title}
                </span>
              )}
              {(event.tags ?? []).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5">
                  <Tag className="h-3 w-3" /> {tag}
                </span>
              ))}
            </span>
          )}
        </button>
      </li>
    )
  }

  return (
    <aside className="min-w-0 space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm" aria-label={t.agenda}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-foreground">{format(day, "EEEE, MMM d", { locale: dateLocale })}</h2>
          <p className="text-xs text-muted-foreground">
            {formatMessage(t.daySummary, { events: events.length, todos: todos.length, habits: habits.length })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onSelectDay(addDays(day, -1))} aria-label={t.previousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => onSelectDay(new Date())}>
            {t.today}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onSelectDay(addDays(day, 1))} aria-label={t.nextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">{t.events}</h3>
        {events.length ? <ul className="space-y-2">{events.map(renderEvent)}</ul> : empty(t.noEvents)}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">{t.todos}</h3>
        {todos.length ? (
          <ul className="space-y-2">
            {todos.map((todo) => {
              const done = todo.status === "completed"
              return (
                <li key={todo.id} className={cn("flex items-start gap-3 rounded-lg border border-border bg-background p-3", done && "opacity-60")}>
                  <button
                    type="button"
                    onClick={() => onToggleTodo(todo)}
                    aria-pressed={done}
                    aria-label={formatMessage(done ? t.markTodoActive : t.markTodoDone, { title: todo.title })}
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      done ? "border-nutrition bg-nutrition text-success-foreground" : "border-border hover:border-primary",
                    )}
                  >
                    {done && <Check className="h-3 w-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditTodo(todo)}
                    aria-label={formatMessage(t.editTodo, { title: todo.title })}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className={cn("block break-words text-sm font-medium text-foreground", done && "line-through")}>{todo.title}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {todo.dueTime && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatClock(todo.dueTime, timeFormat)}
                        </span>
                      )}
                      <span>{priorityLabel(todo.priority, listT)}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          empty(t.noTodos)
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">{t.habits}</h3>
        {habits.length ? (
          <ul className="space-y-2">
            {habits.map(({ habit, completion }) => {
              const done = Boolean(completion?.completed)
              return (
                <li key={habit.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                  <div className="min-w-0">
                    <p className={cn("truncate text-sm font-medium text-foreground", done && "text-muted-foreground line-through")}>{habit.name}</p>
                    <p className="text-xs text-muted-foreground">{habit.time ? formatClock(habit.time, timeFormat) : t.anyTime}</p>
                  </div>
                  {onToggleHabit ? (
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={done}
                      onClick={() => onToggleHabit(habit.id, dayKey)}
                      aria-label={formatMessage(done ? t.markHabitUndone : t.markHabitDone, { name: habit.name })}
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                        done ? "border-success bg-success text-success-foreground" : "border-border hover:border-primary",
                      )}
                    >
                      {done && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ) : (
                    <span
                      aria-hidden
                      className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border", done ? "border-success bg-success text-success-foreground" : "border-border")}
                    >
                      {done && <Check className="h-3 w-3" />}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          empty(t.noHabits)
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="border-t border-border pt-3">
          <button
            type="button"
            aria-expanded={showUpcoming}
            onClick={() => setShowUpcoming((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
          >
            {formatMessage(t.showUpcoming, { count: upcoming.length })}
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showUpcoming && "rotate-180")} />
          </button>
          {showUpcoming && <ul className="mt-2 space-y-2">{upcoming.slice(0, 8).map(renderEvent)}</ul>}
        </section>
      )}
    </aside>
  )
}
