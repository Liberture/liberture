"use client"

import { createContext, useContext, type ReactNode } from "react"
import { es as esDateLocale } from "date-fns/locale"
import type { Locale as DateLocale } from "date-fns"

import { translations, type Locale } from "@/lib/translations"

const LocaleContext = createContext<Locale>("en")

/** Carries the visitor's locale (resolved on the server from the `lang` cookie) to client components. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useLocale(): Locale {
  return useContext(LocaleContext)
}

/** The full translations entry for the current locale. */
export function useTranslations() {
  return translations[useLocale()]
}

/** date-fns locale for the current language (undefined = date-fns default, English). */
export function useDateLocale(): DateLocale | undefined {
  return useLocale() === "es" ? esDateLocale : undefined
}
