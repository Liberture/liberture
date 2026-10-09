"use client"

import { memo, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Plus } from "lucide-react"
import { isSameDay, isValid, parseISO, startOfDay } from "date-fns"
import type { CalendarEvent, Habit, HabitCompletion, Project, Todo } from "@/lib/habits/types"
import { EditTodoDialog } from "@/components/habits/edit-todo-dialog"
import type { BoardEntry, BoardSlotAction } from "@/components/habits/calendar-board"
import { Button } from "@/components/habits/ui/button"
import { notify } from "@/components/habits/ui/toast"
import { DayPanel } from "@/components/habits/calendar/day-panel"
import { EventDialog, type EventDraft } from "@/components/habits/calendar/event-dialog"
import { QuickCreateDialog, type QuickCreateKind } from "@/components/habits/calendar/quick-create-dialog"
import {
  addMinutes,
  dateKey,
  eventIntersectsDay,
  habitRunsOnDate,
  isUntimed,
  nextHourDate,
  parseDay,
  toTimeInputValue,
  type TimeFormat,
  type WeekStart,
} from "@/components/habits/calendar/calendar-utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"
import { cn } from "@/lib/utils"

function CalendarLoading() {
  const t = useTranslations().habits.app.calendarView
  return (
    <div className="flex h-[min(72dvh,720px)] min-h-[420px] items-center justify-center rounded-xl border border-border bg-card/60">
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

interface CalendarViewProps {
  events: CalendarEvent[]
  todos: Todo[]
  habits: Habit[]
  completions: HabitCompletion[]
  onAddEvent: (event: EventDraft) => void
  onRemoveEvent: (id: string) => void
  /**
   * Edits an event in place (keeps its id). Without it, edits and drag-moves
   * fall back to remove + add, which gives the event a new id.
   */
  onUpdateEvent?: (id: string, updates: Partial<EventDraft>) => void
  projects: Project[]
  onAddProject: (name: string) => Project
  onCreateTodo: (updates: Partial<Todo>) => void
  onUpdateTodo: (id: string, updates: Partial<Todo>) => void
  onDeleteTodo: (id: string) => void
  /** Makes habits in the day panel tickable. `date` is "yyyy-MM-dd". */
  onToggleHabit?: (habitId: string, date: string) => void
  weekStartsOn?: WeekStart
  timeFormat?: TimeFormat
}

/**
 * Blank todo pre-filled with the day (and time, when the click landed on a
 * timed slot) the user picked. It is never stored until the dialog saves —
 * EditTodoDialog just needs a full Todo to render.
 */
function draftTodo(day: Date, time?: string, title = ""): Todo {
  return {
    id: crypto.randomUUID(),
    title,
    dueDate: dateKey(day),
    dueTime: time,
    priority: 3,
    status: "incomplete",
    createdAt: new Date().toISOString(),
  }
}

type EventDialogState = { event?: CalendarEvent; start: Date; end: Date; title?: string }

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
  onUpdateEvent,
  projects,
  onAddProject,
  onCreateTodo,
  onUpdateTodo,
  onDeleteTodo,
  onToggleHabit,
  weekStartsOn = 1,
  timeFormat = "24h",
}: CalendarViewProps) {
  const t = useTranslations().habits.app.calendarView
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()))
  const [boardDate, setBoardDate] = useState(() => new Date())
  const [showTodos, setShowTodos] = useState(true)
  const [showHabits, setShowHabits] = useState(true)
  const [quickCreate, setQuickCreate] = useState<{ start: Date; end: Date } | null>(null)
  const [eventDialog, setEventDialog] = useState<EventDialogState | null>(null)
  const [todoDialog, setTodoDialog] = useState<{ todo: Todo; isNew: boolean } | null>(null)

  const todoById = useMemo(() => new Map(todos.map((todo) => [todo.id, todo])), [todos])
  const completionByDayAndHabit = useMemo(
    () => new Map(completions.map((completion) => [completion.date + ":" + completion.habitId, completion])),
    [completions],
  )
  const sortedEvents = useMemo(() => [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt)), [events])

  const now = Date.now()
  const upcomingEvents = sortedEvents.filter((event) => new Date(event.endsAt).getTime() >= now)
  const selectedKey = dateKey(selectedDay)
  const selectedEvents = sortedEvents.filter((event) => eventIntersectsDay(event, selectedDay))
  const selectedTodos = todos
    .filter((todo) => {
      const due = parseDay(todo.dueDate)
      return due ? isSameDay(due, selectedDay) : false
    })
    .sort((a, b) => (a.dueTime ?? "99:99").localeCompare(b.dueTime ?? "99:99") || b.priority - a.priority)
  const selectedHabits = habits
    .filter((habit) => !habit.archived)
    .map((habit) => ({ habit, completion: completionByDayAndHabit.get(selectedKey + ":" + habit.id) }))
    .filter(({ habit, completion }) => habitRunsOnDate(habit, selectedDay, Boolean(completion?.completed)))
    .sort((a, b) => (a.habit.time || "00:00").localeCompare(b.habit.time || "00:00"))

  /** Day click / panel arrows: select the day and bring the board along. */
  const selectDay = (day: Date) => {
    setSelectedDay(startOfDay(day))
    setBoardDate(day)
  }

  const handleNavigate = (date: Date) => {
    setBoardDate(date)
    setSelectedDay(startOfDay(date))
  }

  /**
   * A plain click on a month cell only selects that day (the agenda panel
   * follows). Picking a time — or dragging across days — opens the small
   * "event or todo?" dialog right away.
   */
  const handleSelectSlot = (start: Date, end: Date, { action, view }: BoardSlotAction) => {
    setSelectedDay(startOfDay(start))
    const singleDay = end.getTime() - start.getTime() <= 24 * 60 * 60_000
    if (view === "month" && (action === "click" || singleDay)) return
    setQuickCreate({ start, end })
  }

  const handleSelectEntry = (entry: BoardEntry) => {
    setSelectedDay(startOfDay(entry.start))
    if (entry.kind === "event" && entry.source) {
      const start = parseISO(entry.source.startsAt)
      const end = parseISO(entry.source.endsAt)
      setEventDialog({ event: entry.source, start: isValid(start) ? start : entry.start, end: isValid(end) ? end : entry.end })
      return
    }
    // Todo entries carry a "todo-" prefixed id (see calendar-board.tsx).
    if (entry.kind !== "todo") return
    const todo = todoById.get(entry.id.slice("todo-".length))
    if (todo) setTodoDialog({ todo, isNew: false })
  }

  const openAdd = () => {
    const start = nextHourDate(selectedDay)
    setQuickCreate({ start, end: addMinutes(start, 60) })
  }

  const updateEvent = (event: CalendarEvent, updates: Partial<EventDraft>) => {
    if (onUpdateEvent) {
      onUpdateEvent(event.id, updates)
      return
    }
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = event
    onRemoveEvent(id)
    onAddEvent({ ...rest, ...updates })
  }

  const createFromQuick = (kind: QuickCreateKind, title: string, start: Date, end: Date) => {
    const untimed = isUntimed(start, end)
    if (kind === "event") {
      onAddEvent({ title, startsAt: start.toISOString(), endsAt: end.toISOString(), tags: [] })
      notify.success(formatMessage(t.eventAdded, { title }))
    } else {
      onCreateTodo({ title, dueDate: dateKey(start), dueTime: untimed ? undefined : toTimeInputValue(start), priority: 3, status: "incomplete" })
      notify.success(formatMessage(t.todoAdded, { title }))
    }
  }

  const filterButton = (active: boolean, toggle: () => void, dot: string, label: string) => (
    <Button type="button" size="sm" variant={active ? "default" : "outline"} aria-pressed={active} onClick={toggle} className="gap-2">
      <span className={cn("h-2 w-2 rounded-full", dot)} aria-hidden />
      {label}
    </Button>
  )

  return (
    <div className="mx-auto max-w-7xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label={t.filters} className="flex flex-wrap items-center gap-2">
          {filterButton(showTodos, () => setShowTodos((v) => !v), "bg-finance", t.todos)}
          {filterButton(showHabits, () => setShowHabits((v) => !v), "bg-nutrition", t.habits)}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground md:inline">{t.boardHint}</span>
          <Button onClick={openAdd} size="sm" className="gap-2" aria-label={t.addAria}>
            <Plus className="h-4 w-4" />
            {t.add}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <CalendarBoard
          events={events}
          todos={todos}
          habits={habits}
          completions={completions}
          showTodos={showTodos}
          showHabits={showHabits}
          date={boardDate}
          onNavigate={handleNavigate}
          selectedDay={selectedDay}
          weekStartsOn={weekStartsOn}
          timeFormat={timeFormat}
          onSelectEvent={handleSelectEntry}
          onSelectSlot={handleSelectSlot}
          onMoveEvent={(event, start, end) => {
            updateEvent(event, { startsAt: start.toISOString(), endsAt: end.toISOString() })
            notify.success(formatMessage(t.eventMoved, { title: event.title }))
          }}
        />

        <DayPanel
          day={selectedDay}
          onSelectDay={selectDay}
          events={selectedEvents}
          todos={selectedTodos}
          habits={selectedHabits}
          upcoming={upcomingEvents}
          todoById={todoById}
          timeFormat={timeFormat}
          onEditEvent={(event) => setEventDialog({ event, start: parseISO(event.startsAt), end: parseISO(event.endsAt) })}
          onEditTodo={(todo) => setTodoDialog({ todo, isNew: false })}
          onToggleTodo={(todo) => onUpdateTodo(todo.id, { status: todo.status === "completed" ? "incomplete" : "completed" })}
          onToggleHabit={onToggleHabit}
        />
      </div>

      {quickCreate && (
        <QuickCreateDialog
          start={quickCreate.start}
          end={quickCreate.end}
          timeFormat={timeFormat}
          onClose={() => setQuickCreate(null)}
          onCreate={(kind, title) => createFromQuick(kind, title, quickCreate.start, quickCreate.end)}
          onMoreOptions={(kind, title) => {
            const { start, end } = quickCreate
            setQuickCreate(null)
            if (kind === "event") {
              setEventDialog({ start, end, title })
            } else {
              setTodoDialog({ todo: draftTodo(start, isUntimed(start, end) ? undefined : toTimeInputValue(start), title), isNew: true })
            }
          }}
        />
      )}

      {eventDialog && (
        <EventDialog
          key={eventDialog.event?.id ?? "new"}
          event={eventDialog.event}
          start={eventDialog.start}
          end={eventDialog.end}
          initialTitle={eventDialog.title}
          todos={todos}
          onClose={() => setEventDialog(null)}
          onSave={(draft) => {
            if (eventDialog.event) {
              updateEvent(eventDialog.event, draft)
              notify.success(formatMessage(t.eventSaved, { title: draft.title }))
            } else {
              onAddEvent(draft)
              notify.success(formatMessage(t.eventAdded, { title: draft.title }))
            }
          }}
          onDelete={(event) => {
            onRemoveEvent(event.id)
            notify.success(formatMessage(t.eventDeleted, { title: event.title }))
          }}
        />
      )}

      {todoDialog && (
        <EditTodoDialog
          key={todoDialog.todo.id}
          todo={todoDialog.todo}
          isNew={todoDialog.isNew}
          projects={projects}
          onAddProject={onAddProject}
          onSave={(id, updates) => {
            if (todoDialog.isNew) {
              onCreateTodo(updates)
              if (updates.title) notify.success(formatMessage(t.todoAdded, { title: updates.title }))
            } else {
              onUpdateTodo(id, updates)
            }
          }}
          onDelete={todoDialog.isNew ? undefined : onDeleteTodo}
          onClose={() => setTodoDialog(null)}
        />
      )}
    </div>
  )
})
