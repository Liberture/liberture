"use client"

import type React from "react"
import { memo, useMemo, useState } from "react"
import { DayPicker } from "react-day-picker"
import { CalendarDays, CheckCircle2, Clock, Link2, MapPin, Plus, Tag, Trash2 } from "lucide-react"
import { endOfDay, format, isAfter, isBefore, isSameDay, isToday, isTomorrow, isValid, parseISO, startOfDay } from "date-fns"
import type { CalendarEvent, Habit, HabitCompletion, Project, Todo } from "@/lib/habits/types"
import { EditTodoDialog } from "@/components/habits/edit-todo-dialog"
import dynamic from "next/dynamic"
import type { BoardEntry } from "@/components/habits/calendar-board"
import { useDateLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"
import type { Locale as DateLocale } from "date-fns"

type CalendarViewCopy = ReturnType<typeof useTranslations>["habits"]["app"]["calendarView"]

function CalendarLoading() {
  const t = useTranslations().habits.app.calendarView
  return (
    <div className="flex h-[680px] items-center justify-center rounded-xl border border-border bg-card/60">
      <span className="text-sm text-muted-foreground">{t.loadingCalendar}</span>
    </div>
  )
}

// react-big-calendar plus its CSS is the single largest chunk in the app, and
// it only matters once the calendar is opened. Loading it on demand keeps it
// off the initial parse, which is what made the first switch here cost ~3.5s.
const CalendarBoard = dynamic(
  () => import("@/components/habits/calendar-board").then((m) => m.CalendarBoard),
  {
    ssr: false,
    loading: () => <CalendarLoading />,
  }
)
import { Button } from "@/components/habits/ui/button"
import { Input } from "@/components/habits/ui/input"
import { Label } from "@/components/habits/ui/label"
import { Textarea } from "@/components/habits/ui/textarea"
import { cn } from "@/lib/utils"

interface CalendarViewProps {
  events: CalendarEvent[]
  todos: Todo[]
  habits: Habit[]
  completions: HabitCompletion[]
  onAddEvent: (event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => void
  onRemoveEvent: (id: string) => void
  projects: Project[]
  onAddProject: (name: string) => Project
  onCreateTodo: (updates: Partial<Todo>) => void
  onUpdateTodo: (id: string, updates: Partial<Todo>) => void
  onDeleteTodo: (id: string) => void
}

/**
 * Blank todo pre-filled with the day (and time, when the click landed on a
 * timed slot) the user picked. It is never stored until the dialog saves —
 * EditTodoDialog just needs a full Todo to render.
 */
function draftTodo(day: Date, time?: string): Todo {
  return {
    id: crypto.randomUUID(),
    title: "",
    dueDate: format(day, "yyyy-MM-dd"),
    dueTime: time,
    priority: 3,
    status: "incomplete",
    createdAt: new Date().toISOString(),
  }
}

function nextHourDate() {
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + 1)
  return date
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000)
}

function toDateInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function toTimeInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(11, 16)
}

function parseLocalDateTime(date: string, time: string) {
  const parsed = new Date(date + "T" + time)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseDay(value?: string) {
  if (!value) return null
  const parsed = parseISO(value + "T00:00:00")
  return isValid(parsed) ? parsed : null
}

function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd")
}

