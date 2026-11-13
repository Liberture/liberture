"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { FieldSelect, FieldOption } from "@/components/ui/select"
import { useTranslations } from "@/components/i18n/locale-provider"

import { LOCALE_COOKIE, LOCALES, type Locale } from "@/lib/habits/i18n"
import { parsePublicPath } from "@/lib/i18n/paths"
import { cn } from "@/lib/utils"

interface LanguageSwitchProps {
  locale: Locale
  label: string
  className?: string
}

/** Stores the selected locale in a cookie and refreshes the server page. */
export function LanguageSwitch({ locale, label, className }: LanguageSwitchProps) {
  const router = useRouter()
  const names = useTranslations().habits.app.settingsDialog.prefs.languageNames
  const [pending, startTransition] = useTransition()

  const choose = (next: Locale) => {
    if (next === locale) return
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    const url = new URL(window.location.href)
    if (parsePublicPath(url.pathname)) {
      const alternate = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${next}"]`)
      if (alternate) {
        url.pathname = new URL(alternate.href).pathname
        url.searchParams.delete("lang")
      } else {
        url.searchParams.set("lang", next)
      }
      // A document navigation refreshes the root language and client dictionary together.
      window.location.assign(url.pathname + url.search + url.hash)
    } else {
      startTransition(() => router.refresh())
    }
  }

  return (
    <FieldSelect
      value={locale}
      onValueChange={next => choose(next as Locale)}
      disabled={pending}
      aria-label={`${label} · ${names[locale]}`}
      displayValue={locale.toUpperCase()}
      className={cn("h-9 w-fit border-0 bg-transparent px-2 text-xs font-semibold shadow-none hover:text-primary [&>svg]:hidden", className)}
    >
      {LOCALES.filter(option => option !== locale).map(option => (
        <FieldOption key={option} value={option} lang={option}>{names[option]}</FieldOption>
      ))}
    </FieldSelect>
  )
}
