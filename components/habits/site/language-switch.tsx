"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Languages } from "lucide-react"

import { LOCALE_COOKIE, LOCALES, type Locale } from "@/lib/habits/i18n"
import { cn } from "@/lib/utils"

interface LanguageSwitchProps {
  locale: Locale
  label: string
  className?: string
}

/** EN/ES toggle. Stores the choice in a cookie and re-renders the server page. */
export function LanguageSwitch({ locale, label, className }: LanguageSwitchProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const choose = (next: Locale) => {
    if (next === locale) return
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    startTransition(() => router.refresh())
  }

  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center gap-0.5 rounded-lg border border-white/10 p-0.5", pending && "opacity-60", className)}
    >
      <Languages className="mx-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={l === locale}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-semibold uppercase transition-colors",
            l === locale ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
