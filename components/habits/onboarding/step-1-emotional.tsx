"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { getPillarAnimation } from "@/lib/animations"
import { Button } from "@/components/habits/ui/button"
import type { Habit } from "@/lib/habits/types"
import { habitCategories } from "./habit-categories"
import { FieldSelect, FieldOption } from "@/components/ui/select"
import { STARTER_WEEKS, starterMilestones } from "@/lib/habits/starter-progression"
import { formatMessage } from "@/lib/i18n-format"
import { useLocale, useTranslations } from "@/components/i18n/locale-provider"

import { Step2TinyGoals } from "./step-2-tiny-goals"

const maxOnboardingAreas = 2

interface Affirmation {
  text: string
  identity: string
  color: string
}

function IdentityAffirmations({ items }: { items: Affirmation[] }) {
  const [turn, setTurn] = useState(0)
  const reducedMotion = useReducedMotion()
  const item = items[turn % items.length]
  const words = item.text.split(/\s+/)
  const revealInterval = 0.32
  const holdUntil = (words.length - 1) * revealInterval + 1.8
  const duration = holdUntil + 0.45

  useEffect(() => {
    if (reducedMotion && items.length === 1) return
    const timer = window.setTimeout(() => setTurn(previous => previous + 1), duration * 1000)
    return () => window.clearTimeout(timer)
  }, [turn, duration, items.length, reducedMotion])

  const identityStart = item.text.lastIndexOf(item.identity)
  const prefixWords = item.text.slice(0, identityStart).trim().split(/\s+/).length
  return (
    <div className="text-3xl font-bold tracking-tight sm:text-4xl">
      <span className="sr-only">{items.map(entry => entry.text).join(" ")}</span>
      <motion.div key={turn} aria-hidden="true"
        animate={{ opacity: reducedMotion ? 1 : [1, 1, 0] }}
        transition={{ duration: reducedMotion ? 0 : duration, times: [0, holdUntil / duration, 1] }}>
        {words.map((word, index) => (
          <motion.span key={index}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.22, delay: reducedMotion ? 0 : index * revealInterval }}
            style={{ color: index >= prefixWords ? item.color : undefined }}>
            {index > 0 ? " " : ""}{word}
          </motion.span>
        ))}
      </motion.div>
    </div>
  )
}

interface Step1EmotionalProps {
  page: 2 | 3 | 4 | 5 | 6
  onPageChange: (page: 2 | 3 | 4 | 5 | 6) => void
  onStart: (habits: Habit[]) => void
}

