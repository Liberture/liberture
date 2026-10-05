"use client"

import { useEffect, useRef, useState } from "react"
import { format } from "date-fns"
import { BookOpenCheck, ExternalLink, Undo2, X } from "lucide-react"

import { Button } from "@/components/habits/ui/button"
import { ModalPortal } from "@/components/habits/ui/modal-portal"
import type { Habit, HabitCompletion, ReadingPassage } from "@/lib/habits/types"
import { useTranslations, useDateLocale } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

/**
 * The third way to complete a habit.
 *
 * Boolean habits toggle; habits with `dataEntry` open the data modal; habits
 * with `readingContent` land here. The unit of work is reading a short passage
 * and acknowledging it, which makes the philosophy layer something you can hold
 * a streak on rather than decoration on a dashboard.
 *
 * Props deliberately mirror `HabitDataEntryModal` so the two behave identically
 * from the container's point of view.
 */

interface HabitReadingModalProps {
  habit: Habit
  date: Date
  passage: ReadingPassage
  existingCompletion?: HabitCompletion
  onSave: (result: { markComplete: boolean; context?: string; passageId: string }) => void
  onClose: () => void
}

/**
 * Passages short enough to take in at a glance don't need a dwell gate; longer
 * ones do, or "I read this" becomes a second toggle button with extra steps.
 */
const SHORT_PASSAGE_CHARS = 220
const DWELL_MS = 4000

export function HabitReadingModal({
  habit,
  date,
  passage,
  existingCompletion,
  onSave,
  onClose,
}: HabitReadingModalProps) {
  const t = useTranslations().habits.app.habitReadingModal
  const dateLocale = useDateLocale()
  const captureReflection = habit.readingContent?.captureReflection ?? false
  const alreadyComplete = Boolean(existingCompletion?.completed)

  const [reflection, setReflection] = useState(existingCompletion?.context ?? "")
  // A short passage, or one you've already read today, needs no gate.
  const [dwelled, setDwelled] = useState(
    alreadyComplete || passage.body.length <= SHORT_PASSAGE_CHARS
  )
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (dwelled) return
    const timer = setTimeout(() => setDwelled(true), DWELL_MS)
    return () => clearTimeout(timer)
  }, [dwelled])

  // Escape to close. ModalPortal handles scroll locking and lifting the overlay
  // out of the view track, which is a containing block for `position: fixed`.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  /** Scrolling to the end of a long passage is proof enough; don't make people wait out the timer. */
  const handleScroll = () => {
    const el = bodyRef.current
    if (!el || dwelled) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setDwelled(true)
  }

  const handleComplete = () => {
    onSave({
      markComplete: true,
      context: reflection.trim() || undefined,
      passageId: passage.id,
    })
  }

  const handleUndo = () => {
    onSave({ markComplete: false, context: undefined, passageId: passage.id })
  }

  const paragraphs = passage.body.split(/\n{2,}/).filter(Boolean)

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={formatMessage(t.ariaLabel, { name: habit.name })}
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="rounded-t-2xl border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className="h-4 w-4 flex-shrink-0 rounded-full shadow-sm"
                style={{ backgroundColor: habit.color }}
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-foreground">{habit.name}</h2>
                <p className="text-sm text-muted-foreground">{format(date, t.dateFormat, { locale: dateLocale })}</p>
              </div>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm" className="ml-2 h-8 w-8 flex-shrink-0 p-0">
              <X className="h-4 w-4" />
              <span className="sr-only">{t.close}</span>
            </Button>
          </div>
        </div>

        {/* The passage */}
        <div
          ref={bodyRef}
          onScroll={handleScroll}
          className="custom-scrollbar max-h-[50dvh] overflow-y-auto px-6 py-5"
        >
          {passage.title ? (
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {passage.title}
            </h3>
          ) : null}

          <div className="space-y-4">
            {paragraphs.map((paragraph, i) => (
              <p key={i} className="text-pretty text-base leading-relaxed text-foreground">
                {paragraph}
              </p>
            ))}
          </div>

          {passage.attribution ? (
            <div className="mt-5 border-l-2 border-border pl-3">
              <p className="text-sm font-medium text-foreground">— {passage.attribution}</p>
              {passage.source ? (
                passage.url ? (
                  <a
                    href={passage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground underline decoration-border underline-offset-2 hover:decoration-foreground"
                  >
                    {passage.source}
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground">{passage.source}</p>
                )
              ) : null}
            </div>
          ) : null}

          {passage.application ? (
            <p className="mt-5 rounded-lg border border-border bg-accent/30 p-3 text-sm text-foreground">
              {passage.application}
            </p>
          ) : null}

          {captureReflection ? (
            <div className="mt-5 space-y-2">
              <label htmlFor="reading-reflection" className="text-sm font-medium text-foreground">
                {habit.readingContent?.prompt ?? t.reflectionPrompt}
              </label>
              <textarea
                id="reading-reflection"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                maxLength={280}
                rows={2}
                placeholder={t.optional}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 rounded-b-2xl border-t border-border bg-muted/20 px-6 py-4">
          {alreadyComplete ? (
            <Button onClick={handleUndo} variant="ghost" size="sm" className="text-muted-foreground">
              <Undo2 className="mr-1.5 h-4 w-4" aria-hidden />
              {t.undo}
            </Button>
          ) : null}
          <div className="flex-1" />
          <Button onClick={onClose} variant="outline">
            {t.close}
          </Button>
          <Button onClick={handleComplete} disabled={!dwelled}>
            <BookOpenCheck className="mr-1.5 h-4 w-4" aria-hidden />
            {alreadyComplete ? t.saveReflection : dwelled ? t.iReadThis : t.reading}
          </Button>
        </div>
      </div>
    </div>
    </ModalPortal>
  )
}
