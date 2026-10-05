import type { LucideIcon } from "lucide-react"
import { Brain, Dumbbell, Heart, Leaf, Wallet, Zap } from "lucide-react"

import type { Habit, HabitTag } from "@/lib/habits/types"

/**
 * The six Liberture pillars. Each has a CSS custom property of the same name in
 * app/globals.css, exposed to Tailwind as `text-work`, `bg-sleep/10`, etc.
 */
export type PillarId = "work" | "sleep" | "nutrition" | "mind" | "exercise" | "finance"

export const PILLAR_IDS: PillarId[] = ["work", "sleep", "nutrition", "mind", "exercise", "finance"]

/** Names as Liberture publishes them — kept identical so the two apps agree. */
export const PILLAR_LABELS: Record<PillarId, string> = {
  work: "Work",
  sleep: "Sleep",
  nutrition: "Nutrition",
  mind: "Mind",
  exercise: "Exercise",
  finance: "Finance",
}

/** One-line descriptions, also from Liberture's translations. */
export const PILLAR_DESCRIPTIONS: Record<PillarId, string> = {
  work: "Productivity, flow states, and professional performance.",
  sleep: "Sleep quality, recovery, and circadian rhythm.",
  nutrition: "What you eat, when you eat, and how you fuel.",
  mind: "Attention, learning, and emotional life.",
  exercise: "Strength, movement, and cardiovascular health.",
  finance: "Saving, spending, and long-term security.",
}

export const PILLAR_ICON_MAP: Record<PillarId, LucideIcon> = {
  work: Brain,
  sleep: Heart,
  nutrition: Leaf,
  mind: Zap,
  exercise: Dumbbell,
  finance: Wallet,
}

/**
 * Tailwind class sets per pillar. Kept as literal strings (not interpolated)
 * so the Tailwind scanner can see them.
 */
export const PILLAR_STYLES: Record<
  PillarId,
  { text: string; border: string; background: string; gradient: string; cardBg: string; solid: string }
> = {
  work: {
    text: "text-work",
    border: "border-work/30",
    background: "bg-work/10",
    gradient: "from-work/20 to-work/5",
    cardBg: "bg-work/10 border-work/30",
    solid: "bg-work",
  },
  sleep: {
    text: "text-sleep",
    border: "border-sleep/30",
    background: "bg-sleep/10",
    gradient: "from-sleep/20 to-sleep/5",
    cardBg: "bg-sleep/10 border-sleep/30",
    solid: "bg-sleep",
  },
  nutrition: {
    text: "text-nutrition",
    border: "border-nutrition/30",
    background: "bg-nutrition/10",
    gradient: "from-nutrition/20 to-nutrition/5",
    cardBg: "bg-nutrition/10 border-nutrition/30",
    solid: "bg-nutrition",
  },
  mind: {
    text: "text-mind",
    border: "border-mind/30",
    background: "bg-mind/10",
    gradient: "from-mind/20 to-mind/5",
    cardBg: "bg-mind/10 border-mind/30",
    solid: "bg-mind",
  },
  exercise: {
    text: "text-exercise",
    border: "border-exercise/30",
    background: "bg-exercise/10",
    gradient: "from-exercise/20 to-exercise/5",
    cardBg: "bg-exercise/10 border-exercise/30",
    solid: "bg-exercise",
  },
  finance: {
    text: "text-finance",
    border: "border-finance/30",
    background: "bg-finance/10",
    gradient: "from-finance/20 to-finance/5",
    cardBg: "bg-finance/10 border-finance/30",
    solid: "bg-finance",
  },
}

/**
 * sRGB approximations of the pillar OKLCH values, for the places that need a raw
 * hex: `habit.color` / `project.color` (rendered via inline style) and recharts
 * series props, neither of which can consume a CSS variable.
 */
export const PILLAR_HEX: Record<PillarId, string> = {
  work: "#8b93f8",
  sleep: "#4fc7d9",
  nutrition: "#3fcf8e",
  mind: "#f472b6",
  exercise: "#f2a15a",
  finance: "#d4b23c",
}

/** Ordered swatch list for color pickers. */
export const PILLAR_SWATCHES = PILLAR_IDS.map((id) => ({
  id,
  label: PILLAR_LABELS[id],
  hex: PILLAR_HEX[id],
}))

