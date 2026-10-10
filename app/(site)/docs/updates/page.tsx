import { CopyBlock } from "@/components/habits/docs/copy-block"
import { DocsCallout, DocsSection, DocsSteps, DocsTitle } from "@/components/habits/docs/docs-parts"
import { TOOL_COUNT, TOOLS_VERSION } from "@/lib/habits/api/operations"
import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { getServerOrigin } from "@/lib/habits/request-origin"
import { formatMessage } from "@/lib/i18n-format"

export const metadata = { title: "Get new tools · Liberture docs" }

/** How to refresh ChatGPT and Claude after new tools ship. Linked from Settings and from get_today. */
export default async function UpdatesDocsPage() {
  const [locale, origin] = await Promise.all([getRequestLocale(), getServerOrigin()])
  const dict = getDictionary(locale)
  const t = dict.docs.updates
  const copy = { copyLabel: dict.docs.copy, copiedLabel: dict.docs.copied }

  return (
    <>
      <DocsTitle title={t.title} lead={t.lead} />

      <DocsCallout title={t.currentTitle}>
        <span className="font-mono">{formatMessage(t.current, { count: TOOL_COUNT, version: TOOLS_VERSION })}</span>
      </DocsCallout>

      <DocsSection id="how-you-know" title={t.knowTitle}>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          {t.know.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </DocsSection>

      <DocsSection id="chatgpt" title={t.chatgptTitle}>
        <DocsSteps steps={t.chatgptSteps} extras={{ 1: <CopyBlock label={t.urlLabel} value={`${origin}/mcp`} inline {...copy} /> }} />
        <h3 className="mt-6 text-base font-semibold text-foreground">{t.gptTitle}</h3>
        <p className="mt-2 text-muted-foreground">{t.gpt}</p>
        <CopyBlock label={t.schemaLabel} value={`${origin}/api/v1/openapi.json`} inline {...copy} />
      </DocsSection>

      <DocsSection id="claude" title={t.claudeTitle}>
        <DocsSteps steps={t.claudeSteps} extras={{ 1: <CopyBlock label={t.urlLabel} value={`${origin}/mcp`} inline {...copy} /> }} />
      </DocsSection>

      <DocsSection id="check" title={t.checkTitle}>
        <p className="text-muted-foreground">{t.check}</p>
      </DocsSection>
    </>
  )
}
