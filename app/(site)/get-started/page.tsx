"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react"

import { PillarChoice, PillarTag } from "@/components/tracker/pillar-chip"
import { HabitCard, ProtocolCard } from "@/components/tracker/protocol-card"
import { ProtocolReader } from "@/components/tracker/protocol-reader"
import { IslandRidge, VortexShell } from "@/components/patterns"
import { stagger } from "@/lib/animations"
import { CATALOG_PROTOCOLS, STANDALONE_HABITS, findProtocol, protocolsForPillars } from "@/lib/tracker/catalog"
import { scheduleLabel } from "@/lib/tracker/streaks"
import { useTracker } from "@/lib/tracker/use-tracker"
import type { CatalogHabit } from "@/lib/tracker/types"
import type { PillarId } from "@/lib/translations"
import { cn } from "@/lib/utils"

const PILLAR_IDS: PillarId[] = ["work", "sleep", "nutrition", "mind", "exercise", "finance"]

const STEPS = ["Focus", "Protocols", "Habits", "Review"] as const
type StepIndex = 0 | 1 | 2 | 3

export default function GetStartedPage() {
  const router = useRouter()
  const { state, hydrated, adoptProtocol, addHabits, setFocusPillars, completeOnboarding } =
    useTracker()

  const [step, setStep] = useState<StepIndex>(0)
  const [name, setName] = useState("")
  const [pillars, setPillars] = useState<PillarId[]>([])
  const [protocolSlugs, setProtocolSlugs] = useState<string[]>([])
  const [habitSlugs, setHabitSlugs] = useState<string[]>([])
  const [reading, setReading] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)

  // Protocols picked on /protocols before setup was finished are carried in as
  // pre-selections. Seeded once, so the user can still deselect them here.
  const seeded = useRef(false)
  useEffect(() => {
    if (!hydrated || seeded.current) return
    seeded.current = true
    if (state.pendingProtocols.length > 0) {
      setProtocolSlugs((prev) => [
        ...prev,
        ...state.pendingProtocols.filter((s) => !prev.includes(s)),
      ])
    }
  }, [hydrated, state.pendingProtocols])

  const orderedProtocols = useMemo(() => protocolsForPillars(pillars), [pillars])
  const orderedHabits = useMemo(() => {
    if (pillars.length === 0) return STANDALONE_HABITS
    const focus = new Set(pillars)
    return [...STANDALONE_HABITS].sort(
      (a, b) => Number(!focus.has(a.pillar)) - Number(!focus.has(b.pillar)),
    )
  }, [pillars])

  const chosenProtocols = protocolSlugs.map(findProtocol).filter(Boolean) as NonNullable<
    ReturnType<typeof findProtocol>
  >[]
  const chosenHabits = habitSlugs
    .map((slug) => STANDALONE_HABITS.find((h) => h.slug === slug))
    .filter(Boolean) as CatalogHabit[]

  const totalHabits =
    chosenProtocols.reduce((sum, p) => sum + p.habits.length, 0) + chosenHabits.length

  const togglePillar = (id: PillarId) =>
    setPillars((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))

  const toggleProtocol = (slug: string) =>
    setProtocolSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]))

  const toggleHabit = (slug: string) =>
    setHabitSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]))

  const canAdvance = step === 0 ? pillars.length > 0 : step === 3 ? totalHabits > 0 : true

  const finish = () => {
    // Saving before the stored state is read would clobber an existing tracker.
    if (!hydrated || totalHabits === 0) return
    setFinishing(true)
    setFocusPillars(pillars)
    protocolSlugs.forEach(adoptProtocol)
    if (chosenHabits.length > 0) addHabits(chosenHabits)
    completeOnboarding(name)
    router.push("/tracker")
  }

  return (
    <div className="relative overflow-hidden">
      <VortexShell placement="corner" gradient="plasma" size="500px" className="-right-20 -top-20" opacity={0.15} />
      <IslandRidge placement="corner" gradient="neon" size="350px" className="-left-24 top-1/3" opacity={0.1} />

      <div className="container relative mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <StepBar step={step} />

        {hydrated && state.pendingProtocols.length > 0 ? (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary"
          >
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            {state.pendingProtocols.length} protocol
            {state.pendingProtocols.length === 1 ? "" : "s"} carried over from the library —
            finish setup and {state.pendingProtocols.length === 1 ? "it becomes" : "they become"}{" "}
            daily habits.
          </motion.p>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="mt-10"
          >
            {step === 0 ? (
              <FocusStep
                name={name}
                onName={setName}
                pillars={pillars}
                onToggle={togglePillar}
              />
            ) : null}

            {step === 1 ? (
              <section className="space-y-6">
                <StepHeader
                  badge="The Protocol Library"
                  title="Pick the protocols worth your time."
                  description="Each one is a structured routine backed by real sources. Read before you commit — then it becomes daily habits you can edit."
                />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {orderedProtocols.map((protocol) => (
                    <ProtocolCard
                      key={protocol.slug}
                      protocol={protocol}
                      selected={protocolSlugs.includes(protocol.slug)}
                      onRead={() => setReading(protocol.slug)}
                      onToggle={() => toggleProtocol(protocol.slug)}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {step === 2 ? (
              <section className="space-y-6">
                <StepHeader
                  badge="Standalone Habits"
                  title="Add anything else you want to hold yourself to."
                  description="Single habits, no protocol attached. Skip this entirely if the protocols already cover you."
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {orderedHabits.map((habit) => (
                    <HabitCard
                      key={habit.slug}
                      habit={habit}
                      selected={habitSlugs.includes(habit.slug)}
                      onToggle={() => toggleHabit(habit.slug)}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {step === 3 ? (
              <ReviewStep
                protocols={chosenProtocols}
                habits={chosenHabits}
                totalHabits={totalHabits}
                onBackToProtocols={() => setStep(1)}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>

        <nav className="mt-10 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1) as StepIndex)}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </button>

          <p className="hidden text-sm text-muted-foreground sm:block">
            {totalHabits > 0
              ? `${totalHabits} habit${totalHabits === 1 ? "" : "s"} selected`
              : "Nothing selected yet"}
          </p>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(3, s + 1) as StepIndex)}
              disabled={!canAdvance}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40"
            >
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={totalHabits === 0 || finishing || !hydrated}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40"
            >
              {finishing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden />
              )}
              Start tracking
            </button>
          )}
        </nav>
      </div>

      <ProtocolReader
        protocol={reading ? findProtocol(reading) ?? null : null}
        selected={reading ? protocolSlugs.includes(reading) : false}
        onToggle={() => reading && toggleProtocol(reading)}
        onClose={() => setReading(null)}
      />
    </div>
  )
}

function StepBar({ step }: { step: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {STEPS.map((label, index) => {
        const done = index < step
        const active = index === step
        return (
          <li key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  done && "border-primary/40 bg-primary/20 text-primary",
                  active && "border-primary bg-primary text-primary-foreground",
                  !done && !active && "border-white/15 text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {index < STEPS.length - 1 ? (
              <span className={cn("h-px w-6 sm:w-10", done ? "bg-primary/40" : "bg-white/10")} aria-hidden />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

function StepHeader({
  badge,
  title,
  description,
}: {
  badge: string
  title: string
  description: string
}) {
  return (
    <header className="space-y-3">
      <span className="text-sm font-medium uppercase tracking-wider text-primary">{badge}</span>
      <h1 className="text-3xl font-bold leading-tight md:text-4xl">{title}</h1>
      <p className="max-w-2xl text-muted-foreground">{description}</p>
    </header>
  )
}

function FocusStep({
  name,
  onName,
  pillars,
  onToggle,
}: {
  name: string
  onName: (value: string) => void
  pillars: PillarId[]
  onToggle: (id: PillarId) => void
}) {
  return (
    <section className="space-y-8">
      <StepHeader
        badge="Start Here"
        title="What are you actually trying to change?"
        description="Pick the pillars you care about right now. This only orders what you see next — everything stays available."
      />

      <div>
        <label htmlFor="display-name" className="mb-2 block text-sm font-medium">
          What should we call you? <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          id="display-name"
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Your name"
          className="w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
        />
      </div>

      <motion.div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        initial="initial"
        animate="animate"
        variants={stagger.container(0.05)}
      >
        {PILLAR_IDS.map((id) => (
          <motion.div key={id} variants={stagger.item}>
            <PillarChoice pillar={id} selected={pillars.includes(id)} onToggle={() => onToggle(id)} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

function ReviewStep({
  protocols,
  habits,
  totalHabits,
  onBackToProtocols,
}: {
  protocols: NonNullable<ReturnType<typeof findProtocol>>[]
  habits: CatalogHabit[]
  totalHabits: number
  onBackToProtocols: () => void
}) {
  const everyHabit = [
    ...protocols.flatMap((p) => p.habits.map((h) => ({ ...h, from: p.name }))),
    ...habits.map((h) => ({ ...h, from: undefined as string | undefined })),
  ].sort((a, b) => a.time.localeCompare(b.time))

  return (
    <section className="space-y-6">
      <StepHeader
        badge="Review"
        title="Here's your day."
        description="This is what lands in your tracker. Nothing is locked — times, schedules and habits are all editable afterwards."
      />

      {totalHabits === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-muted-foreground">
            You haven&apos;t picked anything yet. Go back and choose at least one protocol or habit.
          </p>
          <button
            type="button"
            onClick={onBackToProtocols}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Browse protocols
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : (
        <>
          {protocols.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {protocols.map((p) => (
                <span
                  key={p.slug}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm text-primary"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  {p.name}
                </span>
              ))}
            </div>
          ) : null}

          <ol className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
            {everyHabit.map((habit) => (
              <li key={`${habit.from ?? "solo"}-${habit.slug}`} className="flex flex-wrap items-center gap-3 p-4">
                <span className="w-14 shrink-0 font-mono text-sm text-primary">{habit.time}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{habit.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {scheduleLabel(habit.schedule)}
                    {habit.from ? ` · from ${habit.from}` : ""}
                  </p>
                </div>
                <PillarTag pillar={habit.pillar} />
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
