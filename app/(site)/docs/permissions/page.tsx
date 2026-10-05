import { DocsList, DocsSection, DocsTitle } from "@/components/habits/docs/docs-parts"
import { API_SCOPES } from "@/lib/habits/api-scopes"
import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { DocsScreenshot } from "@/components/habits/docs/docs-screenshot"

export const metadata = { title: "Permissions · Liberture docs" }

export default async function PermissionsDocsPage() {
  const locale = await getRequestLocale()
  const dict = getDictionary(locale)
  const t = dict.docs.permissions

  return (
    <>
      <DocsTitle title={t.title} lead={t.lead} />
      <DocsScreenshot locale={locale} imageKey="assistant-permissions" alt={dict.guides.articles.find((a) => a.slug === "habit-tracker-privacy-and-permissions")?.heroAlt ?? ""} />
      <p className="-mt-6 mb-8 text-muted-foreground">{t.where}</p>

      <div className="mb-12 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">{t.tableScope}</th>
              <th scope="col" className="px-4 py-3 font-semibold">{t.tableAllows}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {API_SCOPES.map((scope) => (
              <tr key={scope} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{t.scopes[scope].name}</p>
                  <code className="text-xs text-muted-foreground">{scope}</code>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{t.scopes[scope].allows}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DocsSection title={t.deniedTitle}>
        <p className="leading-relaxed text-muted-foreground">{t.denied}</p>
      </DocsSection>
      <DocsSection title={t.revokeTitle}>
        <p className="leading-relaxed text-muted-foreground">{t.revoke}</p>
      </DocsSection>
      <DocsSection title={t.cannotTitle}>
        <DocsList items={t.cannot} />
      </DocsSection>
    </>
  )
}
