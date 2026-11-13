import type { getOrganization } from "@/lib/seo/public-records"
import { profileSummary } from "@/lib/profile-biography"
import { PersonCard } from "@/components/people/person-card"
import { RelatedProfiles } from "./related-profiles"
import { profilePath, profileSection } from "@/lib/directory/profile-path"
import Link from "next/link"
import { OrganizationLogo } from "@/components/directory/organization-logo"
import { BookOpen, Building2, ExternalLink, Files, Users } from "lucide-react"
import { DirectoryLayout } from "@/components/directory/layout"
import { PillarTag } from "@/components/habits/marketplace/pillar-tag"
import { ProfileMarkdown } from "@/components/people/profile-markdown"
import { JsonLd, BreadcrumbSchema } from "@/components/seo/JsonLd"
import { sectionTrail } from "@/components/seo/section-breadcrumbs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Locale } from "@/lib/translations"
import { profilePillars } from "@/lib/pillars"
import { getDictionary } from "@/lib/habits/i18n"

import { httpUrl, entries, type Entry } from "@/lib/directory/organization-entries"

function EntryList({ items }: { items: Entry[] }) {
  return <ul className="divide-y divide-border">{items.map(({ title, url }, index) =>
    <li key={index} className="py-3 first:pt-0 last:pb-0">
      {url?.startsWith("/people/") ? <Link href={url} className="text-primary underline">{title}</Link> : url ? <a href={url} rel="noopener noreferrer" target="_blank" className="inline-flex items-baseline gap-2 text-primary hover:underline">
        {title}<ExternalLink className="size-3.5 shrink-0 self-center" aria-hidden />
      </a> : title}
    </li>
  )}</ul>
}

export default function OrganizationDetails({ organization, locale }: { organization: NonNullable<Awaited<ReturnType<typeof getOrganization>>>; locale: Locale }) {
  const copy = getDictionary(locale).app
  const t = copy.organizationProfile
  const section = profileSection(organization.directoryKind)
  const isProject = section === "projects"
  const people = organization.profilePeople
  const linkedPeople = new Map<string, { person: (typeof people)[number]["person"]; roles: string[] }>()
  for (const { person, role } of people) {
    const entry = linkedPeople.get(person.id)
    if (entry) entry.roles.push(role)
    else linkedPeople.set(person.id, { person, roles: [role] })
  }
  const connections = [
    ...organization.projectOrganizations.map(link => ({ ...link, profile: link.organization })),
    ...organization.organizationProjects.map(link => ({ ...link, profile: link.project, role: organization.name + " · " + link.role })),
  ]
  const website = httpUrl(organization.website)
  const wikipedia = httpUrl(organization.wikipedia)
  const image = organization.imageUrl?.startsWith("/") && !organization.imageUrl.startsWith("//") ? organization.imageUrl : httpUrl(organization.imageUrl)
  const pillars = profilePillars(organization.pillars)
  const groups = [
    { id: "people", title: t.people, icon: Users, items: entries(organization.keyPeople) },
    { id: "resources", title: t.resources, icon: Files, items: entries(organization.resources) },
    { id: "publications", title: t.publications, icon: BookOpen, items: entries(organization.publications) },
  ].filter(group => group.items.length || (group.id === "people" && people.length))
  const url = `https://liberture.com${profilePath(organization)}`

  return <DirectoryLayout>
    <JsonLd data={{
      "@context": "https://schema.org", "@type": isProject ? "Project" : "Organization", "@id": url + "#" + organization.directoryKind, name: organization.name,
      url, description: organization.description, sameAs: [website, wikipedia].filter(Boolean),
      ...(image && { logo: new URL(image, url).href }), ...(organization.founded && { foundingDate: organization.founded }),
    }} />
    <BreadcrumbSchema compact items={[...sectionTrail(section), { name: organization.name, url }]} />
    <h1 className="my-7 text-balance text-4xl font-bold sm:text-5xl">{organization.name}</h1>
    <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(15rem,0.42fr)]">
      <aside className="min-w-0 space-y-5 rounded-xl border border-border bg-card p-5 md:sticky md:top-24 md:col-start-2 md:row-start-1" aria-label={isProject ? copy.directoryProfiles.projectProfile : t.profile}>
        <OrganizationLogo src={image ?? null} name={organization.name} />
        <dl className="space-y-3 text-sm">
          {organization.type && <div><dt className="text-muted-foreground">{t.type}</dt><dd className="capitalize">{organization.type}</dd></div>}
          {organization.founded && <div><dt className="text-muted-foreground">{t.founded}</dt><dd>{organization.founded}</dd></div>}
          {website && <div><dt className="text-muted-foreground">{t.website}</dt><dd>
            <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-primary hover:underline">{new URL(website).hostname.replace(/^www\./, "")}<ExternalLink className="size-3 shrink-0" aria-hidden /></a>
          </dd></div>}
          {pillars.length > 0 && <div><dt className="mb-2 text-muted-foreground">{t.focus}</dt><dd className="flex flex-wrap gap-1.5">{pillars.map(id => <PillarTag key={id} pillar={id} />)}</dd></div>}
        </dl>
        {wikipedia && <a className="inline-flex items-center gap-1 text-sm text-primary hover:underline" href={wikipedia} target="_blank" rel="noopener noreferrer">Wikipedia<ExternalLink className="size-3" aria-hidden /></a>}
      </aside>
      <Tabs defaultValue="about" className="md:col-start-1 md:row-start-1">
        <TabsList aria-label={organization.name}>
          <TabsTrigger value="about"><Building2 />{t.about}</TabsTrigger>
          {groups.map(({ id, title, icon: Icon }) => <TabsTrigger key={id} value={id}><Icon />{title}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="about"><ProfileMarkdown>{organization.description}</ProfileMarkdown></TabsContent>
        {groups.map(({ id, items }) => <TabsContent key={id} value={id}>
          {id === "people" && people.length ? <div className="grid gap-3 sm:grid-cols-2">
            {[...linkedPeople.values()].map(({ person, roles }) =>
              <PersonCard key={person.id} person={{ ...person, bio: profileSummary(person) }} role={roles.join(" · ")} featuredLabel={copy.protocolCard.featured} />)}
          </div> : <EntryList items={items} />}
        </TabsContent>)}
      </Tabs>
    </div>
    <RelatedProfiles connections={connections} locale={locale} />
  </DirectoryLayout>
}