/**
 * Maps the app's free-form `category` strings and the `HabitTag` union onto a
 * pillar.
 *
 * `personal`, `health` and `selfcare` are deliberately absent: in real data they
 * are catch-alls covering everything from push-ups to breakfast, so treating
 * them as a pillar paints half the list one colour. They fall through to name
 * inference below instead.
 */
const CATEGORY_TO_PILLAR: Record<string, PillarId> = {
  // Focus — deliberate output
  productivity: "work",
  work: "work",
  // Move
  exercise: "exercise",
  fitness: "exercise",
  workout: "exercise",
  // Fuel
  nutrition: "nutrition",
  eating: "nutrition",
  // Rest
  sleep: "sleep",
  recovery: "sleep",
  morning_routine: "sleep",
  // Mind — attention, learning, emotional life
  meditation: "mind",
  mindfulness: "mind",
  reading: "mind",
  learning: "mind",
  creative: "mind",
  social: "mind",
  mind: "mind",
  // Wealth
  finance: "finance",
  money: "finance",
}

/**
 * Keyword inference, checked against the habit name. This is what rescues the
 * `personal`-tagged and uncategorised habits — "4x10 Pistol Squats" and
 * "Yoga Night" are Move, "Dinner Before 18:00" is Fuel, and neither carries a
 * category that says so. Ordered most-specific first; the first hit wins.
 */
const NAME_HINTS: Array<[PillarId, RegExp]> = [
  [
    "exercise",
    /\b(run|running|jog|walk|yoga|push[ -]?up|pull[ -]?up|squat|handstand|jumping|gym|lift|weights|cardio|stretch|mobility|plank|burpee|swim|bike|cycl|training|workout|exercise|calisthenic)/i,
  ],
  [
    "nutrition",
    /\b(eat|eating|meal|breakfast|lunch|dinner|food|diet|fast|fasting|water|hydrat|protein|coffee|caffeine|sugar|alcohol|cook|supplement|vitamin)/i,
  ],
  [
    "sleep",
    /\b(sleep|bed|bedtime|wake|nap|rest|sauna|cold[ -]?shower|ice[ -]?bath|screens?[ -]?off|recovery|wind[ -]?down)/i,
  ],
  [
    "finance",
    /\b(money|budget|spend|spending|save|saving|invest|expense|finance|bank|bill)/i,
  ],
  [
    "mind",
    /\b(read|reading|study|studying|learn|learning|journal|meditat|mindful|gratitude|breath|therapy|piano|guitar|music|draw|paint|write|writing|language|social|friend|call|approach)/i,
  ],
  [
    "work",
    /\b(plan|planning|pomodoro|deep[ -]?work|focus|inbox|email|review|order|ordering|organiz|organis|backup|sync|admin|ship|code|coding|project)/i,
  ],
]

function inferFromName(name: string | undefined): PillarId | null {
  if (!name) return null
  for (const [pillar, pattern] of NAME_HINTS) {
    if (pattern.test(name)) return pillar
  }
  return null
}

export function pillarFor(value: string | HabitTag | undefined | null): PillarId {
  if (!value) return "work"
  return CATEGORY_TO_PILLAR[value.toLowerCase()] ?? "work"
}

/**
 * Pillar for a habit. An explicit, meaningful category or tag wins; otherwise
 * the name decides; `work` is the last resort.
 */
export function pillarForHabit(habit: Pick<Habit, "name" | "category" | "tags">): PillarId {
  const explicit = CATEGORY_TO_PILLAR[(habit.category ?? "").toLowerCase()]
  if (explicit) return explicit

  for (const tag of habit.tags ?? []) {
    const tagged = CATEGORY_TO_PILLAR[tag.toLowerCase()]
    if (tagged) return tagged
  }

  return inferFromName(habit.name) ?? "work"
}

export function pillarStyles(value: string | undefined | null) {
  return PILLAR_STYLES[pillarFor(value)]
}

/**
 * Deterministic palette pick, used when creating a habit or project without an
 * explicit color so new records land inside the Liberture palette instead of on
 * a random hex.
 */
export function nextPillarHex(seed: number): string {
  return PILLAR_HEX[PILLAR_IDS[Math.abs(seed) % PILLAR_IDS.length]]
}
