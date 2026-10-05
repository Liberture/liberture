import { translations, type Locale } from "@/lib/translations"

/**
 * The /guides articles. Copy lives in lib/translations.ts (habits.guides);
 * this file adds what isn't copy: screenshot files and their sizes, the
 * canonical URLs and the publication date.
 */

export const SITE_URL = "https://liberture.com"
export const GUIDES_UPDATED = "2026-10-05"

/** Screenshots of a populated demo account, in /public/screenshots/<locale>/. */
export const SCREENSHOTS = {
  "tracker-today": { width: 1600, height: 1000 },
  "tracker-week": { width: 1600, height: 1000 },
  statistics: { width: 1600, height: 1000 },
  calendar: { width: 1600, height: 1000 },
  todos: { width: 1600, height: 1000 },
  "protocol-catalog": { width: 1600, height: 1000 },
  "connect-assistant": { width: 1600, height: 1000 },
  "assistant-permissions": { width: 1600, height: 1000 },
  landing: { width: 1600, height: 1000 },
  "mobile-today": { width: 780, height: 1688 },
  "mobile-statistics": { width: 780, height: 1688 },
  "mobile-todos": { width: 780, height: 1688 },
} as const

export type ScreenshotKey = keyof typeof SCREENSHOTS

export function screenshotSrc(locale: Locale, key: string): string {
  return `/screenshots/${locale}/${key}.webp`
}

export function screenshotSize(key: string): { width: number; height: number } {
  return SCREENSHOTS[key as ScreenshotKey] ?? { width: 1600, height: 1000 }
}

export function isMobileShot(key: string): boolean {
  return key.startsWith("mobile-")
}

export function guidesFor(locale: Locale) {
  return translations[locale].habits.guides
}

export type Guide = ReturnType<typeof guidesFor>["articles"][number]

export const GUIDE_SLUGS: string[] = translations.en.habits.guides.articles.map((a) => a.slug)

export function findGuide(locale: Locale, slug: string): Guide | undefined {
  return guidesFor(locale).articles.find((a) => a.slug === slug)
}

/** Share image per guide (public/og/guides/<slug>.jpg), 1200×630. */
export function guideOgImage(slug: string): string {
  return `/og/guides/${slug}.jpg`
}

/** Every screenshot a guide shows, for the image sitemap. */
export function guideImages(guide: Guide, locale: Locale = "en"): string[] {
  const keys = new Set<string>([guide.hero])
  for (const section of guide.sections) if ("image" in section && section.image) keys.add(section.image.key)
  return [...keys].map((key) => `${SITE_URL}${screenshotSrc(locale, key)}`)
}

/** Stable id for a section heading (table of contents anchors). */
export function sectionId(heading: string): string {
  return heading
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}
