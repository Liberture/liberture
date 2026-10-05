import { PILLAR_LABELS, PILLAR_IDS, type PillarId } from "@/lib/habits/pillars"
import { findCatalogHabit, findProtocol, scheduleLabel, type CatalogHabit } from "@/lib/habits/protocols/catalog"
import { COST_TIER_LABEL, costSummary } from "@/lib/habits/protocols/cost"
import { formatSourceMeta } from "@/lib/habits/protocols/sources"
import type { CoachRecommendationEntry } from "@/lib/habits/types"

/**
 * Resolves a stored recommendation into a self-contained card.
 *
 * What gets persisted is just `{kind, slug, reason}` — the catalog is app code,
 * so storing a copy of it per user would go stale the moment the catalog is
 * edited. The UI resolves slugs itself because it already has the catalog
 * imported. An external caller does not, so the API resolves them here and
 * returns everything needed to render or act on a suggestion without a second
 * request.
 */

export interface RecommendationCard {
  kind: "protocol" | "habit" | "custom"
  slug: string | null
  /** Why the coach picked this, verbatim. */
  reason: string
  name: string
  /** One-line description. */
  summary: string
  pillar: PillarId
  pillarLabel: string
  difficulty: string | null
  cost: string | null
  costDetail: string | null
  /** True when the user already tracks this. */
  adopted: boolean
  /** For a protocol, the habits adopting it would add. For a habit, itself. */
  habits: {
    slug: string | null
    name: string
    time: string
    schedule: string
    why: string
  }[]
  /** Protocols only. */
  author: string | null
  duration: string | null
  steps: string[]
  evidence: { title: string; detail: string; url: string | null }[]
}

/**
 * Persisted pillars are plain strings (see the note on CoachRecommendationEntry).
 * The client validates against the real union before storing, so the fallback
 * should be unreachable — it exists so hand-edited or older data cannot produce
 * an undefined pillar label downstream.
 */
const asPillar = (value: string): PillarId =>
  (PILLAR_IDS as string[]).includes(value) ? (value as PillarId) : "mind"

function habitRow(habit: CatalogHabit) {
  return {
    slug: habit.slug || null,
    name: habit.name,
    time: habit.time,
    schedule: scheduleLabel(habit.schedule),
    why: habit.why,
  }
}

/**
 * Returns null when a slug no longer resolves. The catalog changes between
 * releases and a stored recommendation can outlive the entry it points at, so
 * callers should filter rather than assume a card comes back.
 */
export function resolveRecommendationCard(
  entry: CoachRecommendationEntry,
  adoptedHabits: Set<string>,
  adoptedProtocols: Set<string>
): RecommendationCard | null {
  if (entry.kind === "protocol") {
    const protocol = entry.slug ? findProtocol(entry.slug) : undefined
    if (!protocol) return null
    return {
      kind: "protocol",
      slug: protocol.slug,
      reason: entry.reason,
      name: protocol.name,
      summary: protocol.tagline,
      pillar: protocol.pillar,
      pillarLabel: PILLAR_LABELS[protocol.pillar],
      difficulty: protocol.difficulty,
      cost: COST_TIER_LABEL[protocol.costTier],
      costDetail: costSummary(protocol.cost, protocol.costTier),
      adopted: adoptedProtocols.has(protocol.slug),
      habits: protocol.habits.map(habitRow),
      author: protocol.author?.name ?? protocol.creator ?? null,
      duration: protocol.duration,
      steps: protocol.steps,
      evidence: protocol.evidence.map((source) => ({
        title: source.title,
        detail: formatSourceMeta(source),
        url: source.url ?? null,
      })),
    }
  }

  if (entry.kind === "habit") {
    const habit = entry.slug ? findCatalogHabit(entry.slug) : undefined
    if (!habit) return null
    return {
      kind: "habit",
      slug: habit.slug,
      reason: entry.reason,
      name: habit.name,
      summary: habit.why,
      pillar: habit.pillar,
      pillarLabel: PILLAR_LABELS[habit.pillar],
      difficulty: habit.difficulty,
      cost: COST_TIER_LABEL[habit.cost],
      costDetail: null,
      adopted: adoptedHabits.has(habit.slug),
      habits: [habitRow(habit)],
      author: null,
      duration: null,
      steps: [],
      evidence: [],
    }
  }

  const custom = entry.custom
  if (!custom) return null
  const pillar = asPillar(custom.pillar)
  return {
    kind: "custom",
    slug: null,
    reason: entry.reason,
    name: custom.name,
    summary: custom.why,
    pillar,
    pillarLabel: PILLAR_LABELS[pillar],
    difficulty: null,
    cost: null,
    costDetail: null,
    // Nothing in the catalog to have adopted — it was invented for this reply.
    adopted: false,
    habits: [
      {
        slug: null,
        name: custom.name,
        time: custom.time,
        schedule: scheduleLabel(
          custom.scheduleType === "specific_days"
            ? { type: "specific_days", days: custom.days ?? [] }
            : custom.scheduleType === "times_per_week"
              ? { type: "times_per_week", timesPerWeek: custom.timesPerWeek ?? 3 }
              : { type: "daily" }
        ),
        why: custom.why,
      },
    ],
    author: null,
    duration: null,
    steps: [],
    evidence: [],
  }
}
