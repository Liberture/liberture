import type { ReactNode } from "react"

import type { Dictionary, Locale } from "@/lib/habits/i18n"

/** Shell for /privacy, /terms and /support: site chrome around plain prose. English only. */
interface LegalPageProps {
  locale: Locale
  dict: Dictionary
  title: string
  updated?: string
  children: ReactNode
}

export function LegalPage({ locale, dict, title, updated, children }: LegalPageProps) {
  return (
    <div className="topo-pattern lb-see-through">
      <main lang="en" className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {updated ? <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p> : null}
        <div className="mt-8 space-y-6 leading-relaxed text-muted-foreground [&_a]:text-primary [&_a:hover]:underline [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground [&_ul]:space-y-2">
          {children}
        </div>
      </main>
    </div>
  )
}

export function Contact({ email }: { email: string | null }) {
  return email ? <a href={`mailto:${email}`}>{email}</a> : <a href="/support">our support page</a>
}
