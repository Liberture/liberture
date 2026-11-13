"use client"

import { useLocale as useIntlLocale, useMessages } from "next-intl"
import { es as esDateLocale } from "date-fns/locale"
import type { Locale as DateLocale } from "date-fns"
import type { Catalog, Locale } from "@/lib/translations"

export function useLocale(): Locale {
  return useIntlLocale() as Locale
}

/** Structured catalog entries, including guide sections, share the active next-intl provider. */
export function useTranslations(): Catalog {
  return useMessages() as unknown as Catalog
}

/** date-fns locale for the current language (undefined = date-fns default, English). */
export function useDateLocale(): DateLocale | undefined {
  return useLocale() === "es" ? esDateLocale : undefined
}
