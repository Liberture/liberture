"use client"

import { useId, useMemo, useState } from "react"
import { Trash2 } from "lucide-react"
import { AppDialog } from "@/components/habits/ui/app-dialog"
import { Button } from "@/components/habits/ui/button"
import { Input } from "@/components/habits/ui/input"
import { Label } from "@/components/habits/ui/label"
import { Textarea } from "@/components/habits/ui/textarea"
import { ConfirmDialog } from "@/components/habits/todos/confirm-dialog"
import { splitTags } from "@/components/habits/todos/todo-meta"
import type { CalendarEvent, Todo } from "@/lib/habits/types"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"
import { parseLocalDateTime, toDateInputValue, toTimeInputValue } from "@/components/habits/calendar/calendar-utils"

export type EventDraft = Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">

type FieldError = "title" | "times" | "order" | null

/** Create or edit a calendar event. Validation is inline, never `alert()`. */
export function EventDialog({
  event,
  start,
  end,
  initialTitle = "",
  todos,
  onSave,
  onDelete,
  onClose,
}: {
  /** The event being edited; omit to create. */
  event?: CalendarEvent
  start: Date
  end: Date
  initialTitle?: string
  /** Open todos offered as the linked todo. */
  todos: Todo[]
  onSave: (draft: EventDraft) => void
  onDelete?: (event: CalendarEvent) => void
  onClose: () => void
}) {
  const t = useTranslations().habits.app.calendarView
  const id = useId()
  const [title, setTitle] = useState(event?.title ?? initialTitle)
  const [startDate, setStartDate] = useState(toDateInputValue(start))
  const [startTime, setStartTime] = useState(toTimeInputValue(start))
  const [endDate, setEndDate] = useState(toDateInputValue(end))
  const [endTime, setEndTime] = useState(toTimeInputValue(end))
  const [location, setLocation] = useState(event?.location ?? "")
  const [notes, setNotes] = useState(event?.notes ?? "")
  const [tags, setTags] = useState((event?.tags ?? []).join(", "))
  const [todoId, setTodoId] = useState(event?.todoId ?? "")
  const [error, setError] = useState<FieldError>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const todoById = useMemo(() => new Map(todos.map((todo) => [todo.id, todo])), [todos])
  const selectedTodo = todoId ? todoById.get(todoId) : undefined
  const todoOptions = useMemo(
    () =>
      todos
        .filter((todo) => todo.status !== "completed" || todo.id === event?.todoId)
        .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title)),
    [todos, event?.todoId],
  )

  const snapshot = JSON.stringify([title, startDate, startTime, endDate, endTime, location, notes, tags, todoId])
  const [initialSnapshot] = useState(snapshot)
  const dirty = snapshot !== initialSnapshot

  const handleTodoChange = (value: string) => {
    setTodoId(value)
    const todo = value ? todoById.get(value) : undefined
    if (!todo) return
    setTitle((current) => current || todo.title)
    if (todo.dueDate) {
      setStartDate(todo.dueDate)
      setEndDate(todo.dueDate)
    }
    if (todo.dueTime) setStartTime(todo.dueTime)
  }

  const submit = () => {
    const eventTitle = title.trim() || selectedTodo?.title
    if (!eventTitle) return setError("title")
    const startsAt = parseLocalDateTime(startDate, startTime)
    const endsAt = parseLocalDateTime(endDate, endTime)
    if (!startsAt || !endsAt) return setError("times")
    if (endsAt <= startsAt) return setError("order")

    onSave({
      title: eventTitle,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      location: location.trim() || undefined,
      notes: notes.trim() || (event ? undefined : selectedTodo?.notes || selectedTodo?.description) || undefined,
      tags: splitTags(tags),
      todoId: todoId || undefined,
    })
    onClose()
  }

  const timeError = error === "times" ? t.invalidTimes : error === "order" ? t.endBeforeStart : null
  const clearError = () => setError(null)

  return (
    <>
      <AppDialog
        open={!confirmDelete}
        onClose={onClose}
        title={event ? t.editEventTitle : t.newEventTitle}
        dirty={dirty}
        size="sm"
        footer={
          <>
            {event && onDelete && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                className="mr-auto gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                {t.deleteEvent}
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button type="submit" form={`${id}-form`}>
              {event ? t.saveEvent : t.addEventTitle}
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
            <Label htmlFor={`${id}-title`}>{t.title}</Label>
            <Input
              id={`${id}-title`}
              value={title}
              data-autofocus
              onChange={(e) => {
                setTitle(e.target.value)
                clearError()
              }}
              placeholder={selectedTodo?.title ?? t.eventTitlePlaceholder}
              aria-invalid={error === "title" || undefined}
              aria-describedby={error === "title" ? `${id}-title-error` : undefined}
            />
            {error === "title" && (
              <p id={`${id}-title-error`} role="alert" className="text-xs font-medium text-destructive">
                {t.titleRequired}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-start-date`}>{t.start}</Label>
              <Input id={`${id}-start-date`} type="date" value={startDate} aria-invalid={Boolean(timeError) || undefined} onChange={(e) => { setStartDate(e.target.value); clearError() }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-start-time`}>{t.time}</Label>
              <Input id={`${id}-start-time`} type="time" value={startTime} aria-invalid={Boolean(timeError) || undefined} onChange={(e) => { setStartTime(e.target.value); clearError() }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-end-date`}>{t.end}</Label>
              <Input id={`${id}-end-date`} type="date" value={endDate} aria-invalid={Boolean(timeError) || undefined} onChange={(e) => { setEndDate(e.target.value); clearError() }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-end-time`}>{t.time}</Label>
              <Input id={`${id}-end-time`} type="time" value={endTime} aria-invalid={Boolean(timeError) || undefined} onChange={(e) => { setEndTime(e.target.value); clearError() }} />
            </div>
          </div>
          {timeError && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {timeError}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor={`${id}-todo`}>{t.linkedTodo}</Label>
            <select
              id={`${id}-todo`}
              value={todoId}
              onChange={(e) => handleTodoChange(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">{t.none}</option>
              {todoOptions.map((todo) => (
                <option key={todo.id} value={todo.id}>
                  {todo.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${id}-location`}>{t.location}</Label>
            <Input id={`${id}-location`} value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t.optional} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${id}-tags`}>{t.tags}</Label>
            <Input id={`${id}-tags`} value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t.tagsPlaceholder} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${id}-notes`}>{t.notes}</Label>
            <Textarea id={`${id}-notes`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.optional} className="min-h-20" />
          </div>
        </form>
      </AppDialog>

      {event && onDelete && (
        <ConfirmDialog
          open={confirmDelete}
          title={t.deleteEventTitle}
          body={formatMessage(t.deleteEventBody, { title: event.title })}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            onDelete(event)
            onClose()
          }}
        />
      )}
    </>
  )
}
