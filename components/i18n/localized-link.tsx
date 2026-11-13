"use client"

import Link from "next/link"
import { createContext, useContext, type ComponentProps, type ReactNode } from "react"
import { useLocale } from "@/components/i18n/locale-provider"
import { localizedHref } from "@/lib/i18n/paths"

const Slugs = createContext<ReadonlyMap<string, string>>(new Map())

export function LocalizedLinksProvider({ slugs, children }: { slugs: ReadonlyMap<string, string>; children: ReactNode }) {
  return <Slugs.Provider value={slugs}>{children}</Slugs.Provider>
}

export function useLocalizedHref() {
  const locale = useLocale()
  const slugs = useContext(Slugs)
  return (href: string) => localizedHref(href, locale, slugs)
}

export default function LocalizedLink({ href, ...props }: ComponentProps<typeof Link>) {
  const localize = useLocalizedHref()
  return <Link href={typeof href === "string" ? localize(href) : href} {...props} />
}
