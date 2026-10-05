import Link from "next/link"
import { ArrowRight, MessageSquareQuote } from "lucide-react"

import { ChatGPTLogo, ClaudeLogo } from "@/components/habits/brand-logos"

import { DocsList, DocsSection, DocsSteps, DocsTitle } from "@/components/habits/docs/docs-parts"
import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"

export default async function DocsOverviewPage() {
  const dict = getDictionary(await getRequestLocale())
  const t = dict.docs.overview

  return (
    <>
      <DocsTitle title={t.title} lead={t.lead} />

      <DocsSection title={t.whatTitle}>
        <DocsList items={t.what} />
      </DocsSection>

      <DocsSection title={t.stepsTitle}>
        <DocsSteps steps={t.steps} />
      </DocsSection>

      <DocsSection title={t.pickTitle}>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { href: "/docs/chatgpt", title: dict.landing.chatgptTitle, body: dict.landing.chatgptBody, Logo: ChatGPTLogo },
            { href: "/docs/claude", title: dict.landing.claudeTitle, body: dict.landing.claudeBody, Logo: ClaudeLogo },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                  <card.Logo className="h-5 w-5 text-foreground" />
                </span>
                <p className="font-semibold text-foreground">{card.title}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                {dict.landing.readGuide}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </DocsSection>

      <DocsSection title={t.phrasesTitle}>
        <div className="flex flex-wrap gap-2">
          {t.phrases.map((phrase) => (
            <span
              key={phrase}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-foreground"
            >
              <MessageSquareQuote className="h-3.5 w-3.5 text-primary" aria-hidden />
              {phrase}
            </span>
          ))}
        </div>
      </DocsSection>

      <DocsSection title={t.privacyTitle}>
        <p className="leading-relaxed text-muted-foreground">{t.privacy}</p>
      </DocsSection>
    </>
  )
}
