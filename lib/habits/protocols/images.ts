/**
 * Catalog pictures, drawn by scripts/generate-protocol-images.tsx into
 * public/protocols/images/<slug>.{svg,png,webp} for protocols and
 * public/protocols/images/habits/<slug>.* for standalone catalog habits.
 * PNG is the share image, what the sitemap lists and the MCP imageUrl; WebP
 * is what pages show. A habit inside a protocol uses its protocol's picture.
 */
import { CATALOG_PROTOCOLS, STANDALONE_HABITS } from "@/lib/habits/protocols/catalog"
import { PILLAR_LABELS } from "@/lib/habits/pillars"

export const PROTOCOL_IMAGE_SIZE = { width: 1200, height: 630 } as const

const BY_SLUG = new Map(CATALOG_PROTOCOLS.map((p) => [p.slug, p]))

export interface ProtocolImage {
  /** Site-relative paths. */
  png: string
  webp: string
  svg: string
  width: number
  height: number
  /** Describes the picture, for alt text and the image sitemap. */
  alt: string
}

export function protocolImage(slug: string): ProtocolImage | null {
  const protocol = BY_SLUG.get(slug)
  if (!protocol) return null
  const base = `/protocols/images/${slug}`
  return {
    png: `${base}.png`,
    webp: `${base}.webp`,
    svg: `${base}.svg`,
    ...PROTOCOL_IMAGE_SIZE,
    alt: `${protocol.name}: ${PILLAR_LABELS[protocol.pillar].toLowerCase()} protocol. ${protocol.tagline}`,
  }
}

export function absoluteUrl(baseUrl: string, sitePath: string): string {
  return `${baseUrl.replace(/\/$/, "")}${sitePath}`
}

const STANDALONE_BY_SLUG = new Map(STANDALONE_HABITS.map((h) => [h.slug, h]))

/** The picture of a standalone catalog habit (one that belongs to no protocol). */
export function standaloneHabitImage(slug: string): ProtocolImage | null {
  const habit = STANDALONE_BY_SLUG.get(slug)
  if (!habit) return null
  const base = `/protocols/images/habits/${slug}`
  return {
    png: `${base}.png`,
    webp: `${base}.webp`,
    svg: `${base}.svg`,
    ...PROTOCOL_IMAGE_SIZE,
    alt: `${habit.name}: ${PILLAR_LABELS[habit.pillar].toLowerCase()} habit. ${habit.why}`,
  }
}
