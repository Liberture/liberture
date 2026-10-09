"use client"

import { memo, useId, useMemo, useState } from "react"
import { ChevronDown, ChevronRight, Plus, Search, X } from "lucide-react"
import { EditTodoDialog } from "@/components/habits/edit-todo-dialog"
import { notify } from "@/components/habits/ui/toast"
import { ConfirmDialog } from "@/components/habits/todos/confirm-dialog"
import { ProjectSidebar } from "@/components/habits/todos/project-sidebar"
import { ScheduleTodoDialog } from "@/components/habits/todos/schedule-todo-dialog"
import { TodoRow } from "@/components/habits/todos/todo-row"
import type { Project, Todo } from "@/lib/habits/types"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

type SortKey = "deadline" | "priority" | "created"

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
  /**
   * Preferred create path when given: takes the dialog's whole Partial<Todo>
   * (including subtasks, which the positional `onAddTodo` can't carry).
   */
  onCreateTodo?: (todo: Partial<Todo>) => void
  onAddProject: (name: string) => Project
  onUpdateProject?: (id: string, updates: Pick<Project, "name" | "color">) => void
  onDeleteProject?: (id: string) => void
  onEdit?: (todo: Todo) => void
  /** Adds a "Schedule" action that blocks calendar time for the todo. */
  onScheduleTodo?: (todoId: string, startsAt: string, durationMinutes: number) => void
}

const NEW_TODO_ID = "__new_todo__"

