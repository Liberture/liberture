import type { Organization } from "@prisma/client"
import Image from "next/image"
import { BookOpen, Building2, ExternalLink, Files, Users } from "lucide-react"
import { DirectoryLayout } from "@/components/directory/layout"
import { PillarTag } from "@/components/habits/marketplace/pillar-tag"
import { ProfileMarkdown } from "@/components/people/profile-markdown"
import { JsonLd, BreadcrumbSchema } from "@/components/seo/JsonLd"
import { sectionTrail } from "@/components/seo/section-breadcrumbs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { profilePillars } from "@/lib/pillars"
import { organizationLabels } from "./labels"

function httpUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return
  try {
    const url = new URL(value)
    if (url.protocol === "https:" || url.protocol === "http:") return url.href
  } catch {
    return
  }
}

type Entry = { title: string; url?: string }

function entries(raw: string | null): Entry[] {
  if (!raw?.trim()) return []
  let values: unknown
  try {
    values = JSON.parse(raw)
  } catch {
    values = raw.split(/\r?\n/)
  }
  const list = Array.isArray(values) ? values : [values]
  return list.flatMap((value): Entry[] => {
    if (typeof value === "string" && value.trim()) return [{ title: value.trim(), url: httpUrl(value.trim()) }]
    if (value && typeof value.title === "string" && value.title.trim()) return [{ title: value.title.trim(), url: httpUrl(value.url) }]
    return []
  })
}

function EntryList({ items }: { items: Entry[] }) {
  return <ul className="divide-y divide-border">{items.map(({ title, url }, index) =>
    <li key={index} className="py-3 first:pt-0 last:pb-0">
      {url ? <a href={url} rel="noopener noreferrer" target="_blank" className="inline-flex items-baseline gap-2 text-primary hover:underline">
        {title}<ExternalLink className="size-3.5 shrink-0 self-center" aria-hidden />
      </a> : title}
    </li>
  )}</ul>
}

export default async function OrganizationDetails({ organization }: { organization: Organization }) {
  const t = organizationLabels[await getRequestLocale()]
  const website = httpUrl(organization.website)
  const wikipedia = httpUrl(organization.wikipedia)
  const image = organization.imageUrl?.startsWith("/") && !organization.imageUrl.startsWith("//") ? organization.imageUrl : httpUrl(organization.imageUrl)
  const pillars = profilePillars(organization.pillars)
  const groups = [
    { id: "people", title: t.people, icon: Users, items: entries(organization.keyPeople) },
    { id: "resources", title: t.resources, icon: Files, items: entries(organization.resources) },
    { id: "publications", title: t.publications, icon: BookOpen, items: entries(organization.publications) },
  ].filter(group => group.items.length)
  const url = `https://liberture.com/organizations/${organization.slug}`

  return <DirectoryLayout>
    <JsonLd data={{
      "@context": "https://schema.org", "@type": "Organization", "@id": url + "#organization", name: organization.name,
      url, description: organization.description, sameAs: [website, wikipedia].filter(Boolean),
      ...(image && { logo: new URL(image, url).href }), ...(organization.founded && { foundingDate: organization.founded }),
    }} />
    <BreadcrumbSchema compact items={[...sectionTrail("organizations"), { name: organization.name, url }]} />
    <h1 className="my-7 text-balance text-4xl font-bold sm:text-5xl">{organization.name}</h1>
    <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(15rem,0.42fr)]">
      <aside className="min-w-0 space-y-5 rounded-xl border border-border bg-card p-5 md:sticky md:top-24 md:col-start-2 md:row-start-1" aria-label={t.profile}>
        {image && <Image src={image} alt={organization.name} width={160} height={80} unoptimized className="h-16 w-auto max-w-full object-contain object-left" />}
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
        {groups.map(({ id, items }) => <TabsContent key={id} value={id}><EntryList items={items} /></TabsContent>)}
      </Tabs>
    </div>
  </DirectoryLayout>
}
