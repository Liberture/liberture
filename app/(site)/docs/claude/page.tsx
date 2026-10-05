import Link from "next/link"

import { CopyBlock } from "@/components/habits/docs/copy-block"
import { DocsCallout, DocsSection, DocsSteps, DocsTitle } from "@/components/habits/docs/docs-parts"
import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { getServerOrigin } from "@/lib/habits/request-origin"

export const metadata = { title: "Claude · Liberture docs" }

export default async function ClaudeDocsPage() {
  const [locale, origin] = await Promise.all([getRequestLocale(), getServerOrigin()])
  const dict = getDictionary(locale)
  const t = dict.docs.claude
  const copy = { copyLabel: dict.docs.copy, copiedLabel: dict.docs.copied }

  return (
    <>
      <DocsTitle title={t.title} lead={t.lead} />

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
    </>
  )
}
