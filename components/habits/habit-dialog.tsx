"use client"

import { useState, type ReactNode } from "react"
import {
  Archive,
  ArchiveRestore,
  Bell,
  Brain,
  CalendarDays,
  ChevronDown,
  Minus,
  NotebookPen,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import type { DataEntryField, Habit, HabitTag, ImplementationIntention } from "@/lib/habits/types"
import { HABIT_TAGS } from "@/lib/habits/motivational-messages"
import { inferTimeOfDay } from "@/lib/habits/habit-utils"
import {
  PILLAR_HEX,
  PILLAR_ICON_MAP,
  PILLAR_IDS,
  pillarForHabit,
  type PillarId,
} from "@/lib/habits/pillars"
import { Button } from "@/components/habits/ui/button"
import { Input } from "@/components/habits/ui/input"
import { ModalPortal } from "@/components/habits/ui/modal-portal"
import { SmartTimePicker } from "@/components/habits/smart-time-picker"
import { Switch } from "@/components/habits/ui/switch"
import { Textarea } from "@/components/habits/ui/textarea"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

type HabitDialogMode = "create" | "edit"

type HabitDialogStrings = ReturnType<typeof useTranslations>["habits"]["app"]["habitDialog"]

interface HabitDialogProps {
  mode: HabitDialogMode
  habit?: Habit
  onCreate?: (habitData: Partial<Habit>) => void
  onUpdate?: (habitId: string, updates: Partial<Habit>) => void
  onDelete?: (habitId: string) => void
  onArchive?: (habitId: string) => void
  onUnarchive?: (habitId: string) => void
  onClose: () => void
}

/** Day indexes (0 = Sunday); short names come from translations (`daysShort`). */
const DAYS = [0, 1, 2, 3, 4, 5, 6].map((value) => ({ value }))

/** Schedule types; labels come from translations (`frequencies`). */
const FREQUENCIES: Habit["schedule"]["type"][] = ["daily", "specific_days", "times_per_week"]

/** Parts of the day; labels come from translations (`partsOfDay`). */
const PARTS_OF_DAY: NonNullable<Habit["timeOfDay"]>[] = ["anytime", "morning", "afternoon", "evening"]

/** Priority values; labels come from translations (`priorities`, indexed value - 1). */
const PRIORITIES = [1, 2, 3, 4, 5]

const DEFAULT_COLOR = "#6366f1"

/** Colours the user never chose deliberately, so switching area may repaint them. */
const AUTO_COLORS = new Set<string>([DEFAULT_COLOR, ...PILLAR_IDS.map((p) => PILLAR_HEX[p])])

const DESCRIPTION_MAX = 500

function newDataField(type: DataEntryField["type"], t: HabitDialogStrings): DataEntryField {
  return {
    id: crypto.randomUUID(),
    type,
    label: type === "number" ? t.defaultNumberLabel : t.defaultTextLabel,
    unit: type === "number" ? "min" : undefined,
  }
}

function scheduleSummary(type: Habit["schedule"]["type"], days: number[], perWeek: number, t: HabitDialogStrings): string {
  if (type === "daily") return t.summary.daily
  if (type === "times_per_week") return formatMessage(t.timesPerWeekValue, { count: perWeek })
  if (days.length === 0) return t.summary.noDays
  if (days.join() === "1,2,3,4,5") return t.summary.weekdays
  if (days.join() === "0,6") return t.summary.weekends
  return DAYS.filter((d) => days.includes(d.value)).map((d) => t.daysShort[d.value]).join(", ")
}

/** A titled group with a one-line explanation, so each block says what it is for. */
function Section({ icon, title, hint, children }: { icon: ReactNode; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-background/60 p-4 sm:p-5">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {icon}
          {title}
        </h3>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  )
}

function FieldLabel({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {children}
      </label>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )
}

/** Pill buttons for a single choice; replaces the old native selects. */
function Choice<T extends string | number>({
  options,
  value,
  onChange,
  label,
  columns,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  label: string
  columns?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("grid gap-2", columns ?? "grid-cols-2 sm:grid-cols-4")}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function HabitDialog({ mode, habit, onCreate, onUpdate, onDelete, onArchive, onUnarchive, onClose }: HabitDialogProps) {
  const t = useTranslations().habits.app.habitDialog
  const COMMON_TRIGGERS = t.triggers
  const frequencyOptions = FREQUENCIES.map((value) => ({ value, label: t.frequencies[value] }))
  const partOfDayOptions = PARTS_OF_DAY.map((value) => ({ value, label: t.partsOfDay[value] }))
  const priorityOptions = PRIORITIES.map((value) => ({ value, label: t.priorities[value - 1] }))
  const [name, setName] = useState(habit?.name ?? "")
  const [description, setDescription] = useState(habit?.description ?? "")
  const [time, setTime] = useState(habit?.time ?? "08:00")
  const [color, setColor] = useState(habit?.color ?? DEFAULT_COLOR)
  const [priority, setPriority] = useState(habit?.priority ?? 3)
  // The area *is* the category: pillar ids map onto themselves in
  // CATEGORY_TO_PILLAR, so storing the id makes the grid/matrix colouring exact
  // instead of leaning on keyword inference. Editing an existing habit starts
  // from whatever that inference already decided, which makes it stick on save.
  const [area, setArea] = useState<PillarId | null>(habit ? pillarForHabit(habit) : null)
  const [timeOfDay, setTimeOfDay] = useState<NonNullable<Habit["timeOfDay"]>>(habit?.timeOfDay ?? inferTimeOfDay(habit?.time ?? "08:00"))
  // Follow the time until the user picks a part of the day themselves.
  const [timeOfDayTouched, setTimeOfDayTouched] = useState(Boolean(habit?.timeOfDay))
  const [scheduleType, setScheduleType] = useState<Habit["schedule"]["type"]>(habit?.schedule?.type ?? "daily")
  const [selectedDays, setSelectedDays] = useState<number[]>(habit?.schedule?.days ?? [1, 2, 3, 4, 5])
  const [timesPerWeek, setTimesPerWeek] = useState(habit?.schedule?.timesPerWeek ?? 3)
  const [selectedTags, setSelectedTags] = useState<HabitTag[]>(habit?.tags ?? [])
  const [randomRemindersEnabled, setRandomRemindersEnabled] = useState(Boolean(habit?.randomRemindersEnabled))

  const [dataEntryEnabled, setDataEntryEnabled] = useState(Boolean(habit?.dataEntry?.enabled))
  const [dataFields, setDataFields] = useState<DataEntryField[]>(habit?.dataEntry?.fields?.length ? habit.dataEntry.fields : [newDataField("number", t)])

  const initialTrigger = habit?.implementationIntention?.trigger ?? ""
  const initialCustomTrigger = initialTrigger && !COMMON_TRIGGERS.includes(initialTrigger) ? initialTrigger : ""
  const [showIntention, setShowIntention] = useState(Boolean(habit?.implementationIntention))
  const [intentionTrigger, setIntentionTrigger] = useState(initialCustomTrigger ? "custom" : initialTrigger)
  const [intentionCustomTrigger, setIntentionCustomTrigger] = useState(initialCustomTrigger)
  const [intentionBehavior, setIntentionBehavior] = useState(habit?.implementationIntention?.behavior ?? "")
  const [intentionObstacles, setIntentionObstacles] = useState<Array<{ obstacle: string; strategy: string }>>(
    habit?.implementationIntention?.obstacles ?? [],
  )

  // Extras start open only when the habit already uses one of them.
  const [showMore, setShowMore] = useState(
    Boolean(habit && (habit.dataEntry?.enabled || habit.implementationIntention || (habit.tags?.length ?? 0) > 0))
  )

  const toggleDay = (day: number) => {
    setSelectedDays((current) => current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort())
  }

  const selectArea = (next: PillarId) => {
    setArea(next)
    // Only repaint a colour the user never picked themselves.
    setColor((current) => (AUTO_COLORS.has(current.toLowerCase()) ? PILLAR_HEX[next] : current))
  }

  const changeTime = (next: string) => {
    setTime(next)
    if (!timeOfDayTouched) setTimeOfDay(inferTimeOfDay(next))
  }

  const toggleTag = (tag: HabitTag) => {
    setSelectedTags((current) => current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag])
  }

  const updateDataField = (id: string, updates: Partial<DataEntryField>) => {
    setDataFields((current) => current.map((field) => field.id === id ? { ...field, ...updates } : field))
  }

  const removeDataField = (id: string) => {
    setDataFields((current) => current.filter((field) => field.id !== id))
  }

  const updateObstacle = (index: number, updates: Partial<{ obstacle: string; strategy: string }>) => {
    setIntentionObstacles((current) => current.map((item, i) => i === index ? { ...item, ...updates } : item))
  }

  const buildSchedule = (): Habit["schedule"] => {
    if (scheduleType === "specific_days") return { type: "specific_days", days: selectedDays }
    if (scheduleType === "times_per_week") return { type: "times_per_week", timesPerWeek }
    return { type: "daily" }
  }

  const buildIntention = (): ImplementationIntention | undefined => {
    if (!showIntention) return undefined
    const trigger = intentionTrigger === "custom" ? intentionCustomTrigger.trim() : intentionTrigger.trim()
    const behavior = intentionBehavior.trim()
    if (!trigger || !behavior) return undefined
    return {
      trigger,
      behavior,
      obstacles: intentionObstacles.filter((item) => item.obstacle.trim() && item.strategy.trim()),
    }
  }

  const buildDataEntry = (): Habit["dataEntry"] | undefined => {
    if (!dataEntryEnabled) return mode === "edit" ? { enabled: false, fields: [] } : undefined
    return {
      enabled: true,
      fields: dataFields.map((field) => ({
        ...field,
        label: field.label.trim() || (field.type === "number" ? t.defaultNumberLabel : t.defaultTextLabel),
        unit: field.type === "number" ? field.unit?.trim() || undefined : undefined,
        goalValue: field.type === "number" && field.goalValue ? Number(field.goalValue) : undefined,
      })),
    }
  }

  const daysInvalid = scheduleType === "specific_days" && selectedDays.length === 0
  const canSave = Boolean(name.trim()) && !daysInvalid

  const handleSave = () => {
    const trimmedName = name.trim()
    if (!trimmedName || daysInvalid) return

    const updates: Partial<Habit> = {
      name: trimmedName,
      // Empty string clears it on edit; undefined keeps new habits free of the key.
      description: description.trim() || (mode === "edit" ? "" : undefined),
      time,
      color,
      priority,
      category: area ?? habit?.category ?? "personal",
      timeOfDay,
      schedule: buildSchedule(),
      tags: selectedTags,
      randomRemindersEnabled,
      implementationIntention: buildIntention(),
      dataEntry: buildDataEntry(),
    }

    if (mode === "edit" && habit) onUpdate?.(habit.id, updates)
    else onCreate?.(updates)
    onClose()
  }

  const handleDelete = () => {
    if (!habit || !onDelete) return
    if (confirm(formatMessage(t.confirmDelete, { name: habit.name }))) {
      onDelete(habit.id)
      onClose()
    }
  }

  const handleArchive = () => {
    if (!habit) return
    if (habit.archived) onUnarchive?.(habit.id)
    else onArchive?.(habit.id)
    onClose()
  }

  const summary = [scheduleSummary(scheduleType, selectedDays, timesPerWeek, t), time || null, area ? t.pillars[area] : null]
    .filter(Boolean)
    .join(" · ")

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm animate-in fade-in sm:items-center sm:p-4"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose()
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="habit-dialog-title"
          className="flex max-h-[96dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl duration-200 animate-in slide-in-from-bottom-4 sm:max-h-[92dvh] sm:rounded-2xl"
        >
          {/* ---------- Header ---------- */}
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="h-9 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
              <div className="min-w-0">
                <h2 id="habit-dialog-title" className="truncate text-lg font-bold text-foreground">
                  {mode === "edit" ? t.titleEdit : t.titleCreate}
                </h2>
                <p className="truncate text-xs text-muted-foreground">{summary}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ---------- Body ---------- */}
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <Section icon={<NotebookPen className="h-4 w-4 text-primary" />} title={t.sections.habit} hint={t.sections.habitHint}>
              <div>
                <FieldLabel htmlFor="habit-name">{t.name}</FieldLabel>
                <Input
                  id="habit-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    if (!intentionBehavior) setIntentionBehavior(event.target.value)
                  }}
                  placeholder={t.namePlaceholder}
                  className="h-11 text-base"
                  autoFocus
                />
              </div>
              <div>
                <FieldLabel htmlFor="habit-description" hint={formatMessage(t.descriptionHint, { count: description.length, max: DESCRIPTION_MAX })}>
                  {t.description}
                </FieldLabel>
                <Textarea
                  id="habit-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value.slice(0, DESCRIPTION_MAX))}
                  placeholder={t.descriptionPlaceholder}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div>
                <FieldLabel hint={area ? t.pillarDescriptions[area] : t.areaHint}>{t.area}</FieldLabel>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PILLAR_IDS.map((pillar) => {
                    const Icon = PILLAR_ICON_MAP[pillar]
                    const selected = area === pillar
                    return (
                      <button
                        key={pillar}
                        type="button"
                        onClick={() => selectArea(pillar)}
                        aria-pressed={selected}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          selected ? "text-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"
                        )}
                        style={selected ? { borderColor: PILLAR_HEX[pillar], backgroundColor: `${PILLAR_HEX[pillar]}22` } : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" style={{ color: PILLAR_HEX[pillar] }} />
                        {t.pillars[pillar]}
                      </button>
                    )
                  })}
                </div>
              </div>
            </Section>

            <Section icon={<CalendarDays className="h-4 w-4 text-primary" />} title={t.sections.when} hint={t.sections.whenHint}>
              <div>
                <FieldLabel>{t.howOften}</FieldLabel>
                <Choice label={t.howOften} options={frequencyOptions} value={scheduleType} onChange={setScheduleType} columns="grid-cols-3" />
              </div>

              {scheduleType === "specific_days" && (
                <div>
                  <FieldLabel hint={daysInvalid ? <span className="text-exercise">{t.pickOneDay}</span> : undefined}>{t.whichDays}</FieldLabel>
                  <div className="grid grid-cols-7 gap-1.5">
                    {DAYS.map((day) => {
                      const selected = selectedDays.includes(day.value)
                      return (
                        <button
                          key={day.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleDay(day.value)}
                          className={cn(
                            "rounded-lg border py-2 text-xs font-semibold transition-colors",
                            selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {t.daysShort[day.value]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {scheduleType === "times_per_week" && (
                <div>
                  <FieldLabel hint={t.timesPerWeekHint}>{t.timesPerWeek}</FieldLabel>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="secondary" size="sm" className="h-9 w-9 p-0" aria-label={t.fewer} onClick={() => setTimesPerWeek((n) => Math.max(1, n - 1))}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-24 text-center text-sm font-semibold text-foreground">{formatMessage(t.timesPerWeekValue, { count: timesPerWeek })}</span>
                    <Button type="button" variant="secondary" size="sm" className="h-9 w-9 p-0" aria-label={t.more} onClick={() => setTimesPerWeek((n) => Math.min(7, n + 1))}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel hint={t.timeHint}>{t.time}</FieldLabel>
                  <SmartTimePicker value={time} onChange={changeTime} />
                </div>
                <div>
                  <FieldLabel hint={t.partOfDayHint}>{t.partOfDay}</FieldLabel>
                  <Choice
                    label={t.partOfDay}
                    options={partOfDayOptions}
                    value={timeOfDay}
                    onChange={(value) => {
                      setTimeOfDay(value)
                      setTimeOfDayTouched(true)
                    }}
                    columns="grid-cols-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-3 py-2.5">
                <label htmlFor="habit-nudges" className="min-w-0 cursor-pointer">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Bell className="h-4 w-4 text-primary" />
                    {t.nudges}
                  </span>
                  <span className="block text-xs text-muted-foreground">{t.nudgesHint}</span>
                </label>
                <Switch id="habit-nudges" checked={randomRemindersEnabled} onCheckedChange={setRandomRemindersEnabled} />
              </div>
            </Section>

            {/* ---------- Extras ---------- */}
            <button
              type="button"
              onClick={() => setShowMore((open) => !open)}
              aria-expanded={showMore}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-secondary/60 px-4 py-3 text-left transition-colors hover:bg-secondary"
            >
              <span>
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t.moreOptions}
                </span>
                <span className="block text-xs text-muted-foreground">{t.moreOptionsHint}</span>
              </span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", showMore && "rotate-180")} />
            </button>

            {showMore && (
              <>
                <Section icon={<Sparkles className="h-4 w-4 text-primary" />} title={t.sections.look}>
                  <div>
                    <FieldLabel hint={t.priorityHint}>{t.priority}</FieldLabel>
                    <Choice label={t.priority} options={priorityOptions} value={priority} onChange={setPriority} columns="grid-cols-3 sm:grid-cols-5" />
                  </div>
                  <div>
                    <FieldLabel hint={t.colorHint}>{t.color}</FieldLabel>
                    <div className="flex flex-wrap items-center gap-2">
                      {PILLAR_IDS.map((pillar) => (
                        <button
                          key={pillar}
                          type="button"
                          aria-label={formatMessage(t.pillarColor, { pillar: t.pillars[pillar] })}
                          onClick={() => setColor(PILLAR_HEX[pillar])}
                          className={cn(
                            "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                            color.toLowerCase() === PILLAR_HEX[pillar].toLowerCase() ? "border-foreground" : "border-transparent"
                          )}
                          style={{ backgroundColor: PILLAR_HEX[pillar] }}
                        />
                      ))}
                      <label className="relative flex h-8 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs text-muted-foreground">
                        <input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0" />
                        {t.customColor}
                      </label>
                    </div>
                  </div>
                  <div>
                    <FieldLabel hint={t.tagsHint}>{t.tags}</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {HABIT_TAGS.map((tag) => (
                        <button
                          key={tag.value}
                          type="button"
                          aria-pressed={selectedTags.includes(tag.value)}
                          onClick={() => toggleTag(tag.value)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                            selectedTags.includes(tag.value)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span>{tag.emoji}</span>
                          <span>{t.tagLabels[tag.value] ?? tag.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </Section>

                <Section icon={<NotebookPen className="h-4 w-4 text-primary" />} title={t.sections.data} hint={t.sections.dataHint}>
                  <div className="flex items-center justify-between gap-4">
                    <label htmlFor="habit-data" className="cursor-pointer text-sm font-medium text-foreground">{t.askOnComplete}</label>
                    <Switch id="habit-data" checked={dataEntryEnabled} onCheckedChange={setDataEntryEnabled} />
                  </div>
                  {dataEntryEnabled && (
                    <div className="space-y-3">
                      {dataFields.map((field) => (
                        <div key={field.id} className="space-y-3 rounded-lg border border-border bg-card p-3">
                          <div className="flex items-center gap-2">
                            <Choice
                              label={t.fieldType}
                              options={[{ value: "number", label: t.fieldTypeNumber }, { value: "text", label: t.fieldTypeText }]}
                              value={field.type}
                              onChange={(type) => updateDataField(field.id, { type })}
                              columns="grid-cols-2 flex-1"
                            />
                            <Button type="button" variant="secondary" size="sm" onClick={() => removeDataField(field.id)} className="h-9 w-9 shrink-0 p-0" aria-label={t.removeField}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className={cn("grid gap-2", field.type === "number" ? "grid-cols-[minmax(0,1fr)_80px_80px]" : "grid-cols-1")}>
                            <div>
                              <span className="mb-1 block text-xs text-muted-foreground">{t.fieldLabel}</span>
                              <Input value={field.label} onChange={(event) => updateDataField(field.id, { label: event.target.value })} placeholder={t.fieldLabelPlaceholder} />
                            </div>
                            {field.type === "number" && (
                              <>
                                <div>
                                  <span className="mb-1 block text-xs text-muted-foreground">{t.fieldUnit}</span>
                                  <Input value={field.unit ?? ""} onChange={(event) => updateDataField(field.id, { unit: event.target.value })} placeholder={t.fieldUnitPlaceholder} />
                                </div>
                                <div>
                                  <span className="mb-1 block text-xs text-muted-foreground">{t.fieldGoal}</span>
                                  <Input type="number" value={field.goalValue ?? ""} onChange={(event) => updateDataField(field.id, { goalValue: event.target.value ? Number(event.target.value) : undefined })} placeholder="5" />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="secondary" size="sm" onClick={() => setDataFields((current) => [...current, newDataField("number", t)])} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t.addField}
                      </Button>
                    </div>
                  )}
                </Section>

                <Section icon={<Brain className="h-4 w-4 text-primary" />} title={t.sections.intention} hint={t.sections.intentionHint}>
                  <div className="flex items-center justify-between gap-4">
                    <label htmlFor="habit-intention" className="cursor-pointer text-sm font-medium text-foreground">{t.useIntention}</label>
                    <Switch id="habit-intention" checked={showIntention} onCheckedChange={setShowIntention} />
                  </div>
                  {showIntention && (
                    <div className="space-y-3">
                      <div>
                        <FieldLabel htmlFor="habit-trigger">{t.when}</FieldLabel>
                        <select
                          id="habit-trigger"
                          value={intentionTrigger}
                          onChange={(event) => setIntentionTrigger(event.target.value)}
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="">{t.pickMoment}</option>
                          {COMMON_TRIGGERS.map((trigger) => <option key={trigger} value={trigger}>{trigger}</option>)}
                          <option value="custom">{t.somethingElse}</option>
                        </select>
                        {intentionTrigger === "custom" && (
                          <Input className="mt-2" value={intentionCustomTrigger} onChange={(event) => setIntentionCustomTrigger(event.target.value)} placeholder={t.customTriggerPlaceholder} />
                        )}
                      </div>
                      <div>
                        <FieldLabel htmlFor="habit-behavior">{t.iWill}</FieldLabel>
                        <Input id="habit-behavior" value={intentionBehavior} onChange={(event) => setIntentionBehavior(event.target.value)} placeholder={t.behaviorPlaceholder} />
                      </div>
                      <div className="space-y-2">
                        <span className="block text-sm font-medium text-foreground">{t.obstaclesTitle}</span>
                        {intentionObstacles.map((item, index) => (
                          <div key={index} className="grid gap-2 rounded-lg border border-border bg-card p-3">
                            <Input value={item.obstacle} onChange={(event) => updateObstacle(index, { obstacle: event.target.value })} placeholder={t.obstaclePlaceholder} />
                            <div className="flex gap-2">
                              <Input value={item.strategy} onChange={(event) => updateObstacle(index, { strategy: event.target.value })} placeholder={t.strategyPlaceholder} />
                              <Button type="button" variant="secondary" size="sm" onClick={() => setIntentionObstacles((current) => current.filter((_, i) => i !== index))} className="h-9 w-9 shrink-0 p-0" aria-label={t.remove}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button type="button" variant="secondary" size="sm" onClick={() => setIntentionObstacles((current) => [...current, { obstacle: "", strategy: "" }])} className="gap-2">
                          <Plus className="h-4 w-4" />
                          {t.addBackupPlan}
                        </Button>
                      </div>
                    </div>
                  )}
                </Section>
              </>
            )}
          </div>

          {/* ---------- Footer ---------- */}
          <div className="flex flex-col-reverse gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            {mode === "edit" && habit ? (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleDelete} className="gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  {t.delete}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleArchive} className="gap-2">
                  {habit.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  {habit.archived ? t.unarchive : t.archive}
                </Button>
              </div>
            ) : (
              <span className="hidden sm:block" />
            )}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <Button variant="secondary" onClick={onClose} className="border border-border">
                {t.cancel}
              </Button>
              <Button onClick={handleSave} disabled={!canSave}>
                {mode === "edit" ? t.saveChanges : t.create}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
