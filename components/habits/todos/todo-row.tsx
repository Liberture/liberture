"use client"

import { CalendarPlus, Check, Clock, Edit2, Flag, Folder, ListChecks, Trash2 } from "lucide-react"
import { differenceInCalendarDays, format, isPast, isToday, isTomorrow, isValid, parseISO } from "date-fns"
import { Button } from "@/components/habits/ui/button"
import { LinkifiedText } from "@/components/habits/ui/linkified-text"
import { priorityColor, priorityLabel } from "@/components/habits/todos/todo-meta"
import type { Todo } from "@/lib/habits/types"
import { cn } from "@/lib/utils"
import { useDateLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage, plural } from "@/lib/i18n-format"

const DAY_MS = 1000 * 60 * 60 * 24

function normalizeText(value?: string) {
  return value?.trim().replace(/\s+/g, " ") ?? ""
}

/** Notes are shown only when they add something beyond the description. */
function visibleNotes(todo: Todo) {
  const notes = normalizeText(todo.notes)
  if (!notes || notes === normalizeText(todo.description)) return undefined
  return todo.notes
}

export function TodoRow({
  todo,
  projectName,
  onToggleComplete,
  onEdit,
  onDelete,
  onSchedule,
}: {
  todo: Todo
  projectName: string
  onToggleComplete: (id: string) => void
  onEdit?: (todo: Todo) => void
  onDelete: (todo: Todo) => void
  onSchedule?: (todo: Todo) => void
}) {
  const t = useTranslations().habits.app.todoList
  const dateLocale = useDateLocale()
  const completed = todo.status === "completed"
  const notes = completed ? undefined : visibleNotes(todo)
  const subtasks = todo.subtasks ?? []
  const subtasksDone = subtasks.filter((s) => s.completed).length

  const dueLabel = (() => {
    if (!todo.dueDate) return ""
    const date = parseISO(todo.dueDate)
    if (!isValid(date)) return ""
    if (isPast(date) && !isToday(date)) return plural(t.overdue, Math.floor((Date.now() - date.getTime()) / DAY_MS))
    if (isToday(date)) return todo.dueTime ? formatMessage(t.todayAt, { time: todo.dueTime }) : t.today
    if (isTomorrow(date)) return t.tomorrow
    const daysUntil = Math.ceil((date.getTime() - Date.now()) / DAY_MS)
    if (daysUntil > 0 && daysUntil <= 7) return plural(t.inDays, daysUntil)
    return format(date, t.shortDateFormat, { locale: dateLocale })
  })()

  const dueDate = todo.dueDate ? parseISO(todo.dueDate) : null
  const dueValid = dueDate !== null && isValid(dueDate)
  const dueIsToday = dueValid && isToday(dueDate)
  const dueColor = !dueValid
    ? "text-muted-foreground"
    : isPast(dueDate) && !dueIsToday
      ? "text-destructive"
      : dueIsToday
        ? "text-exercise"
        : "text-muted-foreground"

  const completedOn = todo.completedAt ? parseISO(todo.completedAt) : null
  const completedLabel =
    completedOn && isValid(completedOn)
      ? formatMessage(t.completedOn, { date: format(completedOn, t.longDateFormat, { locale: dateLocale }) })
      : t.completed
  const deadlineDelta = completed && dueValid && completedOn && isValid(completedOn) ? differenceInCalendarDays(completedOn, dueDate) : null
  const deadlineLabel =
    deadlineDelta === null ? "" : deadlineDelta === 0 ? t.onTime : deadlineDelta > 0 ? plural(t.daysLate, deadlineDelta) : plural(t.daysEarly, -deadlineDelta)

  return (
    <div
      className={cn(
        "group grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/30 sm:flex sm:gap-4 sm:p-4",
        completed && "opacity-65",
      )}
    >
      <button
        type="button"
        onClick={() => onToggleComplete(todo.id)}
        aria-pressed={completed}
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          todo.status === "in_progress"
            ? "border-work/30 bg-work/10"
            : completed
              ? "border-nutrition/30 bg-nutrition text-success-foreground"
              : "border-border hover:border-primary hover:bg-primary/10",
        )}
        aria-label={completed ? t.markActive : t.markComplete}
      >
        {todo.status === "in_progress" && <span className="h-2 w-2 rounded-full bg-work" />}
        {completed && <Check className="h-3 w-3" />}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "break-words text-sm font-medium text-foreground [overflow-wrap:anywhere] sm:text-base",
            completed && "text-muted-foreground line-through",
          )}
        >
          {todo.title}
        </p>
        {!completed && todo.description && (
          <LinkifiedText text={todo.description} className="mt-1 block whitespace-pre-wrap break-words text-sm text-muted-foreground [overflow-wrap:anywhere]" />
        )}
        {notes && <LinkifiedText text={notes} className="mt-1 block whitespace-pre-wrap break-words text-sm text-muted-foreground [overflow-wrap:anywhere]" />}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {todo.status === "in_progress" && (
            <span className="flex items-center gap-1 text-work">
              <span className="h-1.5 w-1.5 rounded-full bg-work" />
              {t.inProgress}
            </span>
          )}
          {completed ? (
            <>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {completedLabel}
              </span>
              {deadlineDelta !== null && (
                <span
                  title={dueValid ? formatMessage(t.expectedBy, { date: format(dueDate, t.longDateFormat, { locale: dateLocale }) }) : undefined}
                  className={cn(
                    "rounded border px-1.5 py-0.5 text-[11px]",
                    deadlineDelta > 0 ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-nutrition/30 bg-nutrition/10 text-nutrition",
                  )}
                >
                  {deadlineLabel}
                </span>
              )}
            </>
          ) : dueLabel ? (
            <span className={cn("flex items-center gap-1", dueColor)}>
              {dueIsToday && <span className="h-1.5 w-1.5 rounded-full bg-exercise" />}
              <Clock className="h-3.5 w-3.5" />
              {dueLabel}
            </span>
          ) : null}
          {!completed && todo.canTopolinoHelp && (
            <span className="rounded border border-work/30 bg-work/10 px-1.5 py-0.5 text-[11px] text-work">{t.topolino}</span>
          )}
          <span className="flex min-w-0 max-w-full items-center gap-1">
            <Folder className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{projectName}</span>
          </span>
          {!completed && (
            <span className={cn("flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px]", priorityColor(todo.priority))}>
              <Flag className="h-3 w-3" />
              {priorityLabel(todo.priority, t)}
            </span>
          )}
          {!completed && subtasks.length > 0 && (
            <span className="flex items-center gap-1">
              <ListChecks className="h-3.5 w-3.5" />
              {formatMessage(t.subtasksProgress, { done: subtasksDone, total: subtasks.length })}
            </span>
          )}
          {!completed && todo.estimatedMinutes ? <span>{formatMessage(t.estimate, { minutes: todo.estimatedMinutes })}</span> : null}
          {!completed &&
            (todo.tags ?? []).map((tag) => (
              <span key={tag} className="rounded border border-border px-1.5 py-0.5 text-[11px]">
                #{tag}
              </span>
            ))}
        </div>
      </div>
      {/* Always visible on touch screens (no hover there); revealed on hover
          or keyboard focus where a pointer can hover. */}
      <div className="col-start-2 flex justify-end gap-1 transition-opacity sm:col-start-auto sm:shrink-0 [@media(hover:hover)]:sm:opacity-0 [@media(hover:hover)]:sm:group-hover:opacity-100 [@media(hover:hover)]:sm:group-focus-within:opacity-100">
        {!completed && onSchedule && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSchedule(todo)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
            aria-label={formatMessage(t.schedule, { title: todo.title })}
            title={formatMessage(t.schedule, { title: todo.title })}
          >
            <CalendarPlus className="h-4 w-4" />
          </Button>
        )}
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={() => onEdit(todo)} className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" aria-label={t.edit} title={t.edit}>
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(todo)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          aria-label={t.delete}
          title={t.delete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
