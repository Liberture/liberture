"use client"

import { useEffect, useId, useMemo, useRef } from "react"
import { format } from "date-fns"
import { ArrowRight, Check, Sunrise } from "lucide-react"

import { Button } from "@/components/habits/ui/button"
import { getDailyQuote } from "@/lib/habits/philosophy"
import type { Habit, HabitCompletion, UserProfile } from "@/lib/habits/types"
import { getIdentityForHabit } from "@/lib/habits/identity-language"
import { TopographicBackground } from "@/components/habits/patterns/topographic-background"
import {
  PILLAR_HEX,
  PILLAR_ICON_MAP,
  PILLAR_IDS,
  PILLAR_STYLES,
  pillarForHabit,
  type PillarId,
} from "@/lib/habits/pillars"
import { isHabitScheduledOnDate } from "@/lib/habits/habit-utils"
import { cn } from "@/lib/utils"
import { useDateLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

/**
 * The start-of-day screen, rebuilt on the Liberture surface language the rest
 * of the app moved to: pillar spines and tinted chips instead of generic
 * shadcn Cards, uppercase micro-labels, monospace tabular figures, and the
 * six-pillar palette carrying the colour rather than per-habit hexes.
 */

interface MorningDashboardProps {
  habits: Habit[]
  completions: HabitCompletion[]
  profile?: UserProfile
  onStartDay: () => void
  /** Hides it for the rest of today (persisted by the parent). Escape does the same. */
  onDismiss: () => void
  /** Ticks a habit for today from the dashboard. */
  onToggleHabit?: (habitId: string) => void
}

export function MorningDashboard({
  habits,
  completions,
  profile,
  onStartDay,
  onDismiss,
  onToggleHabit,
}: MorningDashboardProps) {
  const t = useTranslations().habits.app.morningDashboard
  const dateLocale = useDateLocale()
  const now = new Date()
  const today = format(now, "yyyy-MM-dd")
  // Keyed off the date string rather than `now`, so it stays stable across
  // renders and matches what a reading habit shows for the same day.
  const dailyQuote = useMemo(() => getDailyQuote(today), [today])
  const doneIds = new Set(
    completions.filter((c) => c.date === today && c.completed).map((c) => c.habitId)
  )

  // Only what is due today counts: a Mon/Wed/Fri habit on a Tuesday is not
  // "left to do", and counting it made the bar impossible to finish.
  const activeHabits = useMemo(
    () => habits.filter((h) => !h.archived && isHabitScheduledOnDate(h, now)),
    // `today` stands in for `now`; the list only changes with the day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [habits, today]
  )

  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismissRef.current()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [])

  // Morning habits first; with none tagged morning, the earliest of today's
  // so the list is never empty while something is still due.
  const morningTagged = activeHabits.filter((h) => h.timeOfDay === "morning")
  const morningHabits = (morningTagged.length > 0
    ? [...morningTagged].sort((a, b) => (b.priority || 3) - (a.priority || 3))
    : [...activeHabits].sort((a, b) => (a.time || "").localeCompare(b.time || ""))
  ).slice(0, 3)

  const total = activeHabits.length
  const completed = activeHabits.filter((h) => doneIds.has(h.id)).length
  const progress = total > 0 ? (completed / total) * 100 : 0

  /** Today's load per pillar, so the progress bar reads as six segments. */
  const perPillar = PILLAR_IDS.map((pillar) => {
    const owned = activeHabits.filter((h) => pillarForHabit(h) === pillar)
    return {
      pillar,
      total: owned.length,
      done: owned.filter((h) => doneIds.has(h.id)).length,
    }
  }).filter((p) => p.total > 0)

  const greeting = profile?.name ? formatMessage(t.greetingWithName, { name: profile.name }) : t.greeting

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="topo-pattern lb-see-through lb-wash fixed inset-0 z-50 overflow-auto outline-none"
    >
      <TopographicBackground />

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card/70 shadow-2xl backdrop-blur-xl">
          {/* ── Header ── */}
          <header className="border-b border-border/60 px-6 py-6 sm:px-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Sunrise className="h-3.5 w-3.5 text-exercise" aria-hidden />
              {format(now, "EEEE, d MMMM", { locale: dateLocale })}
            </div>
            <h1 id={titleId} className="mt-2 text-3xl font-bold tracking-tight text-foreground">{greeting}</h1>

            {profile?.missionStatement && (
              <p className="mt-3 border-l-2 border-primary/50 pl-3 text-sm italic leading-relaxed text-muted-foreground">
                {profile.missionStatement}
              </p>
            )}
          </header>

          <div className="space-y-7 px-6 py-6 sm:px-8">
            {/* ── Progress ── */}
            <section className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.today}
                </h2>
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  <span className="text-lg font-semibold text-foreground">{completed}</span> / {total}
                </span>
              </div>

              {/* One segment per pillar, widths proportional to today's load —
                  so the bar says *what* is left, not just how much. */}
              <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-white/[0.06]">
                {perPillar.map(({ pillar, total: count, done }) => (
                  <div
                    key={pillar}
                    className="relative h-full overflow-hidden rounded-full bg-white/[0.04]"
                    style={{ flexGrow: count }}
                    title={`${t.pillars[pillar]}: ${done}/${count}`}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{
                        width: `${(done / count) * 100}%`,
                        backgroundColor: PILLAR_HEX[pillar],
                      }}
                    />
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                {completed === 0
                  ? t.nothingLogged
                  : completed === total
                    ? t.allDone
                    : formatMessage(t.percentDone, { percent: Math.round(progress) })}
              </p>
            </section>

            {/* ── Morning habits ── */}
            {morningHabits.length > 0 && (
              <section className="space-y-2.5">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.startMorningWith}
                </h2>

                <ul className="space-y-2">
                  {morningHabits.map((habit) => (
                    <MorningHabit key={habit.id} habit={habit} done={doneIds.has(habit.id)} onToggle={onToggleHabit} />
                  ))}
                </ul>
              </section>
            )}

            {/* ── Today's passage ── */}
            {dailyQuote ? (
              <section className="rounded-xl border border-border/60 bg-white/[0.02] p-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.todaysPassage}
                </h2>
                <blockquote className="mt-1.5 space-y-1.5">
                  <p className="text-pretty text-sm leading-relaxed text-foreground/90">
                    {dailyQuote.text}
                  </p>
                  <footer className="text-xs text-muted-foreground">
                    — {dailyQuote.author}
                    {dailyQuote.source ? `, ${dailyQuote.source}` : ""}
                  </footer>
                </blockquote>
                {dailyQuote.application ? (
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                    {dailyQuote.application}
                  </p>
                ) : null}
              </section>
            ) : null}

            {/* ── Intention ── */}
            <section className="rounded-xl border border-border/60 bg-white/[0.02] p-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t.todaysIntention}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
                {t.intentionBody}
              </p>
            </section>
          </div>

          {/* ── Actions ── */}
          <footer className="flex items-center justify-between gap-3 border-t border-border/60 px-6 py-4 sm:px-8">
            <Button variant="ghost" onClick={onDismiss} className="text-muted-foreground">
              {t.dismiss}
            </Button>
            <Button onClick={onStartDay} size="lg" className="gap-2">
              {t.startDay}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </footer>
        </div>
      </div>
    </div>
  )
}

