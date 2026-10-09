"use client"

import { useId, useState } from "react"
import { Check, Edit2, FolderPlus, Plus, Trash2 } from "lucide-react"
import { AppDialog } from "@/components/habits/ui/app-dialog"
import { Button } from "@/components/habits/ui/button"
import { notify } from "@/components/habits/ui/toast"
import { ConfirmDialog } from "@/components/habits/todos/confirm-dialog"
import type { Project } from "@/lib/habits/types"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

export type ProjectFilter = { id: string; name: string; count: number }

/** Project filter chips (a horizontal scroller on phones), project editing and creation. */
export function ProjectSidebar({
  projects,
  filters,
  selectedProjectId,
  onSelectProject,
  openCount,
  onNewTodo,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}: {
  projects: Project[]
  filters: ProjectFilter[]
  selectedProjectId: string
  onSelectProject: (id: string) => void
  openCount: number
  onNewTodo: () => void
  onAddProject: (name: string) => Project
  onUpdateProject?: (id: string, updates: Pick<Project, "name" | "color">) => void
  onDeleteProject?: (id: string) => void
}) {
  const t = useTranslations().habits.app.todoList
  const id = useId()
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectError, setNewProjectError] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const [draftColor, setDraftColor] = useState("#64748b")
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null)

  const createProject = () => {
    const name = newProjectName.trim()
    if (!name) {
      setNewProjectError(true)
      return
    }
    const project = onAddProject(name)
    setNewProjectName("")
    setShowNewProject(false)
    onSelectProject(project.id)
    notify.success(formatMessage(t.projectCreated, { name }))
  }

  const startEditing = (project: Project) => {
    setEditingProjectId(project.id)
    setDraftName(project.name)
    setDraftColor(project.color || "#64748b")
  }

  const saveProject = () => {
    if (!editingProjectId || !onUpdateProject) return
    const name = draftName.trim()
    if (!name) return
    onUpdateProject(editingProjectId, { name, color: draftColor })
    setEditingProjectId(null)
  }

  return (
    <aside className="min-w-0 rounded-lg border border-border bg-card p-3 shadow-sm lg:sticky lg:top-4 lg:self-start">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t.title}</h2>
          <p className="text-xs text-muted-foreground">{formatMessage(t.openCount, { count: openCount })}</p>
        </div>
        <Button size="sm" onClick={onNewTodo} className="h-9 gap-1" aria-label={t.addTodo}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t.addTodo}</span>
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setNewProjectName("")
          setNewProjectError(false)
          setShowNewProject(true)
        }}
        className="mb-3 h-9 w-full gap-2"
      >
        <FolderPlus className="h-4 w-4" />
        {t.newProject}
      </Button>

      {/* data-no-swipe: horizontal scrolling here must not flip the tracker view. */}
      <div
        data-no-swipe
        role="list"
        aria-label={t.projectFilters}
        className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0"
      >
        {filters.map((filter) => {
          const project = projects.find((item) => item.id === filter.id)
          const selected = selectedProjectId === filter.id
          return (
            <div key={filter.id} role="listitem" className="flex min-w-max items-center gap-1 lg:min-w-0">
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelectProject(filter.id)}
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors lg:w-full",
                  selected ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {project?.color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />}
                  <span className="truncate">{filter.name}</span>
                </span>
                <span className="rounded-full bg-background/70 px-2 py-0.5 text-xs text-muted-foreground">{filter.count}</span>
              </button>
              {project && (onUpdateProject || onDeleteProject) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing(project)}
                  className="h-8 w-8 shrink-0 p-0 text-muted-foreground"
                  aria-label={formatMessage(t.editProject, { name: project.name })}
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
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") saveProject()
                if (event.key === "Escape") setEditingProjectId(null)
              }}
              autoFocus
              className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
              aria-label={t.projectName}
            />
            <input
              type="color"
              value={draftColor}
              onChange={(event) => setDraftColor(event.target.value)}
              className="h-9 w-10 shrink-0 rounded-md border border-input bg-background p-1"
              aria-label={t.projectColor}
            />
          </div>
          <div className="mt-2 flex justify-end gap-1">
            {onDeleteProject && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPendingDelete(projects.find((p) => p.id === editingProjectId) ?? null)}
                className="h-8 w-8 p-0 text-destructive"
                aria-label={t.deleteProject}
                title={t.deleteProject}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditingProjectId(null)} className="h-8 px-2">
              {t.cancel}
            </Button>
            {onUpdateProject && (
              <Button size="sm" onClick={saveProject} disabled={!draftName.trim()} className="h-8 w-8 p-0" aria-label={t.saveProject} title={t.saveProject}>
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      <AppDialog
        open={showNewProject}
        onClose={() => setShowNewProject(false)}
        title={t.newProjectTitle}
        size="sm"
        dirty={Boolean(newProjectName.trim())}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setShowNewProject(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" form={`${id}-new-project`}>
              {t.create}
            </Button>
          </>
        }
      >
        <form
          id={`${id}-new-project`}
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            createProject()
          }}
          className="space-y-1.5"
        >
          <label htmlFor={`${id}-new-project-name`} className="text-sm font-semibold text-foreground/80">
            {t.projectName}
          </label>
          <input
            id={`${id}-new-project-name`}
            value={newProjectName}
            onChange={(event) => {
              setNewProjectName(event.target.value)
              if (event.target.value.trim()) setNewProjectError(false)
            }}
            data-autofocus
            aria-invalid={newProjectError || undefined}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {newProjectError && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {t.projectNameRequired}
            </p>
          )}
        </form>
      </AppDialog>

      {onDeleteProject && (
        <ConfirmDialog
          open={pendingDelete !== null}
          title={t.deleteProjectTitle}
          body={pendingDelete ? formatMessage(t.deleteProjectBody, { name: pendingDelete.name }) : undefined}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            if (!pendingDelete) return
            onDeleteProject(pendingDelete.id)
            if (selectedProjectId === pendingDelete.id) onSelectProject("all")
            setEditingProjectId(null)
            notify.success(formatMessage(t.projectDeleted, { name: pendingDelete.name }))
          }}
        />
      )}
    </aside>
  )
}
