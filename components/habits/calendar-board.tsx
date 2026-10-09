"use client"

import { useCallback, useMemo, useState, type ComponentType } from "react"
import { Calendar, dateFnsLocalizer, type CalendarProps, type Formats, type SlotInfo, type View } from "react-big-calendar"
import withDragAndDrop, { type EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop"
import { addMinutes, format, getDay, isSameDay, parse, startOfDay, startOfMonth, startOfWeek } from "date-fns"
import { enUS, es } from "date-fns/locale"

import { useLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

import type { CalendarEvent, Habit, HabitCompletion, Todo } from "@/lib/habits/types"
import { PILLAR_HEX, pillarForHabit } from "@/lib/habits/pillars"

import "react-big-calendar/lib/css/react-big-calendar.css"
import "react-big-calendar/lib/addons/dragAndDrop/styles.css"

/**
 * Month / week / day / agenda calendar built on react-big-calendar, which
 * handles the hard parts — overlap layout, all-day rows, drag-select, view
 * switching — that the previous hand-rolled agenda list did not.
 *
 * Three sources land on one surface: scheduled events, todos with a due date,
 * and habits due on the day. Habits and todos are read-only markers; only real
 * events can be dragged or resized, which is why `kind` rides along on each entry.
 */

const locales = { "en-US": enUS, es }

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

export type BoardSlotAction = { action: SlotInfo["action"]; view: View }

const DnDCalendar = withDragAndDrop<BoardEntry>(Calendar as unknown as ComponentType<CalendarProps<BoardEntry, object>>)

interface CalendarBoardProps {
  events: CalendarEvent[]
  todos: Todo[]
  habits: Habit[]
  completions: HabitCompletion[]
  showTodos: boolean
  showHabits: boolean
  /** Visible date; the board follows it and reports navigation through onNavigate. */
  date: Date
  onNavigate: (date: Date) => void
  /** Highlighted in month view. */
  selectedDay?: Date
  weekStartsOn?: 0 | 1
  timeFormat?: "24h" | "12h"
  onSelectEvent: (entry: BoardEntry) => void
  onSelectSlot: (start: Date, end: Date, info: BoardSlotAction) => void
  /** Enables drag/resize of real events. */
  onMoveEvent?: (event: CalendarEvent, start: Date, end: Date) => void
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

function buildFormats(timeFormat: "24h" | "12h"): Formats {
  const p = timeFormat === "12h" ? "h:mm a" : "HH:mm"
  type Range = { start: Date; end: Date }
  type Loc = { format: (value: Date, pattern: string, culture?: string) => string }
  const range = ({ start, end }: Range, culture?: string, loc?: Loc) =>
    `${loc!.format(start, p, culture)} – ${loc!.format(end, p, culture)}`
  return {
    timeGutterFormat: p,
    agendaTimeFormat: p,
    eventTimeRangeFormat: range,
    selectRangeFormat: range,
    agendaTimeRangeFormat: range,
    eventTimeRangeStartFormat: ({ start }: Range, culture?: string, loc?: Loc) => `${loc!.format(start, p, culture)} – `,
    eventTimeRangeEndFormat: ({ end }: Range, culture?: string, loc?: Loc) => ` – ${loc!.format(end, p, culture)}`,
  } as Formats
}

export function CalendarBoard({
  events,
  todos,
  habits,
  completions,
  showTodos,
  showHabits,
  date,
  onNavigate,
  selectedDay,
  weekStartsOn = 1,
  timeFormat = "24h",
  onSelectEvent,
  onSelectSlot,
  onMoveEvent,
}: CalendarBoardProps) {
  const t = useTranslations().habits.app.calendarBoard
  const locale = useLocale()
  const [view, setView] = useState<View>("month")

  const localizer = useMemo(
    () =>
      dateFnsLocalizer({
        format,
        parse,
        startOfWeek: () => startOfWeek(new Date(), { weekStartsOn }),
        getDay,
        locales,
      }),
    [weekStartsOn]
  )
  const formats = useMemo(() => buildFormats(timeFormat), [timeFormat])

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
      const anchor = startOfDay(
        view === "month"
          ? startOfWeek(startOfMonth(date), { weekStartsOn })
          : view === "week"
            ? startOfWeek(date, { weekStartsOn })
            : date
      )

      for (let i = 0; i < span; i++) {
        const day = new Date(anchor)
        day.setDate(anchor.getDate() + i)
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
  }, [events, todos, habits, showTodos, showHabits, view, date, weekStartsOn, completedKeys, t])

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

  const dayPropGetter = useCallback(
    (day: Date) =>
      selectedDay && view === "month" && isSameDay(day, selectedDay)
        ? { style: { backgroundColor: "color-mix(in oklab, var(--primary) 14%, transparent)" } }
        : {},
    [selectedDay, view]
  )

  const isMovable = useCallback((entry: BoardEntry) => Boolean(onMoveEvent) && entry.kind === "event", [onMoveEvent])
  const handleMove = useCallback(
    ({ event, start, end }: EventInteractionArgs<BoardEntry>) => {
      if (!onMoveEvent || !event.source) return
      onMoveEvent(event.source, new Date(start), new Date(end))
    },
    [onMoveEvent]
  )

  return (
    // data-no-swipe: drag-to-select and drag-to-move must not flip the tracker view.
    // Height follows the viewport so phones aren't stuck with a 680px block.
    <div data-no-swipe className="lb-calendar h-[min(72dvh,720px)] min-h-[420px] rounded-xl border border-border bg-card/60 p-2 backdrop-blur-sm sm:p-3">
      <DnDCalendar
        localizer={localizer}
        culture={locale === "es" ? "es" : "en-US"}
        messages={messages}
        formats={formats}
        events={entries}
        view={view}
        onView={setView}
        date={date}
        onNavigate={onNavigate}
        views={["month", "week", "day", "agenda"]}
        popup
        selectable
        step={30}
        timeslots={2}
        startAccessor="start"
        endAccessor="end"
        allDayAccessor="allDay"
        eventPropGetter={eventPropGetter}
        dayPropGetter={dayPropGetter}
        onSelectEvent={onSelectEvent}
        onSelectSlot={(slot: SlotInfo) => onSelectSlot(new Date(slot.start), new Date(slot.end), { action: slot.action, view })}
        draggableAccessor={isMovable}
        resizableAccessor={isMovable}
        resizable={Boolean(onMoveEvent)}
        onEventDrop={handleMove}
        onEventResize={handleMove}
        style={{ height: "100%" }}
      />
    </div>
  )
}
