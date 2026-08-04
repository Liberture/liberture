"use client"

import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  Plus,
  RotateCcw,
  TrendingUp,
} from "lucide-react"

import { HabitRow } from "@/components/tracker/habit-row"
import { RippleBloom, VortexShell } from "@/components/patterns"
import { addDays, habitsForDate, nextMilestone, summarize } from "@/lib/tracker/streaks"
import { useTracker } from "@/lib/tracker/use-tracker"
import { cn } from "@/lib/utils"

export default function TrackerPage() {
  const router = useRouter()
  const { state, hydrated, stats, toggleCompletion, isCompleted, removeHabit, reset } = useTracker()
  const [offset, setOffset] = useState(0)
  const [confirmReset, setConfirmReset] = useState(false)

  // An un-onboarded visitor has nothing to track — send them through the wizard.
  useEffect(() => {
    if (hydrated && !state.onboarded) router.replace("/get-started")
  }, [hydrated, state.onboarded, router])

  const viewDate = useMemo(() => addDays(new Date(), offset), [offset])
  const todays = useMemo(() => habitsForDate(state.habits, viewDate), [state.habits, viewDate])

  const summaries = useMemo(() => {
    const map = new Map<string, ReturnType<typeof summarize>>()
    for (const habit of state.habits) map.set(habit.id, summarize(habit, state.completions))
    return map
  }, [state.habits, state.completions])

  const doneToday = todays.filter((h) => isCompleted(h.id, viewDate)).length
  const progress = todays.length === 0 ? 0 : Math.round((doneToday / todays.length) * 100)

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading" />
      </div>
    )
  }

  if (!state.onboarded) return null

  const isToday = offset === 0
  const label = isToday
    ? "Today"
    : viewDate.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })

  return (
    <div className="relative overflow-hidden">
      <VortexShell placement="corner" gradient="plasma" size="480px" className="-right-24 -top-24" opacity={0.14} />
      <RippleBloom placement="corner" gradient="neon" size="340px" className="-left-24 top-1/2" opacity={0.1} />

      <div className="container relative mx-auto max-w-3xl px-4 py-12">
        <header className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-sm font-medium uppercase tracking-wider text-primary">
                Your tracker
              </span>
              <h1 className="mt-1 text-3xl font-bold md:text-4xl">
                {state.displayName ? `Morning, ${state.displayName}.` : "Your day, tracked."}
              </h1>
            </div>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add more
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={CalendarDays} label="Habits" value={String(stats.habitCount)} />
            <Stat icon={Flame} label="Best streak" value={String(stats.bestStreak)} tone="text-exercise" />
            <Stat icon={TrendingUp} label="7-day rate" value={`${stats.avg7}%`} tone="text-nutrition" />
            <Stat icon={CalendarDays} label="Protocols" value={String(stats.protocolCount)} tone="text-mind" />
          </div>
        </header>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOffset((o) => o - 1)}
                aria-label="Previous day"
                className="rounded-lg border border-white/10 p-2 text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <h2 className="min-w-[7rem] text-center font-semibold">{label}</h2>
              <button
                type="button"
                onClick={() => setOffset((o) => Math.min(0, o + 1))}
                disabled={offset >= 0}
                aria-label="Next day"
                className="rounded-lg border border-white/10 p-2 text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              {doneToday}/{todays.length} done
            </p>
          </div>

          <div className="mb-6 h-2 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-400 to-green-400"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", damping: 24, stiffness: 200 }}
            />
          </div>

          {todays.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center">
              <p className="text-muted-foreground">Nothing scheduled for this day.</p>
              <Link
                href="/get-started"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add a protocol
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {todays.map((habit) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    completed={isCompleted(habit.id, viewDate)}
                    streak={summaries.get(habit.id) ?? { current: 0, longest: 0, rate7: 0, rate30: 0 }}
                    onToggle={() => toggleCompletion(habit.id, viewDate)}
                    onRemove={() => removeHabit(habit.id)}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </section>

        {stats.currentBest > 0 ? <MilestoneNote current={stats.currentBest} /> : null}

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm">
          <p className="text-muted-foreground">
            Saved in this browser only — no account, nothing sent anywhere.
          </p>
          {confirmReset ? (
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  reset()
                  router.push("/get-started")
                }}
                className="rounded-lg bg-mind/20 px-3 py-1.5 font-medium text-mind hover:bg-mind/30"
              >
                Erase everything
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Start over
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  tone = "text-primary",
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <Icon className={cn("h-4 w-4", tone)} aria-hidden />
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function MilestoneNote({ current }: { current: number }) {
  const target = nextMilestone(current)
  if (!target) return null
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      {target - current} more day{target - current === 1 ? "" : "s"} to hit a {target}-day streak.
    </p>
  )
}
