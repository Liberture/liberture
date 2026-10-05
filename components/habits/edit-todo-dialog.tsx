"use client"
import { useState } from "react"
import { X, Trash2, Calendar, Clock, Flag, Layout, Type, Check, PlayCircle, CheckCircle2, Circle, Folder, Plus } from "lucide-react"
import { Button } from "@/components/habits/ui/button"
import { SmartTimePicker } from "@/components/habits/smart-time-picker"
import { SmartDatePicker } from "@/components/habits/smart-date-picker"
import type { Todo, Project } from "@/lib/habits/types"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"

interface EditTodoDialogProps {
  todo: Todo
  projects: Project[]
  onAddProject: (name: string) => Project
  onSave: (id: string, updates: Partial<Todo>) => void
  onDelete?: (id: string) => void
  onClose: () => void
  isNew?: boolean
}

export function EditTodoDialog({ todo, projects, onAddProject, onSave, onDelete, onClose, isNew = false }: EditTodoDialogProps) {
  const t = useTranslations().habits.app.editTodoDialog
  const [title, setTitle] = useState(todo.title)
  const descriptionFromNotes = !todo.description && todo.notes
  const [description, setDescription] = useState(todo.description || todo.notes || "")
  const [dueDate, setDueDate] = useState(todo.dueDate || "")
  const [dueTime, setDueTime] = useState(todo.dueTime || "")
  const [priority, setPriority] = useState<Todo["priority"]>(todo.priority)
  const [status, setStatus] = useState<Todo["status"]>(todo.status || "incomplete")
  const [canTopolinoHelp, setCanTopolinoHelp] = useState(todo.canTopolinoHelp ?? false)
  const [projectId, setProjectId] = useState(todo.projectId || "")
  const [newProjectName, setNewProjectName] = useState("")
  const [dueDateError, setDueDateError] = useState(false)

  const handleSave = () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return
    if (!dueDate) {
      setDueDateError(true)
      return
    }

    const finalProjectId = newProjectName.trim()
      ? onAddProject(newProjectName.trim()).id
      : projectId || undefined

    onSave(todo.id, {
      title: trimmedTitle,
      description: description || undefined,
      ...(descriptionFromNotes ? { notes: undefined } : {}),
      dueDate,
      dueTime: dueTime || undefined,
      priority,
      status,
      canTopolinoHelp,
      projectId: finalProjectId,
    })
    onClose()
  }

  const handleDelete = () => {
    if (!onDelete) return
    if (confirm(t.confirmDelete)) {
      onDelete(todo.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-in fade-in">
      <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] scale-in animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/30 duration-200 animate-in zoom-in-95 slide-in-from-bottom-4">
          <h2 className="font-bold text-foreground text-xl">{t.title}</h2>
          <button onClick={onClose} aria-label={t.close} className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full focus:outline-none">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Status Selection */}
          <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-xl border border-border/50">
            {(["incomplete", "in_progress", "completed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all capitalize",
                  status === s
                    ? s === "completed" 
                      ? "bg-nutrition text-success-foreground shadow-sm"
                      : s === "in_progress"
                        ? "bg-work text-background shadow-sm"
                        : "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {s === "completed" && <CheckCircle2 className="h-3.5 w-3.5" />}
                {s === "in_progress" && <PlayCircle className="h-3.5 w-3.5" />}
                {s === "incomplete" && <Circle className="h-3.5 w-3.5" />}
                {t.status[s]}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground text-opacity-80">
                <Type className="h-4 w-4 text-muted-foreground" />
                {t.titleLabel}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.titlePlaceholder}
                autoFocus={isNew}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground text-opacity-80">
                <Layout className="h-4 w-4 text-muted-foreground" />
                {t.description}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.descriptionPlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-24 text-sm transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border border-border/50">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground text-opacity-80">
                <Folder className="h-4 w-4 text-muted-foreground" />
                {t.project}
              </label>
              <select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value)
                  if (e.target.value) setNewProjectName("")
                }}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              >
                <option value="">{t.uncategorized}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground text-opacity-80">
                <Plus className="h-4 w-4 text-muted-foreground" />
                {t.newProject}
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => {
                  setNewProjectName(e.target.value)
                  if (e.target.value) setProjectId("")
                }}
                placeholder={t.newProjectPlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border border-border/50">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground text-opacity-80">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {t.dueDate} <span className="text-destructive">*</span>
              </label>
              <SmartDatePicker
                value={dueDate}
                onChange={(value) => {
                  setDueDate(value)
                  if (value) setDueDateError(false)
                }}
              />
              {dueDateError && (
                <p className="text-xs font-medium text-destructive">{t.dueDateRequired}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground text-opacity-80">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {t.reminderTime}
              </label>
              <SmartTimePicker
                value={dueTime}
                onChange={setDueTime}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground text-opacity-80">
                <Flag className="h-4 w-4 text-muted-foreground" />
                {t.priority}
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p as Todo["priority"])}
                    className={cn(
                      "h-10 rounded-lg text-xs font-bold transition-all border",
                      priority === p
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background hover:border-primary/50 border-border text-muted-foreground"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground text-opacity-80 block">{t.assistance}</label>
              <button
                type="button"
                onClick={() => setCanTopolinoHelp(!canTopolinoHelp)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all h-[42px]",
                  canTopolinoHelp
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-background border-border text-muted-foreground hover:border-primary/20"
                )}
              >
                <span className="text-sm font-medium flex items-center gap-2">
                  {canTopolinoHelp ? t.topolinoActive : t.topolinoHelp}
                </span>
                <div className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                  canTopolinoHelp ? "bg-primary border-primary scale-110 shadow-sm" : "border-muted-foreground"
                )}>
                  {canTopolinoHelp && <Check className="h-3 w-3 text-foreground" />}
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/30">
          {onDelete && !isNew ? (
            <Button
              variant="ghost"
              size="default"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 font-medium"
            >
              <Trash2 className="h-4 w-4" />
              {t.delete}
            </Button>
          ) : <span />}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="font-medium">
              {t.cancel}
            </Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground font-bold px-8 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              {isNew ? t.add : t.saveChanges}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