function MorningHabit({ habit, done, onToggle }: { habit: Habit; done: boolean; onToggle?: (habitId: string) => void }) {
  const t = useTranslations().habits.app.morningDashboard
  const pillar: PillarId = pillarForHabit(habit)
  const styles = PILLAR_STYLES[pillar]
  const PillarIcon = PILLAR_ICON_MAP[pillar]
  const identity = habit.identity?.identityType || getIdentityForHabit(habit.name, habit.category)

  const tiny = habit.tinyHabit
  const tinyText = !tiny
    ? null
    : tiny.currentLevel === "tiny"
      ? tiny.tinyVersion
      : tiny.currentLevel === "medium"
        ? tiny.mediumVersion
        : tiny.fullVersion

  return (
    <li
      className={cn(
        "relative flex items-center gap-3.5 overflow-hidden rounded-xl border p-3.5 pl-5 transition-colors",
        done ? cn(styles.border, styles.background) : "border-white/10 bg-white/[0.02]"
      )}
    >
      {/* Pillar spine — the card carries its colour before it's completed. */}
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", styles.solid, done ? "opacity-100" : "opacity-60")}
      />

      {onToggle ? (
        <button
          type="button"
          onClick={() => onToggle(habit.id)}
          aria-pressed={done}
          aria-label={formatMessage(done ? t.markNotDone : t.markDone, { name: habit.name })}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all active:scale-90",
            done ? cn(styles.border, styles.background, styles.text) : "border-white/15 text-transparent hover:border-primary/60"
          )}
        >
          <Check className="h-4.5 w-4.5" aria-hidden />
        </button>
      ) : (
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2",
            done ? cn(styles.border, styles.background, styles.text) : "border-white/15 text-transparent"
          )}
          aria-hidden
        >
          <Check className="h-4.5 w-4.5" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className={cn("font-medium", done ? "text-muted-foreground line-through" : "text-foreground")}>
          {habit.name}
        </p>
        {tinyText && <p className="truncate text-sm text-muted-foreground">{tinyText}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium",
              styles.text,
              styles.border,
              styles.background
            )}
          >
            <PillarIcon className="h-3 w-3" aria-hidden />
            {t.pillars[pillar]}
          </span>
          {habit.time && <span className="font-mono">{habit.time}</span>}
          {identity && (
            <>
              <span aria-hidden>·</span>
              <span>{formatMessage(t.becomeIdentity, { identity })}</span>
            </>
          )}
        </div>
      </div>
    </li>
  )
}
