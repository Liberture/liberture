import { translations, type HabitsDictionary, type Locale } from "@/lib/translations"

export type { Locale }
/** The habit tracker's slice of `lib/translations.ts`. */
export type Dictionary = HabitsDictionary

export const LOCALES: readonly Locale[] = ["en", "es"]
export const DEFAULT_LOCALE: Locale = "en"
/** Cookie the language switch sets; read on the server and the client. */
export const LOCALE_COOKIE = "lang"

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "es"
}

export function getDictionary(locale: Locale): Dictionary {
  return translations[locale].habits
}

/** Explicit choice (cookie) wins; otherwise the browser's first supported language. */
export function resolveLocale(cookieValue: string | undefined | null, acceptLanguage: string | undefined | null): Locale {
  if (isLocale(cookieValue)) return cookieValue
  for (const part of (acceptLanguage ?? "").split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase().slice(0, 2)
    if (isLocale(tag)) return tag
  }
  return DEFAULT_LOCALE
}
