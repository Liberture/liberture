import Link from "next/link"
import { DirectoryLayout } from "@/components/directory/layout"
import { DirectoryProtocol } from "@/components/directory/protocol-card"
import { CardCarousel } from "@/components/ui/card-carousel"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArticleSchema, BreadcrumbSchema } from "@/components/seo/JsonLd"
import { sectionTrail } from "@/components/seo/section-breadcrumbs"
import { ProtocolArtwork } from "@/components/habits/marketplace/protocol-artwork"
import { ProtocolFacts, ProtocolHabits } from "@/components/habits/marketplace/protocol-facts"
import { findProtocol } from "@/lib/habits/protocols/catalog"
import type { Author } from "@/lib/habits/protocols/authors"
import { protocolImage } from "@/lib/habits/protocols/images"
import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"

type RelatedProtocol = {
  kind: string;
  note: string;
  protocol: { slug: string; name: string; pillar: string; description: string };
};

type Protocol = {
  id: string;
  slug: string;
  name: string;
  description: string;
  why: string | null;
  pillar: string;
  creator: string | null;
  duration: string | null;
  difficulty: string;
  steps: string;
  benefits: string;
  risks: string | null;
  equipment: string | null;
  references: string | null;
  featured: boolean;
  related?: RelatedProtocol[];
};

function parseList(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [String(parsed)];
  } catch {
    // Legacy rows may hold plain text instead of a JSON array
    return value.trim() ? [value] : [];
  }
}

export default async function ProtocolDetails({ protocol }: { protocol: Protocol }) {
  const steps = parseList(protocol.steps);
  const benefits = parseList(protocol.benefits);
  const risks = parseList(protocol.risks);
  const equipment = parseList(protocol.equipment);
  const references = parseList(protocol.references);
  const { protocolDetails: copy, protocolReader } = getDictionary(await getRequestLocale()).app
  const related = new Map<string, RelatedProtocol[]>()
  for (const relation of protocol.related ?? []) {
    if (relation.protocol.slug === protocol.slug) continue
    const group = related.get(relation.protocol.slug) ?? []
    group.push(relation)
    related.set(relation.protocol.slug, group)
  }
  const catalog = findProtocol(protocol.slug)
  const credits = [catalog?.author, ...(catalog?.coAuthors ?? [])].filter((author): author is Author => Boolean(author))
  const authors = credits.filter(author => author.kind === "person").map(author => ({
    "@type":"Person" as const, name:author.name, sameAs:author.url,
  }))
  const citations = credits.filter(author => author.kind === "consensus").map(author => author.url ?? author.name)
  const image = protocolImage(protocol.slug);

  return (
    <DirectoryLayout>
      {/* JSON-LD Schema */}
      <ArticleSchema
        title={protocol.name}
        description={protocol.description}
        url={`https://liberture.com/protocols/${protocol.slug}`}
        author={credits.length ? 'Liberture' : protocol.creator || 'Liberture'}
        authors={authors}
        citations={citations}
        image={image ? `https://liberture.com${image.png}` : undefined}
      />
      <BreadcrumbSchema items={[...sectionTrail("protocols"), {name:protocol.name, url:`https://liberture.com/protocols/${protocol.slug}`}]} />
      
      <div className="mx-auto max-w-5xl">
        {image && <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <ProtocolArtwork slug={protocol.slug} loading="eager" />
        </div>}
        <header className="my-6 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{protocol.name}</h1>
          {protocol.creator && <p className="text-muted-foreground">{copy.by} <Link className="text-primary hover:underline" href={`/people/${protocol.creator}`}>
            {protocol.creator.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
          </Link></p>}
        </header>

        <div className="relative grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_16rem]">
          {catalog ? <ProtocolFacts protocol={catalog} className="md:sticky md:top-20 md:col-start-2 md:row-start-1" /> :
            <aside aria-label={protocolReader.facts} className="rounded-xl border border-border bg-card p-4 md:sticky md:top-20 md:col-start-2 md:row-start-1">
              <h2 className="mb-2 font-semibold">{protocolReader.facts}</h2>
              <p className="capitalize">{protocol.pillar} · {protocol.difficulty}</p>
              {protocol.duration && <p className="mt-2 text-sm text-muted-foreground">{protocol.duration}</p>}
            </aside>}
          <Tabs defaultValue="overview" className="md:col-start-1 md:row-start-1">
            <TabsList aria-label={protocol.name}>
              <TabsTrigger value="overview">{copy.overview}</TabsTrigger>
              {(steps.length > 0 || equipment.length > 0) && <TabsTrigger value="practice">{copy.practice}</TabsTrigger>}
              {Boolean(catalog?.habits.length) && <TabsTrigger value="habits">{protocolReader.habits}</TabsTrigger>}
              {references.length > 0 && <TabsTrigger value="evidence">{copy.evidence}</TabsTrigger>}
            </TabsList>
            <TabsContent value="overview" className="space-y-5">
              <p className="leading-relaxed text-muted-foreground">{protocol.description}</p>
              {protocol.why && <section><h2 className="mb-2 font-semibold">{copy.why}</h2>
                <p className="leading-relaxed text-muted-foreground">{protocol.why}</p></section>}
              <ProtocolList title={copy.benefits} items={benefits} />
              <ProtocolList title={copy.risks} items={risks} />
            </TabsContent>
            <TabsContent value="practice" className="space-y-5">
              <ProtocolList title={copy.steps} items={steps} ordered />
              <ProtocolList title={copy.equipment} items={equipment} />
            </TabsContent>
            {catalog && <TabsContent value="habits"><ProtocolHabits protocol={catalog} /></TabsContent>}
            <TabsContent value="evidence" className="space-y-5">
              <ProtocolList title={copy.sources} items={references} />
            </TabsContent>
          </Tabs>
        </div>
        {related.size > 0 && <CardCarousel title={copy.related} previousLabel={copy.previous} nextLabel={copy.next}>
          {Array.from(related, ([slug, group]) => <li key={slug} className="flex flex-col gap-2">
            <DirectoryProtocol protocol={group[0].protocol} />
            {group.filter(r => r.note).map(r => <p key={r.kind + r.note} className="text-sm text-muted-foreground">
              {r.kind === "synergy" ? copy.synergy + " · " : r.kind === "alternative" ? copy.alternative + " · " : ""}{r.note}
            </p>)}
          </li>)}
        </CardCarousel>}
      </div>
    </DirectoryLayout>
  )
}

function ProtocolList({ title, items, ordered }: { title: string; items: string[]; ordered?: boolean }) {
  if (!items.length) return null
  const List = ordered ? "ol" : "ul"
  return <section>
    <h2 className="mb-2 font-semibold">{title}</h2>
    <List className={`space-y-2 pl-6 leading-relaxed text-muted-foreground ${ordered ? "list-decimal" : "list-disc"}`}>
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </List>
  </section>
}
