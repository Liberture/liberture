"use client"

import { memo, useMemo, useState } from "react"
import { Check, ChevronDown, ChevronRight, Clock, Edit2, Flag, Folder, FolderPlus, Plus, Trash2, X } from "lucide-react"
import { differenceInCalendarDays, format, isPast, isToday, isTomorrow, isValid, parseISO } from "date-fns"
import { EditTodoDialog } from "@/components/habits/edit-todo-dialog"
import { Button } from "@/components/habits/ui/button"
import { LinkifiedText } from "@/components/habits/ui/linkified-text"
import type { Project, Todo } from "@/lib/habits/types"
import { cn } from "@/lib/utils"
import { useTranslations, useDateLocale } from "@/components/i18n/locale-provider"
import { formatMessage, plural } from "@/lib/i18n-format"

interface TodoListProps {
  todos: Todo[]
  projects: Project[]
  onToggleComplete: (id: string) => void
  onRemove: (id: string) => void
  onAddTodo: (
    title: string,
    dueDate?: string,
    dueTime?: string,
    priority?: Todo["priority"],
    description?: string,
    status?: Todo["status"],
    canTopolinoHelp?: boolean,
    projectId?: string,
    estimatedMinutes?: number,
    energyLevel?: Todo["energyLevel"],
    tags?: string[],
    notes?: string,
  ) => void
  onAddProject: (name: string) => Project
  onUpdateProject?: (id: string, updates: Pick<Project, "name" | "color">) => void
  onDeleteProject?: (id: string) => void
  onEdit?: (todo: Todo) => void
}

/**
 * Memoised: the view track keeps every visited screen mounted, so this
 * re-renders whenever it becomes active again. With stable props that is pure
 * waste — this component is one of the expensive ones to rebuild.
 */
