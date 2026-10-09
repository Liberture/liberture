"use client"

import { useId, useState } from "react"
import { Check, Plus, X } from "lucide-react"
import type { Todo } from "@/lib/habits/types"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

export type Subtask = NonNullable<Todo["subtasks"]>[number]
const ENERGY_LEVELS = ["low", "medium", "high"] as const

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
const labelClass = "text-sm font-semibold text-foreground/80"

/** The "More details" half of the todo dialog: everything past the core fields. */
export function TodoDetailsFields({
  description,
  onDescriptionChange,
  estimatedMinutes,
  onEstimatedMinutesChange,
  energyLevel,
  onEnergyLevelChange,
  tags,
  onTagsChange,
  notes,
  onNotesChange,
  subtasks,
  onSubtasksChange,
  canTopolinoHelp,
  onCanTopolinoHelpChange,
}: {
  description: string
  onDescriptionChange: (value: string) => void
  estimatedMinutes: string
  onEstimatedMinutesChange: (value: string) => void
  energyLevel?: Todo["energyLevel"]
  onEnergyLevelChange: (value: Todo["energyLevel"]) => void
  tags: string
  onTagsChange: (value: string) => void
  notes: string
  onNotesChange: (value: string) => void
  subtasks: Subtask[]
  onSubtasksChange: (value: Subtask[]) => void
  canTopolinoHelp: boolean
  onCanTopolinoHelpChange: (value: boolean) => void
}) {
  const t = useTranslations().habits.app.editTodoDialog
  const id = useId()
  const [subtaskDraft, setSubtaskDraft] = useState("")

  const addSubtask = () => {
    const title = subtaskDraft.trim()
    if (!title) return
    onSubtasksChange([...subtasks, { id: crypto.randomUUID(), title, completed: false }])
    setSubtaskDraft("")
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor={`${id}-description`} className={labelClass}>
          {t.description}
        </label>
        <textarea
          id={`${id}-description`}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t.descriptionPlaceholder}
          className={cn(fieldClass, "h-20 resize-none")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${id}-estimate`} className={labelClass}>
            {t.estimatedMinutes}
          </label>
          <input
            id={`${id}-estimate`}
            type="number"
            inputMode="numeric"
            min={0}
            step={5}
            value={estimatedMinutes}
            onChange={(e) => onEstimatedMinutesChange(e.target.value)}
            placeholder={t.estimatedPlaceholder}
            className={fieldClass}
          />
        </div>
        <div className="space-y-1.5">
          <span id={`${id}-energy`} className={cn(labelClass, "block")}>
            {t.energyLevel}
          </span>
          <div role="group" aria-labelledby={`${id}-energy`} className="grid grid-cols-3 gap-1.5">
            {ENERGY_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                aria-pressed={energyLevel === level}
                onClick={() => onEnergyLevelChange(energyLevel === level ? undefined : level)}
                className={cn(
                  "h-10 rounded-lg border text-xs font-semibold transition-all",
                  energyLevel === level
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50",
                )}
              >
                {t.energy[level]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${id}-tags`} className={labelClass}>
          {t.tags}
        </label>
        <input
          id={`${id}-tags`}
          value={tags}
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder={t.tagsPlaceholder}
          aria-describedby={`${id}-tags-hint`}
          className={fieldClass}
        />
        <p id={`${id}-tags-hint`} className="text-xs text-muted-foreground">
          {t.tagsHint}
        </p>
      </div>

      <div className="space-y-1.5">
        <span id={`${id}-subtasks`} className={cn(labelClass, "block")}>
          {t.subtasks}
        </span>
        {subtasks.length > 0 && (
          <ul aria-labelledby={`${id}-subtasks`} className="space-y-1">
            {subtasks.map((subtask) => (
              <li key={subtask.id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
                <input
                  id={`${id}-sub-${subtask.id}`}
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={() =>
                    onSubtasksChange(subtasks.map((s) => (s.id === subtask.id ? { ...s, completed: !s.completed } : s)))
                  }
                  className="h-4 w-4 shrink-0 accent-primary"
                />
                <label
                  htmlFor={`${id}-sub-${subtask.id}`}
                  className={cn("min-w-0 flex-1 break-words text-sm", subtask.completed && "text-muted-foreground line-through")}
                >
                  {subtask.title}
                </label>
                <button
                  type="button"
                  onClick={() => onSubtasksChange(subtasks.filter((s) => s.id !== subtask.id))}
                  aria-label={formatMessage(t.removeSubtask, { title: subtask.title })}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            value={subtaskDraft}
            onChange={(e) => setSubtaskDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addSubtask()
              }
            }}
            placeholder={t.subtaskPlaceholder}
            aria-label={t.subtaskPlaceholder}
            className={fieldClass}
          />
          <button
            type="button"
            onClick={addSubtask}
            disabled={!subtaskDraft.trim()}
            aria-label={t.addSubtask}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:border-primary/50 hover:text-primary disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${id}-notes`} className={labelClass}>
          {t.notes}
        </label>
        <textarea
          id={`${id}-notes`}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={t.notesPlaceholder}
          className={cn(fieldClass, "h-20 resize-none")}
        />
      </div>

      <div className="space-y-1.5">
        <span className={cn(labelClass, "block")}>{t.assistance}</span>
        <button
          type="button"
          aria-pressed={canTopolinoHelp}
          onClick={() => onCanTopolinoHelpChange(!canTopolinoHelp)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-xl border px-4 transition-all",
            canTopolinoHelp
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:border-primary/20",
          )}
        >
          <span className="text-sm font-medium">{canTopolinoHelp ? t.topolinoActive : t.topolinoHelp}</span>
          <span
            aria-hidden
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full border transition-all",
              canTopolinoHelp ? "border-primary bg-primary" : "border-muted-foreground",
            )}
          >
            {canTopolinoHelp && <Check className="h-3 w-3 text-primary-foreground" />}
          </span>
        </button>
      </div>
    </div>
  )
}