/** Undated todos sort last for "deadline"; dated ones by date then time. */
function compareTodos(a: Todo, b: Todo, sort: SortKey) {
  if (sort === "deadline") {
    const ak = a.dueDate ? `${a.dueDate} ${a.dueTime ?? "99:99"}` : "~"
    const bk = b.dueDate ? `${b.dueDate} ${b.dueTime ?? "99:99"}` : "~"
    if (ak !== bk) return ak.localeCompare(bk)
    if (a.priority !== b.priority) return b.priority - a.priority
  } else if (sort === "priority") {
    if (a.priority !== b.priority) return b.priority - a.priority
    const statusOrder = { in_progress: 0, incomplete: 1, completed: 2 }
    if (a.status !== b.status) return statusOrder[a.status] - statusOrder[b.status]
  }
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

function matchesQuery(todo: Todo, query: string) {
  if (!query) return true
  const haystack = [todo.title, todo.description, todo.notes, ...(todo.tags ?? []), ...(todo.subtasks ?? []).map((s) => s.title)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  return haystack.includes(query)
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
  onCreateTodo,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onEdit,
  onScheduleTodo,
}: TodoListProps) {
  const t = useTranslations().habits.app.todoList
  const id = useId()
  const [draftTodo, setDraftTodo] = useState<Todo | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState("all")
  const [quickTitle, setQuickTitle] = useState("")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortKey>("deadline")
  const [pendingDelete, setPendingDelete] = useState<Todo | null>(null)
  const [scheduling, setScheduling] = useState<Todo | null>(null)

  const projectIds = useMemo(() => new Set(projects.map((project) => project.id)), [projects])
  const isUncategorized = (todo: Todo) => !todo.projectId || !projectIds.has(todo.projectId)
  const query = search.trim().toLowerCase()

  const visibleTodos = todos
    .filter((todo) => {
      if (selectedProjectId === "all") return true
      if (selectedProjectId === "uncategorized") return isUncategorized(todo)
      return todo.projectId === selectedProjectId
    })
    .filter((todo) => matchesQuery(todo, query))
    .sort((a, b) => compareTodos(a, b, sort))

  const activeTodos = visibleTodos.filter((todo) => todo.status !== "completed")
  const datedTodos = activeTodos.filter((todo) => todo.dueDate)
  const undatedTodos = activeTodos.filter((todo) => !todo.dueDate)
  const completedTodos = visibleTodos.filter((todo) => todo.status === "completed")
  const activeAllTodos = todos.filter((todo) => todo.status !== "completed")
  const activeProject = projects.find((project) => project.id === selectedProjectId)
  const selectedProjectName =
    selectedProjectId === "all" ? t.allTodos : selectedProjectId === "uncategorized" ? t.uncategorized : activeProject?.name ?? t.project
  const projectFilters = [
    { id: "all", name: t.all, count: activeAllTodos.length },
    { id: "uncategorized", name: t.uncategorized, count: activeAllTodos.filter(isUncategorized).length },
    ...projects.map((project) => ({
      id: project.id,
      name: project.name,
      count: activeAllTodos.filter((todo) => todo.projectId === project.id).length,
    })),
  ]

  const getProjectName = (projectId?: string) =>
    (projectId && projects.find((project) => project.id === projectId)?.name) || t.uncategorized

  const projectForNewTodo = selectedProjectId === "all" || selectedProjectId === "uncategorized" ? undefined : selectedProjectId

  const openNewTodoDialog = () => {
    const now = new Date().toISOString()
    setDraftTodo({
      id: NEW_TODO_ID,
      title: quickTitle.trim(),
      priority: 3,
      status: "incomplete",
      createdAt: now,
      updatedAt: now,
      canTopolinoHelp: false,
      projectId: projectForNewTodo,
    })
  }

  const createTodo = (updates: Partial<Todo>) => {
    const title = updates.title?.trim()
    if (!title) return
    if (onCreateTodo) {
      onCreateTodo({ ...updates, title })
    } else {
      onAddTodo(
        title,
        updates.dueDate,
        updates.dueTime,
        updates.priority,
        updates.description,
        updates.status,
        updates.canTopolinoHelp,
        updates.projectId,
        updates.estimatedMinutes,
        updates.energyLevel,
        updates.tags,
        updates.notes,
      )
    }
    notify.success(formatMessage(t.todoAdded, { title }))
  }

  const quickAdd = () => {
    const title = quickTitle.trim()
    if (!title) return
    createTodo({ title, priority: 3, status: "incomplete", projectId: projectForNewTodo })
    setQuickTitle("")
  }

  const renderRow = (todo: Todo) => (
    <TodoRow
      key={todo.id}
      todo={todo}
      projectName={getProjectName(todo.projectId)}
      onToggleComplete={onToggleComplete}
      onEdit={onEdit}
      onDelete={setPendingDelete}
      onSchedule={onScheduleTodo ? setScheduling : undefined}
    />
  )

  const groupHeading = (label: string, count: number) => (
    <h4 className="flex items-center gap-2 px-1 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
      <span className="font-normal normal-case">{count}</span>
    </h4>
  )

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-6xl gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <ProjectSidebar
        projects={projects}
        filters={projectFilters}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        openCount={activeAllTodos.length}
        onNewTodo={openNewTodoDialog}
        onAddProject={onAddProject}
        onUpdateProject={onUpdateProject}
        onDeleteProject={onDeleteProject}
      />

      <section className="min-w-0 rounded-lg border border-border bg-card shadow-sm">
        <div className="space-y-3 border-b border-border p-3 sm:p-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-foreground">{selectedProjectName}</h3>
            <p className="text-sm text-muted-foreground">{formatMessage(t.openCount, { count: activeTodos.length })}</p>
          </div>

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              quickAdd()
            }}
          >
            <label htmlFor={`${id}-quick-add`} className="sr-only">
              {t.quickAddLabel}
            </label>
            <input
              id={`${id}-quick-add`}
              value={quickTitle}
              onChange={(event) => setQuickTitle(event.target.value)}
              placeholder={t.quickAddPlaceholder}
              enterKeyHint="done"
              className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <button
              type="submit"
              disabled={!quickTitle.trim()}
              aria-label={t.addTodo}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchLabel}
                className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-8 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label={t.clearSearch}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <label htmlFor={`${id}-sort`} className="sr-only">
              {t.sortLabel}
            </label>
            <select
              id={`${id}-sort`}
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {(["deadline", "priority", "created"] as const).map((key) => (
                <option key={key} value={key}>
                  {t.sortLabel}: {t.sortOptions[key]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3 p-3 sm:p-4">
          {activeTodos.length === 0 && completedTodos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-12 text-center">
              {query ? (
                <p className="text-sm text-muted-foreground">{formatMessage(t.noMatches, { query: search.trim() })}</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">{t.emptyTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.emptyBody}</p>
                </>
              )}
            </div>
          ) : (
            <>
              {datedTodos.length > 0 && undatedTodos.length > 0 && groupHeading(t.datedGroup, datedTodos.length)}
              {datedTodos.map(renderRow)}
              {undatedTodos.length > 0 && datedTodos.length > 0 && groupHeading(t.noDateGroup, undatedTodos.length)}
              {undatedTodos.map(renderRow)}

              {completedTodos.length > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    aria-expanded={showCompleted}
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex w-full items-center justify-between rounded-md px-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <span>{formatMessage(t.completedCount, { count: completedTodos.length })}</span>
                    {showCompleted ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {showCompleted && <div className="mt-2 space-y-3">{completedTodos.map(renderRow)}</div>}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {draftTodo && (
        <EditTodoDialog
          todo={draftTodo}
          projects={projects}
          onAddProject={onAddProject}
          onSave={(_, updates) => {
            createTodo(updates)
            setQuickTitle("")
            setDraftTodo(null)
          }}
          onClose={() => setDraftTodo(null)}
          isNew
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t.deleteTitle}
        body={pendingDelete ? formatMessage(t.deleteBody, { title: pendingDelete.title }) : undefined}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return
          onRemove(pendingDelete.id)
          notify.success(formatMessage(t.todoDeleted, { title: pendingDelete.title }))
        }}
      />

      {scheduling && onScheduleTodo && (
        <ScheduleTodoDialog
          todo={scheduling}
          onClose={() => setScheduling(null)}
          onSchedule={(todoId, startsAt, duration) => {
            onScheduleTodo(todoId, startsAt, duration)
            notify.success(formatMessage(t.scheduleDialog.scheduled, { title: scheduling.title }))
          }}
        />
      )}
    </div>
  )
})
