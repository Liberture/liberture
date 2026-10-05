import { ExternalLink } from "lucide-react"

import { CopyBlock } from "@/components/habits/docs/copy-block"
import { DocsCallout, DocsSection, DocsSteps, DocsTitle } from "@/components/habits/docs/docs-parts"
import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { getSiteSetting } from "@/lib/habits/oauth/store"
import { getServerOrigin } from "@/lib/habits/request-origin"

export const metadata = { title: "ChatGPT · Liberture docs" }

export default async function ChatGptDocsPage() {
  const [locale, origin, gptUrl] = await Promise.all([
    getRequestLocale(),
    getServerOrigin(),
    getSiteSetting("chatgpt_gpt_url").catch(() => null),
  ])
  const dict = getDictionary(locale)
  const t = dict.docs.chatgpt
  const copy = { copyLabel: dict.docs.copy, copiedLabel: dict.docs.copied }
  const urlBlock = <CopyBlock label={t.urlLabel} value={`${origin}/mcp`} inline {...copy} />

  return (
    <>
      <DocsTitle title={t.title} lead={t.lead} />

      {gptUrl ? (
        <DocsSection title={dict.docs.overview.stepsTitle}>
          <DocsSteps
            steps={t.gptSteps}
            extras={{
              0: (
                <a
                  href={gptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  {t.gptButton}
                </a>
              ),
            }}
          />
        </DocsSection>
      ) : null}

      <DocsSection title={gptUrl ? t.connectorTitle : dict.docs.overview.stepsTitle}>
        <DocsSteps steps={t.connectorSteps} extras={{ 1: urlBlock }} />
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
