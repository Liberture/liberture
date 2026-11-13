import type { Locale } from "@/lib/translations"
import { localizedPath } from "@/lib/i18n/paths"

const origin = "https://liberture.com"

export function languageAlternates(path: string, spanishEntitySlug?: string) {
  const en = origin + localizedPath(path, "en")
  return { en, es: origin + localizedPath(path, "es", spanishEntitySlug), "x-default": en }
}

export function translatedAlternates(path: string, locale: Locale, spanishEntitySlug?: string) {
  const languages = languageAlternates(path, spanishEntitySlug)
  return { canonical: languages[locale], languages }
}
