"use client"
import { useId, useState } from "react"
import { ChevronDown, CheckCircle2, Circle, PlayCircle, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/habits/ui/button"
import { AppDialog } from "@/components/habits/ui/app-dialog"
import { SmartTimePicker } from "@/components/habits/smart-time-picker"
import { SmartDatePicker } from "@/components/habits/smart-date-picker"
import { ConfirmDialog } from "@/components/habits/todos/confirm-dialog"
import { TodoDetailsFields, type Subtask } from "@/components/habits/todos/todo-details-fields"
import { PRIORITIES, priorityLabel, splitTags } from "@/components/habits/todos/todo-meta"
import type { Todo, Project } from "@/lib/habits/types"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

interface EditTodoDialogProps {
  todo: Todo
  projects: Project[]
  onAddProject: (name: string) => Project
  onSave: (id: string, updates: Partial<Todo>) => void
  onDelete?: (id: string) => void
  onClose: () => void
  isNew?: boolean
}

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
const labelClass = "text-sm font-semibold text-foreground/80"

export function EditTodoDialog({ todo, projects, onAddProject, onSave, onDelete, onClose, isNew = false }: EditTodoDialogProps) {
  const copy = useTranslations().habits.app
  const t = copy.editTodoDialog
  const listT = copy.todoList
  const id = useId()

  const [title, setTitle] = useState(todo.title)
  const [titleError, setTitleError] = useState(false)
  const [dueDate, setDueDate] = useState(todo.dueDate || "")
  const [dueTime, setDueTime] = useState(todo.dueTime || "")
  const [priority, setPriority] = useState<Todo["priority"]>(todo.priority)
  const [status, setStatus] = useState<Todo["status"]>(todo.status || "incomplete")
  const [projectId, setProjectId] = useState(todo.projectId || "")
  const [creatingProject, setCreatingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [description, setDescription] = useState(todo.description || "")
  const [estimatedMinutes, setEstimatedMinutes] = useState(todo.estimatedMinutes ? String(todo.estimatedMinutes) : "")
  const [energyLevel, setEnergyLevel] = useState<Todo["energyLevel"]>(todo.energyLevel)
  const [tags, setTags] = useState((todo.tags ?? []).join(", "))
  const [notes, setNotes] = useState(todo.notes || "")
  const [subtasks, setSubtasks] = useState<Subtask[]>(todo.subtasks ?? [])
  const [canTopolinoHelp, setCanTopolinoHelp] = useState(todo.canTopolinoHelp ?? false)
  const hasDetails = Boolean(
    todo.description || todo.estimatedMinutes || todo.energyLevel || todo.tags?.length || todo.notes || todo.subtasks?.length || todo.canTopolinoHelp,
  )
  const [showDetails, setShowDetails] = useState(hasDetails)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const snapshot = JSON.stringify([
    title, dueDate, dueTime, priority, status, projectId, newProjectName, description,
    estimatedMinutes, energyLevel, tags, notes, subtasks, canTopolinoHelp,
  ])
  const [initialSnapshot] = useState(snapshot)
  const dirty = snapshot !== initialSnapshot

  const handleSave = () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setTitleError(true)
      document.getElementById(`${id}-title`)?.focus()
      return
    }

    const finalProjectId =
      creatingProject && newProjectName.trim() ? onAddProject(newProjectName.trim()).id : projectId || undefined
    const minutes = Number.parseInt(estimatedMinutes, 10)
    const tagList = splitTags(tags)

    onSave(todo.id, {
      title: trimmedTitle,
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      // A time without a day means nothing to the list or calendar.
      dueTime: dueDate && dueTime ? dueTime : undefined,
      priority,
      status,
      canTopolinoHelp,
      projectId: finalProjectId,
      estimatedMinutes: Number.isFinite(minutes) && minutes > 0 ? minutes : undefined,
      energyLevel,
      tags: tagList.length ? tagList : undefined,
      notes: notes.trim() || undefined,
      subtasks: subtasks.length ? subtasks : undefined,
    })
    onClose()
  }

  const footer = (
    <>
      {onDelete && !isNew && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => setConfirmDelete(true)}
          className="mr-auto gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          {t.delete}
        </Button>
      )}
      <Button type="button" variant="ghost" onClick={onClose}>
        {t.cancel}
      </Button>
      <Button type="submit" form={`${id}-form`} className="px-6 font-bold">
        {isNew ? t.add : t.saveChanges}
      </Button>
    </>
  )

  return (
    <>
      {/* Swapped out (not stacked) while the delete confirm is up, so Escape
          and the focus trap only ever belong to one dialog. */}
      <AppDialog open={!confirmDelete} onClose={onClose} title={isNew ? t.newTitle : t.title} dirty={dirty} size="md" footer={footer}>
        <form
          id={`${id}-form`}
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            handleSave()
          }}
          className="space-y-5"
        >
          <div className="space-y-1.5">
            <label htmlFor={`${id}-title`} className={labelClass}>
              {t.titleLabel}
            </label>
            <input
              id={`${id}-title`}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (e.target.value.trim()) setTitleError(false)
              }}
              placeholder={t.titlePlaceholder}
              data-autofocus={isNew ? "" : undefined}
              aria-invalid={titleError || undefined}
              aria-describedby={titleError ? `${id}-title-error` : undefined}
              className={cn(fieldClass, "text-base", titleError && "border-destructive")}
            />
            {titleError && (
              <p id={`${id}-title-error`} role="alert" className="text-xs font-medium text-destructive">
                {t.titleRequired}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <span id={`${id}-status`} className={cn(labelClass, "block")}>
              {t.statusLabel}
            </span>
            <div role="group" aria-labelledby={`${id}-status`} className="flex items-center gap-1 rounded-xl border border-border/50 bg-muted/50 p-1">
              {(["incomplete", "in_progress", "completed"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={status === s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all",
                    status === s
                      ? s === "completed"
                        ? "bg-nutrition text-success-foreground shadow-sm"
                        : s === "in_progress"
                          ? "bg-work text-background shadow-sm"
                          : "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {s === "completed" && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {s === "in_progress" && <PlayCircle className="h-3.5 w-3.5" />}
                  {s === "incomplete" && <Circle className="h-3.5 w-3.5" />}
                  {t.status[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor={`${id}-due-date`} className={labelClass}>
                {t.dueDate}
              </label>
              <SmartDatePicker id={`${id}-due-date`} value={dueDate} onChange={setDueDate} aria-describedby={`${id}-due-hint`} />
              <p id={`${id}-due-hint`} className="text-xs text-muted-foreground">
                {t.dueDateHint}
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor={`${id}-due-time`} className={labelClass}>
                {t.reminderTime}
              </label>
              <SmartTimePicker id={`${id}-due-time`} value={dueDate ? dueTime : ""} onChange={setDueTime} disabled={!dueDate} />
            </div>
          </div>

          <div className="space-y-1.5">
            <span id={`${id}-priority`} className={cn(labelClass, "block")}>
              {t.priority}
            </span>
            <div role="group" aria-labelledby={`${id}-priority`} className="flex flex-wrap gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={priority === p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    "h-9 flex-1 whitespace-nowrap rounded-lg border px-2.5 text-xs font-semibold transition-all",
                    priority === p
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {priorityLabel(p, listT)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor={creatingProject ? `${id}-new-project` : `${id}-project`} className={labelClass}>
              {creatingProject ? t.newProject : t.project}
            </label>
            {creatingProject ? (
              <div className="flex gap-2">
                <input
                  id={`${id}-new-project`}
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder={t.newProjectPlaceholder}
                  autoFocus
                  className={fieldClass}
                />
                <button
                  type="button"
                  onClick={() => {
                    setCreatingProject(false)
                    setNewProjectName("")
                  }}
                  aria-label={t.cancelNewProject}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select id={`${id}-project`} value={projectId} onChange={(e) => setProjectId(e.target.value)} className={fieldClass}>
                  <option value="">{t.uncategorized}</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="outline" onClick={() => setCreatingProject(true)} className="h-10 shrink-0 gap-1.5 rounded-xl">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.newProject}</span>
                  <span className="sr-only sm:hidden">{t.newProject}</span>
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/60">
            <button
              type="button"
              aria-expanded={showDetails}
              aria-controls={`${id}-details`}
              onClick={() => setShowDetails((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-foreground"
            >
              {t.moreDetails}
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showDetails && "rotate-180")} />
            </button>
            {showDetails && (
              <div id={`${id}-details`} className="border-t border-border/60 p-4">
                <TodoDetailsFields
                  description={description}
                  onDescriptionChange={setDescription}
                  estimatedMinutes={estimatedMinutes}
                  onEstimatedMinutesChange={setEstimatedMinutes}
                  energyLevel={energyLevel}
                  onEnergyLevelChange={setEnergyLevel}
                  tags={tags}
                  onTagsChange={setTags}
                  notes={notes}
                  onNotesChange={setNotes}
                  subtasks={subtasks}
                  onSubtasksChange={setSubtasks}
                  canTopolinoHelp={canTopolinoHelp}
                  onCanTopolinoHelpChange={setCanTopolinoHelp}
                />
              </div>
            )}
          </div>
        </form>
      </AppDialog>

      {onDelete && (
        <ConfirmDialog
          open={confirmDelete}
          title={listT.deleteTitle}
          body={formatMessage(listT.deleteBody, { title: todo.title })}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            onDelete(todo.id)
            onClose()
          }}
        />
      )}
    </>
  )
}
