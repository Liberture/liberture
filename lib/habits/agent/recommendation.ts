import { catalogHabitToHabit } from "@/lib/habits/protocols/adopt"
import type { CatalogHabit, Difficulty } from "@/lib/habits/protocols/catalog"
import { PILLAR_IDS, type PillarId } from "@/lib/habits/pillars"
import type { CoachRecommendationEntry, Habit } from "@/lib/habits/types"

/**
 * The coach's reply, shared by the route and the UI.
 *
 * The agent is run with `--output-schema` (see `agent/prompt/output-schema.json`),
 * so its final message is JSON in this shape rather than prose we have to mine.
 * Everything here is still defensive: a model can be steered off a schema by a
 * failed turn or a truncated stream, and a chat that renders nothing is worse
 * than one that renders the raw text.
 */

export interface CustomHabitSpec {
  name: string
  why: string
  time: string
  pillar: PillarId
  scheduleType: "daily" | "specific_days" | "times_per_week"
  days: number[] | null
  timesPerWeek: number | null
}

export interface Recommendation {
  kind: "protocol" | "habit" | "custom"
  slug: string | null
  reason: string
  custom: CustomHabitSpec | null
}

export interface AgentReply {
  answer: string
  recommendations: Recommendation[]
}

const isPillar = (value: unknown): value is PillarId =>
  typeof value === "string" && (PILLAR_IDS as string[]).includes(value)

function toRecommendation(raw: unknown): Recommendation | null {
  if (!raw || typeof raw !== "object") return null
  const record = raw as Record<string, unknown>
  const kind = record.kind
  if (kind !== "protocol" && kind !== "habit" && kind !== "custom") return null

  const reason = typeof record.reason === "string" ? record.reason : ""
  const slug = typeof record.slug === "string" && record.slug.trim() ? record.slug.trim() : null

  if (kind !== "custom") {
    // A catalog reference with no slug cannot be resolved into a card.
    return slug ? { kind, slug, reason, custom: null } : null
  }

  const spec = record.custom
  if (!spec || typeof spec !== "object") return null
  const c = spec as Record<string, unknown>
  if (typeof c.name !== "string" || !c.name.trim()) return null
  if (!isPillar(c.pillar)) return null

  const scheduleType =
    c.scheduleType === "specific_days" || c.scheduleType === "times_per_week" ? c.scheduleType : "daily"

  return {
    kind,
    slug: null,
    reason,
    custom: {
      name: c.name.trim(),
      why: typeof c.why === "string" ? c.why : "",
      // The agent is asked for HH:MM, but a habit with a malformed time renders
      // badly everywhere downstream, so fall back rather than trust it.
      time: typeof c.time === "string" && /^\d{2}:\d{2}$/.test(c.time) ? c.time : "08:00",
      pillar: c.pillar,
      scheduleType,
      days: Array.isArray(c.days) ? c.days.filter((d): d is number => typeof d === "number" && d >= 0 && d <= 6) : null,
      timesPerWeek: typeof c.timesPerWeek === "number" ? c.timesPerWeek : null,
    },
  }
}

/**
 * Parse one `agent_message`. Falls back through progressively looser readings so
 * a schema slip degrades to "show the text" rather than "show nothing".
 */
export function parseAgentReply(text: string): AgentReply {
  const attempt = (candidate: string): AgentReply | null => {
    let parsed: unknown
    try {
      parsed = JSON.parse(candidate)
    } catch {
      return null
    }
    if (!parsed || typeof parsed !== "object") return null
    const record = parsed as Record<string, unknown>
    if (typeof record.answer !== "string") return null
    const list = Array.isArray(record.recommendations) ? record.recommendations : []
    return {
      answer: record.answer,
      recommendations: list.map(toRecommendation).filter((r): r is Recommendation => r !== null),
    }
  }

  const direct = attempt(text.trim())
  if (direct) return direct

  // A fenced block, in case the model wrapped the object in markdown.
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text)
  if (fenced) {
    const inner = attempt(fenced[1].trim())
    if (inner) return inner
  }

  return { answer: text, recommendations: [] }
}

/**
 * The persisted form, for GET /api/v1/coach/recommendations.
 *
 * Drops the nulls the output schema needs (strict mode requires every property
 * to be present, so absent values arrive as explicit nulls) in favour of absent
 * keys, which is what a JSON API should return and what keeps the stored blob
 * small.
 */
export function toStoredEntries(recommendations: Recommendation[]): CoachRecommendationEntry[] {
  return recommendations.map((rec) => ({
    kind: rec.kind,
    ...(rec.slug ? { slug: rec.slug } : {}),
    reason: rec.reason,
    ...(rec.custom
      ? {
          custom: {
            name: rec.custom.name,
            why: rec.custom.why,
            time: rec.custom.time,
            pillar: rec.custom.pillar,
            scheduleType: rec.custom.scheduleType,
            ...(rec.custom.days?.length ? { days: rec.custom.days } : {}),
            ...(rec.custom.timesPerWeek ? { timesPerWeek: rec.custom.timesPerWeek } : {}),
          },
        }
      : {}),
  }))
}

const DIFFICULTY_FOR_CUSTOM: Difficulty = "moderate"

/**
 * Turn a suggested habit into a real one.
 *
 * Routed through `catalogHabitToHabit` rather than building a `Habit` by hand,
 * so a coach-created habit gets exactly the same colour, priority, tags,
 * milestone ladder and implementation intention as one added from the
 * marketplace. `catalogSlug` is then dropped: nothing in the catalog matches it,
 * and leaving a fake slug would make the marketplace show the entry as adopted.
 */
export function customRecommendationToHabit(spec: CustomHabitSpec): Habit {
  const entry: CatalogHabit = {
    slug: "",
    name: spec.name,
    why: spec.why,
    pillar: spec.pillar,
    time: spec.time,
    schedule:
      spec.scheduleType === "specific_days"
        ? { type: "specific_days", days: spec.days?.length ? spec.days : [1, 2, 3, 4, 5] }
        : spec.scheduleType === "times_per_week"
          ? { type: "times_per_week", timesPerWeek: spec.timesPerWeek ?? 3 }
          : { type: "daily" },
    difficulty: DIFFICULTY_FOR_CUSTOM,
    cost: "free",
  }

  const habit = catalogHabitToHabit(entry)
  delete habit.catalogSlug
  return habit
}
