"use client"
import { useState } from "react"
import type React from "react"

import { X, Calendar, Clock, Flag, Layout, Type, Plus, Check, Folder } from "lucide-react"
import { Button } from "@/components/habits/ui/button"
import { SmartTimePicker } from "@/components/habits/smart-time-picker"
import { SmartDatePicker } from "@/components/habits/smart-date-picker"
import type { Todo, Project } from "@/lib/habits/types"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"

interface AddTodoDialogProps {
  projects: Project[]
  onCreateProject: (name: string) => Project
  onAdd: (
    title: string,
    description: string,
    dueDate: string,
    dueTime: string,
    priority: Todo["priority"],
    status?: Todo["status"],
    canTopolinoHelp?: boolean,
    projectId?: string,
    estimatedMinutes?: number,
    energyLevel?: Todo["energyLevel"],
    tags?: string[],
    notes?: string
  ) => void
  onClose: () => void
}

export function AddTodoDialog({ projects, onCreateProject, onAdd, onClose }: AddTodoDialogProps) {
  const tr = useTranslations().habits.app.addTodoDialog
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [dueTime, setDueTime] = useState("")
  const [priority, setPriority] = useState<Todo["priority"]>(3)
  const [canTopolinoHelp, setCanTopolinoHelp] = useState(false)

  // New fields
  const [projectId, setProjectId] = useState("")
  const [newProjectName, setNewProjectName] = useState("")
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | "">("")
  const [energyLevel, setEnergyLevel] = useState<Todo["energyLevel"]>("medium")
  const [tags, setTags] = useState("")
  const [notes, setNotes] = useState("")

  const handleAdd = () => {
    if (!title.trim()) return
    const finalProjectId = newProjectName.trim()
      ? onCreateProject(newProjectName.trim()).id
      : projectId || undefined

    onAdd(
      title,
      description || "",
      dueDate || "",
      dueTime || "",
      priority,
      undefined,
      canTopolinoHelp,
      finalProjectId,
      estimatedMinutes === "" ? undefined : Number(estimatedMinutes),
      energyLevel,
      tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
      notes || ""
    )
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleAdd()
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-in fade-in">
      <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] scale-in animate-in zoom-in-95 duration-200 focus:outline-none">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/30 duration-200 animate-in zoom-in-95 slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-bold text-foreground text-xl">{tr.title}</h2>
          </div>
          <button onClick={onClose} aria-label={tr.close} className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full focus:outline-none">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Title and Description */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Type className="h-4 w-4 text-muted-foreground" />
                {tr.titleLabel}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tr.titlePlaceholder}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Layout className="h-4 w-4 text-muted-foreground" />
                {tr.description}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={tr.descriptionPlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-28 text-sm transition-all placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {/* Project Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border border-border/50">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Folder className="h-4 w-4 text-muted-foreground" />
                {tr.project}
              </label>
              <select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value)
                  if (e.target.value) setNewProjectName("")
                }}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              >
                <option value="">{tr.uncategorized}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Plus className="h-4 w-4 text-muted-foreground" />
                {tr.newProject}
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => {
                  setNewProjectName(e.target.value)
                  if (e.target.value) setProjectId("")
                }}
                placeholder={tr.newProjectPlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border border-border/50">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {tr.dueDate}
              </label>
              <SmartDatePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder={tr.noDueDate}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {tr.reminderTime}
              </label>
              <SmartTimePicker
                value={dueTime}
                onChange={setDueTime}
                placeholder={tr.anyTime}
              />
            </div>
          </div>

          {/* Priority and Assistance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Flag className="h-4 w-4 text-muted-foreground" />
                {tr.priority}
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
              <p className="text-[10px] font-medium text-muted-foreground mt-1">
                {tr.priorityScale}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block">{tr.assistance}</label>
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
                  {canTopolinoHelp ? tr.topolinoEnabled : tr.askTopolino}
                </span>
                <div className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                  canTopolinoHelp ? "bg-primary border-primary scale-110 shadow-sm" : "border-muted-foreground"
                )}>
                  {canTopolinoHelp && <Check className="h-3 w-3 text-white" />}
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-muted/30">
          <Button variant="ghost" size="default" onClick={onClose} className="font-medium">
            {tr.cancel}
          </Button>
          <Button size="default" onClick={handleAdd} className="bg-primary text-primary-foreground font-bold px-8 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            {tr.create}
          </Button>
        </div>
      </div>
    </div>
  )
}
