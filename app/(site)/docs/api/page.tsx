import { CopyBlock } from "@/components/habits/docs/copy-block"
import { DocsSection, DocsTitle } from "@/components/habits/docs/docs-parts"
import { API_OPERATIONS } from "@/lib/habits/api/operations"
import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { getServerOrigin } from "@/lib/habits/request-origin"
import { cn } from "@/lib/utils"

export const metadata = { title: "API reference · Liberture docs" }

const METHOD_STYLE: Record<string, string> = {
  GET: "bg-sleep/15 text-sleep",
  POST: "bg-success/15 text-success",
  PATCH: "bg-nutrition/15 text-nutrition",
}

export default async function ApiDocsPage() {
  const [locale, origin] = await Promise.all([getRequestLocale(), getServerOrigin()])
  const dict = getDictionary(locale)
  const t = dict.docs.api
  const copy = { copyLabel: dict.docs.copy, copiedLabel: dict.docs.copied }

  return (
    <>
      <DocsTitle title={t.title} lead={t.lead} />

      <CopyBlock label={t.openapi} value={`${origin}/api/v1/openapi.json`} inline {...copy} />
      <CopyBlock label={t.mcp} value={`${origin}/mcp`} inline {...copy} />

      <DocsSection title={t.title}>
        <div className="space-y-3">
          {API_OPERATIONS.map((op) => (
            <article key={op.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded px-2 py-0.5 font-mono text-xs font-bold", METHOD_STYLE[op.method])}>{op.method}</span>
                <code className="break-all font-mono text-sm text-foreground">/api/v1{op.path}</code>
              </div>
              <p className="mt-2 font-medium text-foreground">{op.summary}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{op.description}</p>
              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                <div className="flex gap-1.5">
                  <dt>{t.tool}:</dt>
                  <dd><code className="text-foreground">{op.id}</code></dd>
                </div>
                <div className="flex gap-1.5">
                  <dt>{t.scope}:</dt>
                  <dd><code className="text-foreground">{op.scope}</code></dd>
                </div>
              </dl>
              {op.mcpOnly ? <p className="mt-2 text-xs text-muted-foreground">{t.mcpOnly}</p> : null}
            </article>
          ))}
        </div>
      </DocsSection>

      <p className="text-sm text-muted-foreground">{t.limits}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t.more}</p>
    </>
  )
}
