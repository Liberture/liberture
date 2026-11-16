"use client"

import Link from "@/components/i18n/localized-link"
import { useLocale, useTranslations } from "next-intl"
import { Check } from "lucide-react"
import { CompletionCell } from "@/components/habits/completion-cell"
import type { ChallengeTracking } from "@/lib/challenges/types"
import { parseDateOnly } from "@/lib/habits/date-utils"

export function ChallengeCompletions({ tracking, busy, onToggle }: {
  tracking: ChallengeTracking
  busy: boolean
  onToggle: (day: number, complete: boolean) => void
}) {
  const t = useTranslations("challenges")
  const locale = useLocale()
  const dateFormat = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" })
  return <section className="space-y-3" aria-label={t("completionHistory")}>
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-sm font-semibold">{t(tracking.kind === "habit" ? "habitCompletions" : "todoCompletion")}</h2>
      <Link className="text-sm text-primary underline" href={tracking.kind === "habit" ? "/tracker/habits" : "/tracker/todos"}>
        {t(tracking.kind === "habit" ? "openRaceHabits" : "openRaceTasks")}
      </Link>
    </div>
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {tracking.days.map(day => <CompletionCell key={day.date} completed={day.completed} disabled={busy || !day.available}
        aria-label={t(day.completed ? "dayCompleted" : "dayIncomplete", { day: day.day, date: dateFormat.format(parseDateOnly(day.date)) })}
        onClick={() => onToggle(day.day, !day.completed)}
        className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border p-2 text-xs transition-colors ${day.completed ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/50 hover:bg-accent"}`}>
        <span className="font-medium">{dateFormat.format(parseDateOnly(day.date))}</span>
        {day.completed ? <Check aria-hidden className="size-4" /> : <span className="text-[10px]">{t("raceDay", { day: day.day })}</span>}
      </CompletionCell>)}
    </div>
  </section>
}