function splitTags(tags: string) {
  return Array.from(
    new Set(
      tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  )
}

function formatEventDate(value: string, t: CalendarViewCopy, dateLocale?: DateLocale) {
  const date = parseISO(value)
  if (!isValid(date)) return t.invalidDate
  if (isToday(date)) return formatMessage(t.todayAt, { time: format(date, "HH:mm") })
  if (isTomorrow(date)) return formatMessage(t.tomorrowAt, { time: format(date, "HH:mm") })
  return format(date, "EEE, MMM d HH:mm", { locale: dateLocale })
}

function formatEventRange(event: CalendarEvent, t: CalendarViewCopy, dateLocale?: DateLocale) {
  const start = parseISO(event.startsAt)
  const end = parseISO(event.endsAt)
  if (!isValid(start) || !isValid(end)) return t.invalidTime
  const sameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")
  return sameDay
    ? formatEventDate(event.startsAt, t, dateLocale) + " - " + format(end, "HH:mm")
    : formatEventDate(event.startsAt, t, dateLocale) + " - " + format(end, "EEE, MMM d HH:mm", { locale: dateLocale })
}

function eventIntersectsDay(event: CalendarEvent, day: Date) {
  const start = parseISO(event.startsAt)
  const end = parseISO(event.endsAt)
  if (!isValid(start) || !isValid(end)) return false
  return !isAfter(start, endOfDay(day)) && !isBefore(end, startOfDay(day))
}

function habitRunsOnDate(habit: Habit, day: Date, completed: boolean) {
  if (completed) return true
  if (habit.schedule.type === "daily") return true
  if (habit.schedule.type === "specific_days") return habit.schedule.days?.includes(day.getDay()) ?? false
  return false
}

/**
 * Memoised: the view track keeps every visited screen mounted, so this
 * re-renders whenever it becomes active again. With stable props that is pure
 * waste — this component is one of the expensive ones to rebuild.
 */
export const CalendarView = memo(function CalendarView({
  events,
  todos,
  habits,
  completions,
  onAddEvent,
  onRemoveEvent,
  projects,
  onAddProject,
  onCreateTodo,
  onUpdateTodo,
  onDeleteTodo,
}: CalendarViewProps) {
  const t = useTranslations().habits.app.calendarView
  const dateLocale = useDateLocale()
  const defaultStart = useMemo(() => nextHourDate(), [])
  const defaultEnd = useMemo(() => addMinutes(defaultStart, 60), [defaultStart])
  const [selectedDay, setSelectedDay] = useState(startOfDay(new Date()))
  const [title, setTitle] = useState("")
  const [startDate, setStartDate] = useState(toDateInputValue(defaultStart))
  const [startTime, setStartTime] = useState(toTimeInputValue(defaultStart))
  const [endDate, setEndDate] = useState(toDateInputValue(defaultEnd))
  const [endTime, setEndTime] = useState(toTimeInputValue(defaultEnd))
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [tags, setTags] = useState("")
  const [todoId, setTodoId] = useState("")
  const [showEventForm, setShowEventForm] = useState(false)
  const [todoDialog, setTodoDialog] = useState<{ todo: Todo; isNew: boolean } | null>(null)

  const todoById = useMemo(() => new Map(todos.map((todo) => [todo.id, todo])), [todos])
  const selectedTodo = todoId ? todoById.get(todoId) : undefined
  const completionByDayAndHabit = useMemo(
    () => new Map(completions.map((completion) => [completion.date + ":" + completion.habitId, completion])),
    [completions],
  )

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [events],
  )
  const now = Date.now()
  const upcomingEvents = sortedEvents.filter((event) => new Date(event.endsAt).getTime() >= now)
  const schedulableTodos = useMemo(
    () =>
      todos
        .filter((todo) => todo.status !== "completed")
        .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title)),
    [todos],
  )

  const selectedKey = dateKey(selectedDay)
  const selectedEvents = sortedEvents.filter((event) => eventIntersectsDay(event, selectedDay))
  const selectedTodos = todos
    .filter((todo) => {
      const due = parseDay(todo.dueDate)
      return due ? isSameDay(due, selectedDay) : false
    })
    .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title))
  const selectedHabits = habits
    .map((habit) => ({
      habit,
      completion: completionByDayAndHabit.get(selectedKey + ":" + habit.id),
    }))
    .filter(({ habit, completion }) => habitRunsOnDate(habit, selectedDay, Boolean(completion?.completed)))
    .sort((a, b) => (a.habit.time || "00:00").localeCompare(b.habit.time || "00:00"))

  const dayCounters = useMemo(() => {
    const eventDays = new Set<string>()
    const todoDays = new Set<string>()
    const habitDays = new Set<string>()

    events.forEach((event) => {
      const start = parseISO(event.startsAt)
      if (isValid(start)) eventDays.add(dateKey(start))
    })
    todos.forEach((todo) => {
      const due = parseDay(todo.dueDate)
      if (due && todo.status !== "completed") todoDays.add(dateKey(due))
    })
    completions.forEach((completion) => {
      if (completion.completed) habitDays.add(completion.date)
    })

    return { eventDays, todoDays, habitDays }
  }, [events, todos, completions])

  const resetForm = () => {
    const start = nextHourDate()
    const end = addMinutes(start, 60)
    setTitle("")
    setStartDate(toDateInputValue(start))
    setStartTime(toTimeInputValue(start))
    setEndDate(toDateInputValue(end))
    setEndTime(toTimeInputValue(end))
    setLocation("")
    setNotes("")
    setTags("")
    setTodoId("")
  }

  const handleSelectDay = (day?: Date, openTodo = false) => {
    if (!day) return
    setSelectedDay(startOfDay(day))
    const value = toDateInputValue(day)
    setStartDate(value)
    setEndDate(value)
    if (openTodo) setTodoDialog({ todo: draftTodo(day), isNew: true })
  }

  const [showTodos, setShowTodos] = useState(true)
  const [showHabits, setShowHabits] = useState(true)

  /**
   * Picking a slot on the board drafts a todo for that day. Events are the
   * rarer thing here and still have their own "Add event" button, so the
   * click gesture is spent on the one people reach for constantly.
   */
  const handleSelectSlot = (start: Date, end: Date) => {
    setSelectedDay(startOfDay(start))
    // A month cell selects a whole day; only a timed slot carries a useful hour.
    const timed = start.getHours() !== 0 || start.getMinutes() !== 0
    setTodoDialog({ todo: draftTodo(start, timed ? toTimeInputValue(start) : undefined), isNew: true })
    // Keep the event form in step in case the user opens it next.
    setStartDate(toDateInputValue(start))
    setStartTime(toTimeInputValue(start))
    setEndDate(toDateInputValue(end))
    setEndTime(toTimeInputValue(end))
  }

  const handleSelectEntry = (entry: BoardEntry) => {
    setSelectedDay(startOfDay(entry.start))
    // Todo entries carry a "todo-" prefixed id (see calendar-board.tsx).
    if (entry.kind !== "todo") return
    const todo = todoById.get(entry.id.slice("todo-".length))
    if (todo) setTodoDialog({ todo, isNew: false })
  }

  const handleTodoSave = (id: string, updates: Partial<Todo>) => {
    if (todoDialog?.isNew) onCreateTodo(updates)
    else onUpdateTodo(id, updates)
  }

  const openEventForm = () => {
    const value = toDateInputValue(selectedDay)
    setStartDate(value)
    setEndDate(value)
    setShowEventForm(true)
  }

  const handleTodoChange = (id: string) => {
    setTodoId(id)
    const todo = id ? todoById.get(id) : undefined
    if (!todo) return
    setTitle((current) => current || todo.title)
    if (todo.dueDate) {
      setStartDate(todo.dueDate)
      setEndDate(todo.dueDate)
      const due = parseDay(todo.dueDate)
      if (due) setSelectedDay(due)
    }
    if (todo.dueTime) setStartTime(todo.dueTime)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const start = parseLocalDateTime(startDate, startTime)
    const end = parseLocalDateTime(endDate, endTime)
    if (!start || !end) {
      alert(t.invalidTimes)
      return
    }
    if (end <= start) {
      alert(t.endBeforeStart)
      return
    }

    const eventTitle = title.trim() || selectedTodo?.title
    if (!eventTitle) {
      alert(t.titleRequired)
      return
    }

    onAddEvent({
      title: eventTitle,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      location: location.trim() || undefined,
      notes: notes.trim() || selectedTodo?.notes || selectedTodo?.description || undefined,
      tags: splitTags(tags),
      todoId: todoId || undefined,
    })
    resetForm()
    setShowEventForm(false)
  }

  const renderEvent = (event: CalendarEvent, muted = false) => {
    const linkedTodo = event.todoId ? todoById.get(event.todoId) : undefined
    return (
      <div key={event.id} className={cn("rounded-lg border border-border bg-card p-4 shadow-sm", muted && "opacity-70")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div>
              <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatEventRange(event, t, dateLocale)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {event.location && (
                <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1">
                  <MapPin className="h-3 w-3" /> {event.location}
                </span>
              )}
              {linkedTodo && (
                <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1">
                  <Link2 className="h-3 w-3" /> {linkedTodo.title}
                </span>
              )}
              {(event.tags ?? []).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1">
                  <Tag className="h-3 w-3" /> {tag}
                </span>
              ))}
            </div>
            {event.notes && <p className="whitespace-pre-wrap text-xs text-muted-foreground">{event.notes}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={() => onRemoveEvent(event.id)} aria-label={t.deleteEvent} title={t.deleteEvent} className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const eventForm = (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t.addEventTitle}</h2>
          <p className="text-xs text-muted-foreground">{format(selectedDay, "EEE, MMM d", { locale: dateLocale })}</p>
        </div>
        <Plus className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="calendar-title">{t.title}</Label>
          <Input id="calendar-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={selectedTodo?.title ?? t.eventTitlePlaceholder} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="calendar-start-date">{t.start}</Label>
            <Input id="calendar-start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="calendar-start-time">{t.time}</Label>
            <Input id="calendar-start-time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="calendar-end-date">{t.end}</Label>
            <Input id="calendar-end-date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="calendar-end-time">{t.time}</Label>
            <Input id="calendar-end-time" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="calendar-todo">{t.linkedTodo}</Label>
          <select
            id="calendar-todo"
            value={todoId}
            onChange={(event) => handleTodoChange(event.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">{t.none}</option>
            {schedulableTodos.map((todo) => (
              <option key={todo.id} value={todo.id}>{todo.title}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="calendar-location">{t.location}</Label>
          <Input id="calendar-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder={t.optional} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="calendar-tags">{t.tags}</Label>
          <Input id="calendar-tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder={t.tagsPlaceholder} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="calendar-notes">{t.notes}</Label>
          <Textarea id="calendar-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t.optional} className="min-h-20" />
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setShowEventForm(false)} className="flex-1">{t.cancel}</Button>
          <Button type="submit" className="flex-1 gap-2">
            <Plus className="h-4 w-4" />
            {t.addEventTitle}
          </Button>
        </div>
      </div>
    </form>
  )

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={showTodos ? "default" : "outline"}
              onClick={() => setShowTodos((v) => !v)}
              className="gap-2"
            >
              <span className="h-2 w-2 rounded-full bg-finance" aria-hidden />
              {t.todos}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={showHabits ? "default" : "outline"}
              onClick={() => setShowHabits((v) => !v)}
              className="gap-2"
            >
              <span className="h-2 w-2 rounded-full bg-nutrition" aria-hidden />
              {t.habits}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {t.boardHint}
            </span>
            <Button onClick={openEventForm} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {t.addEvent}
            </Button>
          </div>
        </div>

        <CalendarBoard
          events={events}
          todos={todos}
          habits={habits}
          completions={completions}
          showTodos={showTodos}
          showHabits={showHabits}
          onSelectEvent={handleSelectEntry}
          onSelectSlot={handleSelectSlot}
        />
      </section>

      {showEventForm && eventForm}

      {todoDialog && (
        <EditTodoDialog
          key={todoDialog.todo.id}
          todo={todoDialog.todo}
          isNew={todoDialog.isNew}
          projects={projects}
          onAddProject={onAddProject}
          onSave={handleTodoSave}
          onDelete={todoDialog.isNew ? undefined : onDeleteTodo}
          onClose={() => setTodoDialog(null)}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm lg:col-start-1">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">{t.calendar}</h2>
            <p className="text-xs text-muted-foreground">{formatMessage(t.upcomingCount, { count: upcomingEvents.length })}</p>
          </div>
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
        </div>

        <DayPicker
          mode="single"
          selected={selectedDay}
          onSelect={(day) => handleSelectDay(day, true)}
          fixedWeeks
          navLayout="around"
          showOutsideDays
          weekStartsOn={1}
          locale={dateLocale}
          modifiers={{
            hasEvent: (day) => dayCounters.eventDays.has(dateKey(day)),
            hasTodo: (day) => dayCounters.todoDays.has(dateKey(day)),
            hasHabit: (day) => dayCounters.habitDays.has(dateKey(day)),
          }}
          classNames={{
            root: "w-full",
            months: "w-full",
            month: "relative w-full",
            month_caption: "flex h-10 items-center justify-center px-10",
            caption_label: "text-sm font-semibold text-foreground",
            nav: "contents",
            button_previous: "absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted",
            button_next: "absolute right-0 top-1 flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted",
            chevron: "h-4 w-4 fill-current",
            month_grid: "w-full table-fixed border-separate border-spacing-y-1",
            weekdays: "h-8",
            weekday: "h-8 text-center text-xs font-medium text-muted-foreground",
            week: "",
            day: "p-0 text-center align-middle",
            day_button: "mx-auto flex h-10 w-10 items-center justify-center rounded-md text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          }}
          modifiersClassNames={{
            selected: "[&_button]:bg-foreground [&_button]:text-background [&_button]:shadow-sm",
            today: "[&_button]:ring-1 [&_button]:ring-primary/50",
            outside: "[&_button]:text-muted-foreground/35",
            hasEvent: "[&_button]:border [&_button]:border-primary/50",
            hasTodo: "[&_button]:bg-exercise/10",
            hasHabit: "[&_button]:shadow-[inset_0_-2px_0_0_var(--success)]",
          }}
        />

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full border border-primary" />{t.events}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-exercise/70" />{t.todos}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />{t.habits}</span>
        </div>

        <Button onClick={openEventForm} className="mt-4 h-12 w-full gap-2 text-base">
          <Plus className="h-5 w-5" />
          {t.addEvent}
        </Button>
      </section>

      <section className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">{format(selectedDay, "EEEE, MMM d", { locale: dateLocale })}</h2>
              <p className="text-xs text-muted-foreground">
                {formatMessage(t.daySummary, { events: selectedEvents.length, todos: selectedTodos.length, habits: selectedHabits.length })}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleSelectDay(new Date())}>{t.today}</Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{t.events}</h3>
              {selectedEvents.length ? (
                <div className="space-y-3">{selectedEvents.map((event) => renderEvent(event))}</div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{t.noEvents}</div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{t.todos}</h3>
              {selectedTodos.length ? (
                <div className="space-y-2">
                  {selectedTodos.map((todo) => (
                    <div key={todo.id} className={cn("rounded-lg border border-border bg-background p-3", todo.status === "completed" && "opacity-60")}>
                      <p className={cn("text-sm font-medium text-foreground", todo.status === "completed" && "line-through")}>{todo.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {todo.dueTime && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{todo.dueTime}</span>}
                        <span>{formatMessage(t.priority, { priority: todo.priority })}</span>
                        <span>{t.status[todo.status as keyof typeof t.status] ?? todo.status.replace("_", " ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{t.noTodos}</div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{t.habits}</h3>
              {selectedHabits.length ? (
                <div className="space-y-2">
                  {selectedHabits.map(({ habit, completion }) => (
                    <div key={habit.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{habit.name}</p>
                        <p className="text-xs text-muted-foreground">{habit.time || t.anyTime}</p>
                      </div>
                      {completion?.completed ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                      ) : (
                        <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{t.noHabits}</div>
              )}
            </div>
          </div>
        </div>

        {upcomingEvents.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">{t.upcoming}</h2>
              <span className="text-xs text-muted-foreground">{upcomingEvents.length}</span>
            </div>
            <div className="grid gap-3 xl:grid-cols-2">{upcomingEvents.slice(0, 6).map((event) => renderEvent(event))}</div>
          </section>
        )}
      </section>

      </div>
    </div>
  )
})
