import type { PillarId } from "@/lib/habits/pillars"

import type { CatalogHabit, CatalogProtocol, Difficulty } from "./catalog"
import { DIFFICULTY_ORDER } from "./catalog"
import { COST_TIER_ORDER, type CostTier, costWithinTier } from "./cost"

/**
 * Marketplace filtering, kept out of the view so the component stays a view.
 *
 * With ~50 protocols this all runs in well under a millisecond, so there is no
 * debouncing and no index beyond the lowercased `searchText` the catalog already
 * precomputes.
 */

export type SortMode = "featured" | "name" | "cost" | "difficulty"

export const SORT_LABEL: Record<SortMode, string> = {
  featured: "Featured first",
  name: "A–Z",
  cost: "Cheapest first",
  difficulty: "Easiest first",
}

export interface CatalogFilter {
  pillar: PillarId | "all"
  /** "At most this tier" — selecting $$ also shows free and $. */
  maxCost: CostTier | "any"
  difficulty: Difficulty | "all"
  authorId: string | "all"
  query: string
  sort: SortMode
}

export const DEFAULT_FILTER: CatalogFilter = {
  pillar: "all",
  maxCost: "any",
  difficulty: "all",
  authorId: "all",
  query: "",
  sort: "featured",
}

/** How many filters are narrowing the list, for the "clear" affordance. */
export function activeFilterCount(filter: CatalogFilter): number {
  let count = 0
  if (filter.pillar !== "all") count++
  if (filter.maxCost !== "any") count++
  if (filter.difficulty !== "all") count++
  if (filter.authorId !== "all") count++
  if (filter.query.trim() !== "") count++
  return count
}

function compare(a: CatalogProtocol, b: CatalogProtocol, sort: SortMode): number {
  switch (sort) {
    case "name":
      return a.name.localeCompare(b.name)
    case "cost": {
      const delta = COST_TIER_ORDER.indexOf(a.costTier) - COST_TIER_ORDER.indexOf(b.costTier)
      return delta !== 0 ? delta : a.name.localeCompare(b.name)
    }
    case "difficulty": {
      const delta = DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty)
      return delta !== 0 ? delta : a.name.localeCompare(b.name)
    }
    case "featured":
    default:
      // `featured` used to only draw a badge and left ordering to declaration
      // order, which meant the flag claimed prominence it never delivered.
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      return a.name.localeCompare(b.name)
  }
}

export function filterProtocols(all: CatalogProtocol[], filter: CatalogFilter): CatalogProtocol[] {
  const query = filter.query.trim().toLowerCase()

  return all
    .filter((p) => {
      if (filter.pillar !== "all" && p.pillar !== filter.pillar) return false
      if (filter.maxCost !== "any" && !costWithinTier(p.costTier, filter.maxCost)) return false
      if (filter.difficulty !== "all" && p.difficulty !== filter.difficulty) return false
      if (filter.authorId !== "all" && p.author?.id !== filter.authorId) return false
      if (query && !p.searchText.includes(query)) return false
      return true
    })
    .sort((a, b) => compare(a, b, filter.sort))
}

/**
 * Standalone habits carry no author, so an author filter hides the section
 * entirely rather than showing an unrelated list beneath the filtered protocols.
 */
export function filterCatalogHabits(all: CatalogHabit[], filter: CatalogFilter): CatalogHabit[] {
  if (filter.authorId !== "all") return []
  const query = filter.query.trim().toLowerCase()

  return all.filter((h) => {
    if (filter.pillar !== "all" && h.pillar !== filter.pillar) return false
    if (filter.maxCost !== "any" && !costWithinTier(h.cost, filter.maxCost)) return false
    if (filter.difficulty !== "all" && h.difficulty !== filter.difficulty) return false
    if (query && !`${h.name} ${h.why}`.toLowerCase().includes(query)) return false
    return true
  })
}
