import type { Metadata } from "next"
import type { ReactNode } from "react"

import { DocsNav } from "@/components/habits/docs/docs-nav"
import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"

export const metadata: Metadata = {
  title: "Docs · Liberture",
  description: "Connect ChatGPT or Claude to your habit tracker and talk to your habits, in chat or by voice.",
}

export default async function DocsLayout({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale()
  const dict = getDictionary(locale)
  const nav = [
    { href: "/docs", label: dict.docs.sidebar.overview },
    { href: "/docs/chatgpt", label: dict.docs.sidebar.chatgpt },
    { href: "/docs/claude", label: dict.docs.sidebar.claude },
    { href: "/docs/permissions", label: dict.docs.sidebar.permissions },
    { href: "/docs/api", label: dict.docs.sidebar.api },
  ]

  return (
    <div className="topo-pattern lb-see-through">
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12 lg:py-14">
        <aside className="mb-8 lg:mb-0">
          <div className="lg:sticky lg:top-8">
            <p className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block">
              {dict.docs.title}
            </p>
            <DocsNav items={nav} />
          </div>
        </aside>
        <main className="min-w-0 max-w-3xl">{children}</main>
      </div>
    </div>
  )
}
