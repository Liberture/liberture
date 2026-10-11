/**
 * Per-protocol pictures, drawn by scripts/generate-protocol-images.tsx into
 * public/protocols/images/<slug>.{svg,png,webp}. PNG is the share image and
 * what the sitemap lists; WebP is what pages show. Only catalog protocols
 * have one — anything else falls back to the site image.
 */
import { CATALOG_PROTOCOLS } from "@/lib/habits/protocols/catalog"
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
