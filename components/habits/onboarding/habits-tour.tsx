"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { useTranslations } from "@/components/i18n/locale-provider"
import { isHabitDueOnDate } from "@/lib/habits/habit-utils"
import { formatMessage } from "@/lib/i18n-format"
import { habitMilestones } from "@/lib/habits/starter-progression"
import type { Habit, HabitCompletion } from "@/lib/habits/types"
import { Button } from "@/components/habits/ui/button"

export function HabitsTour({ habits, completions, weekStartsOn, onClose }: { habits: Habit[]; completions: HabitCompletion[]; weekStartsOn: 0 | 1; onClose: () => void }) {
  const t = useTranslations().habits.app.habitsTour
  const dialog = useRef<HTMLDialogElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const [position, setPosition] = useState<{ rect: DOMRect; left: number; top: number } | null>(null)
  const today = new Date()
  const first = habits.find(habit => isHabitDueOnDate(habit, today, completions, weekStartsOn))
  const thresholds = first && habitMilestones(first)
  const plan = first?.tinyHabit
  const target = step === 0 ? '[data-tour="summary"]' : step === 1 ? '[data-tour="dates"]'
    : `[data-tour-habit="${CSS.escape(first?.id ?? "")}"]`

  useLayoutEffect(() => {
    const modal = dialog.current!
    modal.showModal()
    return () => modal.close()
  }, [])

  useLayoutEffect(() => {
    const anchor = document.querySelector<HTMLElement>(target)
    const panel = popup.current!
    anchor?.scrollIntoView({ block: "center", behavior: "auto" })
    function place() {
      const rect = anchor?.getBoundingClientRect() ?? new DOMRect(innerWidth / 2, innerHeight / 2, 0, 0)
      const { width, height } = panel.getBoundingClientRect()
      const gap = 12
      let left = rect.left + (rect.width - width) / 2
      let top = rect.bottom + gap
      if (innerWidth - rect.right >= width + gap * 2 || rect.left >= width + gap * 2) {
        left = innerWidth - rect.right >= width + gap * 2 ? rect.right + gap : rect.left - width - gap
        top = rect.top + (rect.height - height) / 2
      } else if (top + height > innerHeight - gap && rect.top > innerHeight - rect.bottom) {
        top = rect.top - height - gap
      }
      setPosition({ rect, left: Math.max(gap, Math.min(left, innerWidth - width - gap)), top: Math.max(gap, Math.min(top, innerHeight - height - gap)) })
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(panel)
    if (anchor) observer.observe(anchor)
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", place, true)
    }
  }, [target])

  const title = [t.summary, t.dates, t.start][step]
  const body = [t.summaryBody, t.datesBody, t.startBody][step]
  return (
    <dialog ref={dialog} aria-labelledby="habits-tour-title" onCancel={onClose}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-transparent p-0 text-foreground backdrop:bg-transparent">
      {position && <div aria-hidden="true" className="absolute rounded-xl ring-2 ring-primary/80"
        style={{ top: position.rect.top - 4, left: position.rect.left - 4, width: position.rect.width + 8, height: position.rect.height + 8, boxShadow: "0 0 0 200vmax rgb(0 0 0 / 65%)" }} />}
      <div ref={popup} className="absolute max-h-[calc(100dvh-24px)] w-72 max-w-[calc(100vw-24px)] space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-xl"
        style={{ left: position?.left, top: position?.top }}>
        <h2 id="habits-tour-title" className="font-semibold" aria-live="polite">{title}</h2>
        <p className="text-sm text-muted-foreground">{body}</p>
        {step === 2 && (plan?.progression === "starter" && plan.mediumVersion && thresholds ? (
          <div className="space-y-2">
            <ol className="divide-y divide-border text-sm">
              {[plan.tinyVersion, plan.mediumVersion, plan.fullVersion].map((task, index) => (
                <li key={index} className="grid grid-cols-[4rem_1fr] gap-2 py-1.5">
                  <span className="text-muted-foreground">{formatMessage(t.stages[index], { count: index === 1 ? thresholds.medium : thresholds.full })}</span>
                  <span className={task === first?.name ? "font-semibold" : undefined}>{task}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground">{formatMessage(t.pace, { times: first?.schedule?.timesPerWeek ?? 7 })}</p>
          </div>
        ) : <p className="text-sm font-semibold">{first?.name}</p>)}
        <div className="flex justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>{t.skip}</Button>
          <Button size="sm" onClick={() => step === 2 || (step === 1 && !first) ? onClose() : setStep(step + 1)}>
            {step === 2 ? t.finish : t.next}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
