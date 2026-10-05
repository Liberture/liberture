/**
 * Where a protocol's claims come from.
 *
 * The library originally carried citations as free-form strings rendered as
 * plain text, which meant a randomised trial and a podcast episode looked
 * identical and neither was clickable. Structuring them lets the reader link
 * out, and — more usefully — lets a protocol admit when its evidence is a
 * twelve-person study or one practitioner's experience.
 *
 * The `SourceRef` union keeps the old strings legal, so citations can be
 * upgraded incrementally instead of in one flag day.
 */

export type SourceType = "study" | "review" | "book" | "podcast" | "guideline" | "article"

/**
 * How much weight a citation carries on its own. Stated per-source rather than
 * per-protocol, because a protocol commonly rests on one strong meta-analysis
 * and two pieces of supporting anecdote.
 */
export type EvidenceStrength = "strong" | "moderate" | "emerging" | "anecdotal"

export interface Source {
  title: string
  /** "Walker, M." or "Grgic, J. et al." */
  authors?: string
  year?: number
  /** Journal for studies, publisher for books, show name for podcasts. */
  publisher?: string
  url?: string
  type: SourceType
  strength?: EvidenceStrength
}

/** Legacy free-form entries stay valid so nothing has to be rewritten at once. */
export type SourceRef = string | Source

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  study: "Study",
  review: "Review",
  book: "Book",
  podcast: "Podcast",
  guideline: "Guideline",
  article: "Article",
}

export const STRENGTH_LABEL: Record<EvidenceStrength, string> = {
  strong: "Strong evidence",
  moderate: "Moderate evidence",
  emerging: "Emerging",
  anecdotal: "Practitioner experience",
}

export function isSource(ref: SourceRef): ref is Source {
  return typeof ref === "object" && ref !== null && "title" in ref
}

/** A legacy string becomes a title-only source of unstated type. */
export function normalizeSource(ref: SourceRef): Source {
  return isSource(ref) ? ref : { title: ref, type: "article" }
}

export function normalizeSources(refs: SourceRef[]): Source[] {
  return refs.map(normalizeSource)
}

/** "Walker, M. · 2017 · Scribner" — the metadata line under a source title. */
export function formatSourceMeta(source: Source): string {
  return [source.authors, source.year, source.publisher].filter(Boolean).join(" · ")
}
