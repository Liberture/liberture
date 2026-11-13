import type { Locale } from "@/lib/translations"

const staticPaths = new Set(["/", "/protocols", "/how-it-works", "/get-started", "/guides", "/docs", "/docs/chatgpt", "/docs/claude", "/docs/permissions", "/docs/api", "/docs/updates"])

// These pages translate their main content. A translated navigation bar alone doesn't qualify.
export function hasTranslatedContent(path: string) {
  return staticPaths.has(path) || /^\/guides\/[a-z0-9-]+$/.test(path)
}

export function languageAlternates(path: string) {
  const url = new URL(path, "https://liberture.com").href
  return { en: url + "?lang=en", es: url + "?lang=es", "x-default": url }
}

export function translatedAlternates(path: string, locale: Locale) {
  const languages = languageAlternates(path)
  return { canonical: languages[locale], languages }
}
