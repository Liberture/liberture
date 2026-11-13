import type { Organization } from "@prisma/client"
import { CardCarousel } from "@/components/ui/card-carousel"
import { OrganizationCard } from "./org-card"
import type { Locale } from "@/lib/translations"
import { getDictionary } from "@/lib/habits/i18n"
import { httpUrl } from "@/lib/directory/organization-entries"

type Connection = { profile: Organization; role: string; sourceUrl: string }

export function RelatedProfiles({ connections, locale }: { connections: Connection[]; locale: Locale }) {
  if (!connections.length) return null
  const t = getDictionary(locale).app.directoryProfiles
  const groups = new Map<string, Connection[]>()
  for (const link of connections) {
    const group = groups.get(link.profile.id)
    if (group) group.push(link)
    else groups.set(link.profile.id, [link])
  }
  return <CardCarousel title={t.related} previousLabel={t.previous} nextLabel={t.next}>
    {[...groups.values()].map(links => <li key={links[0].profile.id}>
      <OrganizationCard org={links[0].profile} />
      {links.map(({ role, sourceUrl }) => <p key={role} className="mt-2 text-sm text-muted-foreground">
        {role} {httpUrl(sourceUrl) && <a className="text-primary underline" href={sourceUrl} target="_blank" rel="noopener noreferrer">{t.source}</a>}
      </p>)}
    </li>)}
  </CardCarousel>
}