export const TodoList = memo(function TodoList({
  todos,
  projects,
  onToggleComplete,
  onRemove,
  onAddTodo,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onEdit,
}: TodoListProps) {
  const t = useTranslations().habits.app.todoList
  const dateLocale = useDateLocale()
  const [draftTodo, setDraftTodo] = useState<Todo | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState("all")
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [projectDraftName, setProjectDraftName] = useState("")
  const [projectDraftColor, setProjectDraftColor] = useState("#64748b")

  const projectIds = useMemo(() => new Set(projects.map((project) => project.id)), [projects])
  const isUncategorized = (todo: Todo) => !todo.projectId || !projectIds.has(todo.projectId)

  const matchesSelectedProject = (todo: Todo) => {
    if (selectedProjectId === "all") return true
    if (selectedProjectId === "uncategorized") return isUncategorized(todo)
    return todo.projectId === selectedProjectId
  }

  const sortedTodos = [...todos.filter(matchesSelectedProject)].sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority

    const statusOrder = { in_progress: 0, incomplete: 1, completed: 2 }
    if (a.status !== b.status) return statusOrder[a.status] - statusOrder[b.status]

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const activeTodos = sortedTodos.filter((todo) => todo.status !== "completed")
  const completedTodos = sortedTodos.filter((todo) => todo.status === "completed")
  const activeAllTodos = todos.filter((todo) => todo.status !== "completed")
  const uncategorizedCount = activeAllTodos.filter(isUncategorized).length
  const activeProject = projects.find((project) => project.id === selectedProjectId)
  const selectedProjectName =
    selectedProjectId === "all" ? t.allTodos : selectedProjectId === "uncategorized" ? t.uncategorized : activeProject?.name ?? t.project
  const projectFilters = [
    { id: "all", name: t.all, count: activeAllTodos.length },
    { id: "uncategorized", name: t.uncategorized, count: uncategorizedCount },
    ...projects.map((project) => ({
      id: project.id,
      name: project.name,
      count: activeAllTodos.filter((todo) => todo.projectId === project.id).length,
    })),
  ]

  const getProjectName = (projectId?: string) => {
    if (!projectId) return t.uncategorized
    return projects.find((project) => project.id === projectId)?.name ?? t.uncategorized
  }

  const createProject = () => {
    const name = newProjectName.trim()
    if (!name) return
    const project = onAddProject(name)
    setNewProjectName("")
    setShowNewProjectDialog(false)
    setSelectedProjectId(project.id)
  }

  const startEditingProject = (project: Project) => {
    setEditingProjectId(project.id)
    setProjectDraftName(project.name)
    setProjectDraftColor(project.color || "#64748b")
  }

  const saveProject = () => {
    if (!editingProjectId || !onUpdateProject) return
    const name = projectDraftName.trim()
    if (!name) return
    onUpdateProject(editingProjectId, { name, color: projectDraftColor })
    setEditingProjectId(null)
  }

  const deleteProject = () => {
    if (!editingProjectId || !onDeleteProject) return
    onDeleteProject(editingProjectId)
    setSelectedProjectId("uncategorized")
    setEditingProjectId(null)
  }

  const selectedProjectForNewTodo = () => selectedProjectId === "all" || selectedProjectId === "uncategorized" ? undefined : selectedProjectId

  const openNewTodoDialog = () => {
    const now = new Date().toISOString()
    setDraftTodo({
      id: "__new_todo__",
      title: "",
      priority: 3,
      status: "incomplete",
      createdAt: now,
      updatedAt: now,
      canTopolinoHelp: false,
      projectId: selectedProjectForNewTodo(),
    })
  }

  const normalizeText = (value?: string) => value?.trim().replace(/\s+/g, " ") ?? ""
  const getVisibleNotes = (todo: Todo) => {
    const description = normalizeText(todo.description)
    const notes = normalizeText(todo.notes)
    if (!notes || notes === description) return undefined
    return todo.notes
  }

  const getPriorityColor = (priority: Todo["priority"]) => {
    switch (priority) {
      case 1:
        return "border-nutrition/30 bg-nutrition/10 text-nutrition"
      case 2:
        return "border-nutrition/30 bg-nutrition/10 text-nutrition"
      case 3:
        return "border-exercise/30 bg-exercise/10 text-exercise"
      case 4:
        return "border-exercise/30 bg-exercise/10 text-exercise"
      case 5:
        return "border-destructive/30 bg-destructive/10 text-destructive"
      default:
        return "border-border bg-muted/20 text-muted-foreground"
    }
  }

  const getPriorityLabel = (priority: Todo["priority"]) => {
    switch (priority) {
      case 1:
        return t.priorities.low
      case 2:
        return t.priorities.medLow
      case 3:
        return t.priorities.medium
      case 4:
        return t.priorities.high
      case 5:
        return t.priorities.critical
      default:
        return t.priorities.normal
    }
  }

  const getDaysAgo = (dueDate: string) => {
    const date = parseISO(dueDate)
    if (!isValid(date)) return 0
    return Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getDaysUntil = (dueDate: string) => {
    const date = parseISO(dueDate)
    if (!isValid(date)) return 0
    return Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  }

  const getDueDateLabel = (dueDate: string, dueTime?: string) => {
    if (!dueDate) return ""
    const date = parseISO(dueDate)
    if (!isValid(date)) return ""

    if (isPast(date) && !isToday(date)) {
      const daysAgo = getDaysAgo(dueDate)
      return plural(t.overdue, daysAgo)
    }
    if (isToday(date)) return dueTime ? formatMessage(t.todayAt, { time: dueTime }) : t.today
    if (isTomorrow(date)) return t.tomorrow

    const daysUntil = getDaysUntil(dueDate)
    if (daysUntil > 0 && daysUntil <= 7) return plural(t.inDays, daysUntil)

    return format(date, t.shortDateFormat, { locale: dateLocale })
  }

  const getDueDateColor = (dueDate: string) => {
    if (!dueDate) return "text-muted-foreground"
    const date = parseISO(dueDate)
    if (!isValid(date)) return "text-muted-foreground"
    if (isPast(date) && !isToday(date)) return "text-destructive"
    if (isToday(date)) return "text-exercise"
    return "text-muted-foreground"
  }

  const isTodayDue = (dueDate: string) => {
    if (!dueDate) return false
    const date = parseISO(dueDate)
    return isValid(date) && isToday(date)
  }

  const getDeadlineDelta = (todo: Todo) => {
    if (!todo.dueDate || !todo.completedAt) return null
    const due = parseISO(todo.dueDate)
    const completedOn = parseISO(todo.completedAt)
    if (!isValid(due) || !isValid(completedOn)) return null
    return differenceInCalendarDays(completedOn, due)
  }

  const getDeadlineDeltaLabel = (delta: number) => {
    if (delta === 0) return t.onTime
    if (delta > 0) return plural(t.daysLate, delta)
    return plural(t.daysEarly, -delta)
  }

  const getCompletedLabel = (completedAt?: string) => {
    if (!completedAt) return t.completed
    const date = parseISO(completedAt)
    if (!isValid(date)) return t.completed
    return formatMessage(t.completedOn, { date: format(date, t.longDateFormat, { locale: dateLocale }) })
  }

  const getStatusIcon = (status: Todo["status"]) => {
    switch (status) {
      case "in_progress":
        return <div className="h-2 w-2 rounded-full bg-work" />
      case "completed":
        return <Check className="h-3 w-3" />
      default:
        return null
    }
  }

  const getStatusColor = (status: Todo["status"]) => {
    switch (status) {
      case "in_progress":
        return "border-work/30 bg-work/10"
      case "completed":
        return "border-nutrition/30 bg-nutrition text-success-foreground"
      default:
        return "border-border hover:border-primary hover:bg-primary/10"
    }
  }

  const renderTodo = (todo: Todo, completed = false) => {
    const deadlineDelta = completed ? getDeadlineDelta(todo) : null
    return (
    <div
      key={todo.id}
      className={cn(
        "group grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/30 sm:flex sm:gap-4 sm:p-4",
        completed && "opacity-65",
      )}
    >
      <button
        type="button"
        onClick={() => onToggleComplete(todo.id)}
        className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors", getStatusColor(todo.status))}
        aria-label={completed ? t.markActive : t.markComplete}
      >
        {getStatusIcon(todo.status)}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("break-words [overflow-wrap:anywhere] text-sm font-medium text-foreground sm:text-base", completed && "line-through text-muted-foreground")}>{todo.title}</p>
        {!completed && todo.description && <LinkifiedText text={todo.description} className="mt-1 block whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm text-muted-foreground" />}
        {!completed && getVisibleNotes(todo) && (
          <LinkifiedText text={getVisibleNotes(todo)!} className="mt-1 block whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm text-muted-foreground" />
        )}
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
                {getCompletedLabel(todo.completedAt)}
              </span>
              {deadlineDelta !== null && (
                <span
                  title={todo.dueDate ? formatMessage(t.expectedBy, { date: format(parseISO(todo.dueDate), t.longDateFormat, { locale: dateLocale }) }) : undefined}
                  className={cn(
                    "rounded border px-1.5 py-0.5 text-[11px]",
                    deadlineDelta > 0
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-nutrition/30 bg-nutrition/10 text-nutrition",
                  )}
                >
                  {getDeadlineDeltaLabel(deadlineDelta)}
                </span>
              )}
            </>
          ) : todo.dueDate ? (
            <span className={cn("flex items-center gap-1", getDueDateColor(todo.dueDate))}>
              {isTodayDue(todo.dueDate) && <span className="h-1.5 w-1.5 rounded-full bg-exercise" />}
              <Clock className="h-3.5 w-3.5" />
              {getDueDateLabel(todo.dueDate, todo.dueTime)}
            </span>
          ) : null}
          {!completed && todo.canTopolinoHelp && (
            <span className="rounded border border-work/30 bg-work/10 px-1.5 py-0.5 text-[11px] text-work">Topolino</span>
          )}
          <span className="flex min-w-0 max-w-full items-center gap-1">
            <Folder className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{getProjectName(todo.projectId)}</span>
          </span>
          {!completed && (
            <span className={cn("flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px]", getPriorityColor(todo.priority))}>
              <Flag className="h-3 w-3" />
              {getPriorityLabel(todo.priority)}
            </span>
          )}
        </div>
      </div>
      <div className="col-start-2 flex justify-end gap-1 sm:col-start-auto sm:shrink-0 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        {!completed && onEdit && (
          <Button variant="ghost" size="sm" onClick={() => onEdit(todo)} className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" aria-label={t.edit}>
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => { if (confirm(formatMessage(t.confirmDelete, { title: todo.title }))) onRemove(todo.id) }} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" aria-label={t.delete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
    )
  }

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-6xl gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-lg border border-border bg-card p-3 shadow-sm lg:sticky lg:top-4 lg:self-start">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-foreground">{t.title}</h2>
            <p className="text-xs text-muted-foreground">{formatMessage(t.openCount, { count: activeTodos.length })}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => openNewTodoDialog()} className="h-9 gap-1">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline lg:hidden xl:inline">{t.new}</span>
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setNewProjectName("")
            setShowNewProjectDialog(true)
          }}
          className="mb-3 h-9 w-full gap-2"
        >
          <FolderPlus className="h-4 w-4" />
          {t.newProject}
        </Button>

        <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
          {projectFilters.map((project) => {
            const editableProject = projects.find((item) => item.id === project.id)
            return (
              <div key={project.id} className="flex min-w-max items-center gap-1 lg:min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedProjectId(project.id)}
                  className={cn(
                    "flex min-w-0 flex-1 items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors lg:w-full",
                    selectedProjectId === project.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {editableProject?.color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: editableProject.color }} />}
                    <span className="truncate">{project.name}</span>
                  </span>
                  <span className="rounded-full bg-background/70 px-2 py-0.5 text-xs text-muted-foreground">{project.count}</span>
                </button>
                {editableProject && (onUpdateProject || onDeleteProject) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditingProject(editableProject)}
                    className="h-8 w-8 shrink-0 p-0 text-muted-foreground"
                    aria-label={formatMessage(t.editProject, { name: editableProject.name })}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        {editingProjectId && (
          <div className="mt-3 rounded-md border border-border bg-background p-2">
            <div className="flex gap-2">
              <input
                value={projectDraftName}
                onChange={(event) => setProjectDraftName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") saveProject()
                }}
                className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                aria-label={t.projectName}
              />
              <input
                type="color"
                value={projectDraftColor}
                onChange={(event) => setProjectDraftColor(event.target.value)}
                className="h-9 w-10 shrink-0 rounded-md border border-input bg-background p-1"
                aria-label={t.projectColor}
              />
            </div>
            <div className="mt-2 flex justify-end gap-1">
              {onDeleteProject && (
                <Button variant="ghost" size="sm" onClick={deleteProject} className="h-8 w-8 p-0 text-destructive" aria-label={t.deleteProject}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setEditingProjectId(null)} className="h-8 px-2">
                {t.cancel}
              </Button>
              {onUpdateProject && (
                <Button size="sm" onClick={saveProject} className="h-8 w-8 p-0" aria-label={t.saveProject}>
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </aside>

      <section className="min-w-0 rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border p-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-foreground">{selectedProjectName}</h3>
              <p className="text-sm text-muted-foreground">{formatMessage(t.openCount, { count: activeTodos.length })}</p>
            </div>
            <Button onClick={() => openNewTodoDialog()} className="h-10 shrink-0 gap-2 self-start sm:self-auto">
              <Plus className="h-4 w-4" />
              {t.addTodo}
            </Button>
          </div>
        </div>

        {draftTodo && (
          <EditTodoDialog
            todo={draftTodo}
            projects={projects}
            onAddProject={onAddProject}
            onSave={(_, updates) => {
              onAddTodo(
                updates.title || "",
                updates.dueDate,
                updates.dueTime,
                updates.priority,
                updates.description,
                updates.status,
                updates.canTopolinoHelp,
                updates.projectId,
              )
              setDraftTodo(null)
            }}
            onClose={() => setDraftTodo(null)}
            isNew
          />
        )}

        <div className="space-y-3 p-3 sm:p-4">
          {activeTodos.length === 0 && completedTodos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-12 text-center">
              <p className="text-sm font-medium text-foreground">{t.emptyTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.emptyBody}</p>
            </div>
          ) : (
            <>
              {activeTodos.map((todo) => renderTodo(todo))}

              {completedTodos.length > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex w-full items-center justify-between rounded-md px-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <span>{formatMessage(t.completedCount, { count: completedTodos.length })}</span>
                    {showCompleted ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {showCompleted && <div className="mt-2 space-y-3">{completedTodos.map((todo) => renderTodo(todo, true))}</div>}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {showNewProjectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
              <h2 className="text-lg font-bold text-foreground">{t.newProjectTitle}</h2>
              <button
                type="button"
                onClick={() => setShowNewProjectDialog(false)}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none"
                aria-label={t.close}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              className="space-y-4 p-5"
              onSubmit={(event) => {
                event.preventDefault()
                createProject()
              }}
            >
              <input
                value={newProjectName}
                onChange={(event) => setNewProjectName(event.target.value)}
                placeholder={t.projectName}
                autoFocus
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowNewProjectDialog(false)}>
                  {t.cancel}
                </Button>
                <Button type="submit" disabled={!newProjectName.trim()}>
                  {t.create}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
})
