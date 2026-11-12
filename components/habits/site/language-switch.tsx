"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { ChevronDown } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { useTranslations } from "@/components/i18n/locale-provider"

import { LOCALE_COOKIE, LOCALES, type Locale } from "@/lib/habits/i18n"
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
    startTransition(() => router.refresh())
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          disabled={pending}
          aria-label={`${label} · ${names[locale]}`}
          className={cn("inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60", className)}
        >
          {locale}
          <ChevronDown className="size-3" aria-hidden />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={4} aria-label={label} className="z-[70] min-w-28 rounded-lg border border-border bg-card p-1 shadow-lg">
          {LOCALES.filter(option => option !== locale).map(option => (
            <DropdownMenu.Item
              key={option}
              lang={option}
              onSelect={() => choose(option)}
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-foreground outline-none data-[highlighted]:bg-secondary"
            >
              {names[option]}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
