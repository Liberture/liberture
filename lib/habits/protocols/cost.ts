/**
 * What a protocol actually costs.
 *
 * Biohacking splits hard along price, and the split is rarely correlated with
 * effect size — the same literature that supports a $3,000 sauna also supports
 * a free hot bath, and the loudest self-experimenter in the field reports his
 * biggest sleep win came from $8 bulbs. A marketplace that hides cost quietly
 * biases users toward whatever is most expensive, so cost is a first-class,
 * filterable dimension here rather than a footnote in the equipment list.
 *
 * Static app data. Amounts are deliberately rough — this is a filter, not a
 * quote, and pretending to two-decimal precision would be dishonest.
 */

export type CostTier = "free" | "low" | "moderate" | "high"

export type CostRecurrence = "one-time" | "monthly" | "yearly"

export interface CostItem {
  label: string
  /** Rough amount in `ProtocolCost.currency`. Omitted when genuinely unknowable. */
  amount?: number
  recurrence: CostRecurrence
  /** True when the protocol still works without buying this. */
  optional?: boolean
}

export interface ProtocolCost {
  /** Explicit tier always wins over the inferred one. */
  tier: CostTier
  currency?: "USD" | "EUR" | "GBP"
  /** Rough up-front spend. */
  oneTime?: number
  /** Rough recurring spend, normalised to a month. */
  monthly?: number
  items?: CostItem[]
  /** The honest caveat: "Free if you just dim the lights you already own." */
  note?: string
}

/** Cheapest first. Used for both sorting and "at most this tier" filtering. */
export const COST_TIER_ORDER: CostTier[] = ["free", "low", "moderate", "high"]

export const COST_TIER_LABEL: Record<CostTier, string> = {
  free: "Free",
  low: "$",
  moderate: "$$",
  high: "$$$",
}

/** Longer form, for filter chips and the reader's cost section. */
export const COST_TIER_BLURB: Record<CostTier, string> = {
  free: "Costs nothing",
  low: "Under $50",
  moderate: "$50–500",
  high: "$500+",
}

const CURRENCY_SYMBOL: Record<NonNullable<ProtocolCost["currency"]>, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
}

/**
 * Tier from raw amounts. Either axis can push a protocol up a tier — $40/month
 * of supplements is not a "low cost" habit even though nothing is bought up front.
 */
export function inferTier(oneTime: number, monthly: number): CostTier {
  if (oneTime === 0 && monthly === 0) return "free"
  if (oneTime < 50 && monthly < 10) return "low"
  if (oneTime < 500 && monthly < 50) return "moderate"
  return "high"
}

/** Tier a protocol falls into, honouring an explicit declaration when present. */
export function resolveTier(cost: ProtocolCost | undefined, equipment: string[]): CostTier {
  if (cost) return cost.tier
  // No declared cost and nothing to buy is genuinely free; anything requiring
  // kit we can't price is assumed cheap rather than silently marked free.
  return equipment.length === 0 ? "free" : "low"
}

/** "Free" · "~$30 one-off" · "~$30 + ~$12/mo" */
export function costSummary(cost: ProtocolCost | undefined, tier: CostTier): string {
  if (!cost) return tier === "free" ? "Free" : COST_TIER_BLURB[tier]

  const symbol = CURRENCY_SYMBOL[cost.currency ?? "USD"]
  const parts: string[] = []
  if (cost.oneTime) parts.push(`~${symbol}${cost.oneTime} one-off`)
  if (cost.monthly) parts.push(`~${symbol}${cost.monthly}/mo`)

  if (parts.length === 0) return "Free"
  return parts.join(" + ")
}

/** A protocol matches a "show me at most $$" filter when its tier is at or below it. */
export function costWithinTier(tier: CostTier, max: CostTier): boolean {
  return COST_TIER_ORDER.indexOf(tier) <= COST_TIER_ORDER.indexOf(max)
}

/** Shorthand for the many protocols that cost nothing at all. */
export const FREE: ProtocolCost = { tier: "free", currency: "USD", oneTime: 0, monthly: 0 }