export function Step1Emotional({ page, onPageChange, onStart }: Step1EmotionalProps) {
  const locale = useLocale()
  const app = useTranslations().habits.app
  const t = app.onboardingStep1
  const categories = habitCategories.map((category) => ({
    ...category,
    ...t.categories[category.id],
  }))
  const reducedMotion = useReducedMotion()
  type Category = (typeof categories)[number]
  const [selectedCategories, setSelectedCategories] = useState<Category["id"][]>([])
  const [habits, setHabits] = useState<Habit[]>([])

  const [timesPerWeek, setTimesPerWeek] = useState(7)
  const milestones = starterMilestones(STARTER_WEEKS, timesPerWeek)

  function startPlan() {
    onStart(habits.map(habit => ({
      ...habit,
      name: habit.tinyHabit?.tinyVersion ?? habit.name,
      tinyHabit: habit.tinyHabit && { ...habit.tinyHabit, targetWeeks: STARTER_WEEKS },
      schedule: timesPerWeek === 7 ? { type: "daily" } : { type: "times_per_week", timesPerWeek },
    })))
  }

  function toggleCategory(category: Category) {
    if (selectedCategories.includes(category.id)) {
      setSelectedCategories(previous => previous.filter(id => id !== category.id))
      setHabits(previous => previous.filter(habit => habit.category !== category.id))
    } else {
      setSelectedCategories(previous => previous.length < maxOnboardingAreas ? [...previous, category.id] : previous)
    }
  }

  function toggleHabit(category: Category, full: string, tiny: string, medium: string) {
    const existing = habits.find(habit => habit.category === category.id && habit.name === full)
    if (existing) {
      setHabits(previous => previous.filter(habit => habit.id !== existing.id))
      return
    }
    const now = new Date()
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: full,
      tinyHabit: { progression: "starter", fullVersion: full, tinyVersion: tiny, mediumVersion: medium, currentLevel: "tiny", readyToLevelUp: false },
      category: category.id,
      time: category.exampleTime,
      timeOfDay: category.exampleTime < "12:00" ? "morning" : category.exampleTime < "17:00" ? "afternoon" : "evening",
      color: category.color,
      schedule: { type: "daily" },
      priority: 5,
      createdAt: now.toISOString(),
      startDate: now.toLocaleDateString("en-CA"),
    }
    setHabits(previous => [...previous, habit])
  }

  if (page === 6) {
    const copy = app.onboardingStep4
    const chosen = categories.flatMap(category => {
      const selected = habits.filter(habit => habit.category === category.id)
      if (!selected.length) return []
      const foodOnly = category.id === "health" && selected.every(habit =>
        app.onboardingStep2.choices.health.some(choice => "foodFocused" in choice && choice.foodFocused && choice.full === habit.name)
      )
      const identity = foodOnly ? copy.foodIdentity : copy.identities[category.id]
      return [{ ...identity, color: category.color }]
    })
    const phrases = chosen.map(entry => entry.identityPhrase)
    const identity = new Intl.ListFormat(locale, { type: "conjunction" }).format(phrases)
    return (
      <div className="space-y-6 text-center">
        <h2 className="mx-auto w-[85%] text-balance text-2xl font-bold">{formatMessage(copy.thinkOfYourself, { identity })}</h2>
        <div className="space-y-2">
          <p>{copy.youWillSay}</p>
          <IdentityAffirmations items={chosen.map(({ identity, identityPhrase, color }) => ({
            text: formatMessage(copy.iAmQuote, { identity: identityPhrase }), identity, color,
          }))} />
          <p className="text-sm text-muted-foreground">{copy.eachRepetition}</p>
        </div>
        <div className="onboarding-actions">
          <Button variant="ghost" className="border border-white/50" onClick={() => onPageChange(5)}>{copy.back}</Button>
          <Button onClick={startPlan}>{t.startTracking}</Button>
        </div>
      </div>
    )
  }

  if (page === 5) {
    const review = app.onboardingStep2
    return (
      <div className="space-y-6">
        <h2 className="text-center text-2xl font-bold">{review.reviewTitle}</h2>
        <table className="w-full table-fixed text-left text-sm">
          <thead className="text-muted-foreground">
            <tr><th scope="col" className="p-2 text-center">{review.chosenLabel}</th><th scope="col" className="p-2 text-center">{review.tinyLabel}</th></tr>
          </thead>
          <tbody>
            {habits.map(habit => (
              <tr key={habit.id} className="border-t border-border">
                <th scope="row" className="p-2 align-top font-medium">
                  <span aria-hidden="true" className="mr-2 inline-block size-2 rounded-full" style={{ backgroundColor: habit.color }} />
                  {habit.name}
                </th>
                <td className="p-2 align-top">{habit.tinyHabit?.tinyVersion}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mx-auto w-[85%] text-center text-sm text-muted-foreground">{review.whyBody}</p>
        <div className="onboarding-actions">
          <Button variant="ghost" className="border border-white/50" onClick={() => onPageChange(4)}>{review.back}</Button>
          <Button onClick={() => onPageChange(6)}>{t.continue}</Button>
        </div>
      </div>
    )
  }

  if (page === 4) {
    const review = app.onboardingStep2
    return (
      <div className="space-y-6">
        <h2 className="text-center text-2xl font-bold">{review.paceTitle}</h2>
        <p className="mx-auto w-[85%] text-balance text-center text-muted-foreground">{review.paceBody}</p>
        <div className="mx-auto flex w-fit items-center gap-3 text-sm">
          <label className="shrink-0 whitespace-nowrap" htmlFor="starter-frequency">{review.frequencyLabel}</label>
          <FieldSelect className="w-20" id="starter-frequency" value={timesPerWeek} onValueChange={value => setTimesPerWeek(Number(value))}>
            {[3, 4, 5, 6, 7].map(times => <FieldOption key={times} value={times}>{times}</FieldOption>)}
          </FieldSelect>
        </div>
        <p aria-live="polite" className="mx-auto w-[85%] text-center text-sm text-muted-foreground">{formatMessage(review.planSummary, milestones)}</p>
        <div className="onboarding-actions">
          <Button variant="ghost" className="border border-white/50" onClick={() => onPageChange(3)}>{review.back}</Button>
          <Button onClick={() => onPageChange(5)}>{t.continue}</Button>
        </div>
      </div>
    )
  }

  if (page === 3) {
    return (
      <div className="space-y-6">
        <h2 className="text-center text-2xl font-bold">{app.onboardingStep2.title}</h2>
        <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(15rem,1fr))]">
          {categories.filter(category => selectedCategories.includes(category.id)).map(category => (
            <Step2TinyGoals key={category.id} category={category} selected={habits.filter(habit => habit.category === category.id)}
              onToggle={(full, tiny, medium) => toggleHabit(category, full, tiny, medium)} />
          ))}
        </div>
        <div className="onboarding-actions">
          <Button variant="ghost" className="border border-white/50" onClick={() => onPageChange(2)}>{app.onboardingStep2.back}</Button>
          <Button disabled={!habits.length} onClick={() => onPageChange(4)}>{t.continue}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {categories.map(category => {
          const { id, name, icon: Icon, color, animation } = category
          const iconMotion = getPillarAnimation(animation)
          const selected = selectedCategories.includes(id)
          return (
            <button key={id} type="button" aria-pressed={selected}
              disabled={!selected && selectedCategories.length >= maxOnboardingAreas}
              onClick={() => toggleCategory(category)}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 font-medium disabled:opacity-50 aria-pressed:ring-2 aria-pressed:ring-primary">
              <motion.span aria-hidden="true" className="text-muted-foreground motion-safe:transition-colors" style={{ color: selected ? color : undefined }}
                animate={reducedMotion ? { y: 0, scale: 1, rotate: 0, opacity: 1 } : iconMotion.animate}
                transition={reducedMotion ? { duration: 0 } : iconMotion.transition}>
                <Icon className="h-6 w-6" />
              </motion.span>
              {name}
            </button>
          )
        })}
      </div>
      <div className="onboarding-actions">
        <Button type="button" disabled={!selectedCategories.length} onClick={() => onPageChange(3)}>{t.continue}</Button>
      </div>
    </div>
  )
}
