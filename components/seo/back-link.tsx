"use client"

import Link from "@/components/i18n/localized-link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useTranslations } from "@/components/i18n/locale-provider"

type BrowserNavigation = { currentEntry: {index:number}; entries(): {index:number;url:string|null}[] }

export function BackLink({fallback}: {fallback:string}) {
  const router = useRouter()
  const label = useTranslations().habits.app.protocolReader.back
  return <Link href={fallback} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
    onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const nav = (window as Window & {navigation?:BrowserNavigation}).navigation
      const previous = nav ? nav.entries().find(entry => entry.index === nav.currentEntry.index - 1)?.url : document.referrer
      if (previous && new URL(previous).origin === location.origin) {
        event.preventDefault()
        router.back()
      }
    }}><ArrowLeft aria-hidden className="size-4" />{label}</Link>
}
