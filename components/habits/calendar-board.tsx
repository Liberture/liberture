"use client"

import { useCallback, useMemo, useState } from "react"
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar"
import { addMinutes, format, getDay, parse, startOfDay, startOfWeek } from "date-fns"
import { enUS, es } from "date-fns/locale"

import { useLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

import type { CalendarEvent, Habit, HabitCompletion, Todo } from "@/lib/habits/types"
import { PILLAR_HEX, pillarForHabit } from "@/lib/habits/pillars"

import "react-big-calendar/lib/css/react-big-calendar.css"

/**
 * Month / week / day / agenda calendar built on react-big-calendar, which
 * handles the hard parts — overlap layout, all-day rows, drag-select, view
 * switching — that the previous hand-rolled agenda list did not.
 *
 * Three sources land on one surface: scheduled events, todos with a due date,
 * and habits due on the day. Habits and todos are read-only markers; only real
 * events are editable, which is why `kind` rides along on each entry.
 */

const locales = { "en-US": enUS, es }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

export type BoardEntry = {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  kind: "event" | "todo" | "habit"
  color: string
  done?: boolean
  source?: CalendarEvent
}

interface CalendarBoardProps {
  events: CalendarEvent[]
  todos: Todo[]
  habits: Habit[]
  completions: HabitCompletion[]
  showTodos: boolean
  showHabits: boolean
  onSelectEvent: (entry: BoardEntry) => void
  onSelectSlot: (start: Date, end: Date) => void
}

/** "HH:MM" onto a given day; falls back to 09:00 when the time is unusable. */
function atTime(day: Date, time: string | undefined): Date {
  const base = startOfDay(day)
  const match = typeof time === "string" ? time.match(/^(\d{1,2}):(\d{2})/) : null
  if (!match) {
    base.setHours(9, 0, 0, 0)
    return base
  }
  base.setHours(Number(match[1]), Number(match[2]), 0, 0)
  return base
}

function isHabitScheduledOn(habit: Habit, date: Date): boolean {
  if (!habit.schedule || habit.schedule.type === "daily") return true
  if (habit.schedule.type === "specific_days" && habit.schedule.days) {
    return habit.schedule.days.includes(getDay(date))
  }
  return true
}

export function CalendarBoard({
  events,
  todos,
  habits,
  completions,
  showTodos,
  showHabits,
  onSelectEvent,
  onSelectSlot,
}: CalendarBoardProps) {
  const t = useTranslations().habits.app.calendarBoard
  const locale = useLocale()
  const [view, setView] = useState<View>("month")
  const [date, setDate] = useState(() => new Date())

  const completedKeys = useMemo(() => {
    const set = new Set<string>()
    for (const c of completions) if (c.completed) set.add(`${c.date}:${c.habitId}`)
    return set
  }, [completions])

  const entries = useMemo<BoardEntry[]>(() => {
    const list: BoardEntry[] = []

    for (const event of events) {
      const start = new Date(event.startsAt)
      const end = new Date(event.endsAt)
      if (Number.isNaN(start.getTime())) continue
      list.push({
        id: event.id,
        title: event.title,
        start,
        end: Number.isNaN(end.getTime()) ? addMinutes(start, 60) : end,
        kind: "event",
        color: PILLAR_HEX.work,
        source: event,
      })
    }

    if (showTodos) {
      for (const todo of todos) {
        if (!todo.dueDate) continue
        const day = new Date(`${todo.dueDate}T00:00:00`)
        if (Number.isNaN(day.getTime())) continue
        const start = todo.dueTime ? atTime(day, todo.dueTime) : startOfDay(day)
        list.push({
          id: `todo-${todo.id}`,
          title: todo.title,
          start,
          end: todo.dueTime ? addMinutes(start, 30) : startOfDay(day),
          allDay: !todo.dueTime,
          kind: "todo",
          color: PILLAR_HEX.finance,
          done: todo.status === "completed",
        })
      }
    }

    // Habits are generated per visible day rather than stored, so the window is
    // bounded to what the current view can actually show.
    if (showHabits) {
      const span = view === "month" ? 42 : view === "week" ? 7 : 1
      const anchor = startOfDay(view === "month" ? startOfWeek(date, { weekStartsOn: 1 }) : date)

      for (let i = 0; i < span; i++) {
        const day = new Date(anchor)
        day.setDate(anchor.getDate() - (view === "month" ? 7 : 0) + i)
        const dayStr = format(day, "yyyy-MM-dd")
        const due = habits.filter((h) => !h.archived && isHabitScheduledOn(h, day))
        if (due.length === 0) continue

        if (view === "month") {
          // A month cell can't hold 20 individual habits — every day would read
          // "+19 more" and hide the events that actually matter. One roll-up
          // chip per day instead; week and day views still list them all.
          const done = due.filter((h) => completedKeys.has(`${dayStr}:${h.id}`)).length
          list.push({
            id: `habits-${dayStr}`,
            title: formatMessage(t.habitsRollup, { done, total: due.length }),
            start: startOfDay(day),
            end: startOfDay(day),
            allDay: true,
            kind: "habit",
            color: PILLAR_HEX.nutrition,
            done: done === due.length,
          })
          continue
        }

        for (const habit of due) {
          const start = atTime(day, habit.time)
          list.push({
            id: `habit-${habit.id}-${dayStr}`,
            title: habit.name,
            start,
            end: addMinutes(start, 30),
            kind: "habit",
            color: PILLAR_HEX[pillarForHabit(habit)],
            done: completedKeys.has(`${dayStr}:${habit.id}`),
          })
        }
      }
    }

    return list
  }, [events, todos, habits, showTodos, showHabits, view, date, completedKeys, t])

  const messages = useMemo(
    () => ({
      today: t.today,
      previous: t.previous,
      next: t.next,
      month: t.month,
      week: t.week,
      day: t.day,
      agenda: t.agenda,
      date: t.date,
      time: t.time,
      event: t.event,
      allDay: t.allDay,
      noEventsInRange: t.noEventsInRange,
      showMore: (count: number) => formatMessage(t.showMore, { count }),
    }),
    [t]
  )

  const eventPropGetter = useCallback((entry: BoardEntry) => {
    const muted = entry.kind !== "event"
    return {
      style: {
        backgroundColor: entry.done ? "transparent" : entry.color,
        border: `1px solid ${entry.color}`,
        color: entry.done ? entry.color : "#0b0d13",
        opacity: entry.done ? 0.55 : muted ? 0.9 : 1,
        textDecoration: entry.done ? "line-through" : undefined,
        borderRadius: 6,
        fontSize: 12,
        padding: "0 4px",
      },
    }
  }, [])

  return (
    <div className="lb-calendar rounded-xl border border-border bg-card/60 p-3 backdrop-blur-sm">
      <Calendar<BoardEntry>
        localizer={localizer}
        culture={locale === "es" ? "es" : "en-US"}
        messages={messages}
        events={entries}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        views={["month", "week", "day", "agenda"]}
        popup
        selectable
        step={30}
        timeslots={2}
        startAccessor="start"
        endAccessor="end"
        allDayAccessor="allDay"
        eventPropGetter={eventPropGetter}
        onSelectEvent={onSelectEvent}
        onSelectSlot={({ start, end }) => onSelectSlot(start as Date, end as Date)}
        style={{ height: 680 }}
      />
    </div>
  )
}
