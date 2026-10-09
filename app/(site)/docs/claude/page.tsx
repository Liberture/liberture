import Link from "next/link"

import { CopyBlock } from "@/components/habits/docs/copy-block"
import { DocsCallout, DocsSection, DocsSteps, DocsTitle } from "@/components/habits/docs/docs-parts"
import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { getServerOrigin } from "@/lib/habits/request-origin"
import { DocsScreenshot } from "@/components/habits/docs/docs-screenshot"

export const metadata = { title: "Claude · Liberture docs" }

export default async function ClaudeDocsPage() {
  const [locale, origin] = await Promise.all([getRequestLocale(), getServerOrigin()])
  const dict = getDictionary(locale)
  const t = dict.docs.claude
  const copy = { copyLabel: dict.docs.copy, copiedLabel: dict.docs.copied }

  return (
    <>
      <DocsTitle title={t.title} lead={t.lead} />
      <DocsScreenshot locale={locale} imageKey="connect-assistant" alt={dict.guides.articles.find((a) => a.slug === "connect-claude-to-your-habit-tracker")?.heroAlt ?? ""} />

      <DocsSection title={dict.docs.overview.stepsTitle}>
        <DocsSteps
          steps={t.steps}
          extras={{
            0: <CopyBlock label={t.urlLabel} value={`${origin}/mcp`} inline {...copy} />,
            3: (
              <>
                <Link
                  href="/tracker"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  {t.openSettings}
                </Link>
                <CopyBlock label={t.instructionsLabel} value={dict.docs.prompts.claude} {...copy} />
              </>
            ),
          }}
        />
      </DocsSection>

      <DocsCallout title={t.voiceTitle}>{t.voice}</DocsCallout>

      <DocsSection title={t.troubleTitle}>
        <dl className="space-y-4">
          {t.trouble.map((item) => (
            <div key={item.q}>
              <dt className="font-mono text-sm font-semibold text-foreground">{item.q}</dt>
              <dd className="mt-1 text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </DocsSection>
    </>
  )
}
