import { PILLAR_IDS, PILLAR_STYLES, type PillarId as Pillar } from "@/lib/habits/pillars"
import { translatedAlternates } from "@/lib/seo/translated-routes"
import { getLocale, getTranslations as getUiCopy } from "next-intl/server"
import { DirectoryProtocol } from "@/components/directory/protocol-card"
import { ArticleCard } from "@/components/directory/article-card"
import { BookCard } from "@/components/directory/book-card"
import { OrganizationCard } from "@/components/directory/org-card"
import { getSiteMessages } from "@/lib/i18n/messages.server"
import { PersonCard } from "@/components/people/person-card"
import { notFound } from 'next/navigation'
import { directoryPrisma as prisma } from '@/lib/i18n/directory-records.server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, TrendingUp, Users, Building2, Zap, FileText, ArrowRight } from 'lucide-react'
import Link from '@/components/i18n/localized-link'
import { MotionContainer, MotionItem, MotionStats, MotionSection, AnimatedOtherPillars } from '@/components/animations'
import { PillarIcon } from '@/components/pillars/PillarIcon'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'


interface PageProps {
  params: Promise<{ pillar: string }>
}

async function getTranslationsForPillar(pillar: Pillar) {
  const t = await getUiCopy("publicCopy.pillars")
  return { title: t(`${pillar}Title`), description: t(`${pillar}Description`), color: PILLAR_STYLES[pillar].gradient, tagline: t(`${pillar}Tagline`) }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pillar: pillarParam } = await params
  const pillar = PILLAR_IDS.find(p => p === pillarParam)
  
  if (!pillar) notFound()
  const locale = await getLocale()
  const config = await getTranslationsForPillar(pillar)
  const alternates = translatedAlternates("/pillars/" + pillar, locale)
  return {
    title: config.title, description: config.description, alternates,
    openGraph: { type: "website", title: config.title, description: config.description, url: alternates.canonical, locale: locale === "es" ? "es_ES" : "en_US" },
    twitter: { card: "summary_large_image", title: config.title, description: config.description },
  }
}

export default async function PillarPage({ params }: PageProps) {
  const uiCopy = await getUiCopy("publicCopy.pillar")

  const { pillar: pillarParam } = await params
  const pillar = PILLAR_IDS.find(p => p === pillarParam)
  if (!pillar) notFound()

  const config = await getTranslationsForPillar(pillar)

  let articles: any[] = []
  let people: any[] = []
  let books: any[] = []
  let organizations: any[] = []
  let protocols: any[] = []

  try {
    const [articlesRes, peopleRes, booksRes, orgsRes, protocolsRes] = await Promise.all([
      prisma.article.findMany({
        where: { pillar },
        select: { id: true, title: true, description: true, tags: true, author: true, readTime: true, pillar: true, url: true, publishedAt: true, slug: true },
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.person.findMany({
        where: { pillars: { contains: pillar } },
        select: { id: true, name: true, slug: true, bio: true, summary: true, title: true, pillars: true, imageUrl: true, featured: true },
        orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      }),
      prisma.book.findMany({
        where: { pillars: { contains: pillar } },
        select: { id: true, title: true, slug: true, author: true, pillars: true, pages: true, description: true, rating: true, year: true, imageUrl: true, featured: true },
        orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
      }),
      prisma.organization.findMany({
        where: { pillars: { contains: pillar } },
        select: { id: true, name: true, slug: true, directoryKind: true, description: true, type: true, founded: true, pillars: true, imageUrl: true, featured: true },
        orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      }),
      prisma.protocol.findMany({
        where: { pillar, published: true },
        select: { id: true, name: true, slug: true, description: true, difficulty: true, duration: true, featured: true },
        orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      }),
    ])
    articles = articlesRes
    people = peopleRes
    books = booksRes
    organizations = orgsRes
    protocols = protocolsRes
  } catch {
    // Database unavailable
  }

  const directoryCopy = (await getSiteMessages()).habits.app.directoryProfiles
  const totalItems = articles.length + people.length + books.length + organizations.length + protocols.length
  const otherPillars = await Promise.all(PILLAR_IDS.filter(p => p !== pillar).map(async p => ({ id: p, config: await getTranslationsForPillar(p) })))

  return (
    <div className="min-h-screen">
      <section className={`relative py-20 bg-gradient-to-br ${config.color}`}>
        <div className="container mx-auto px-4">
          <MotionContainer className="max-w-4xl mx-auto text-center space-y-6">
            <MotionItem>
              <PillarIcon pillarId={pillar} size="lg" animate />
            </MotionItem>
            <MotionItem delay={0.1}>
              <Badge variant="outline" className="text-sm">{config.tagline}</Badge>
            </MotionItem>
            <MotionItem delay={0.2}>
              <h1 className="text-5xl font-bold tracking-tight">{config.title}</h1>
            </MotionItem>
            <MotionItem delay={0.3}>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{config.description}</p>
            </MotionItem>
            <MotionStats
              className="flex items-center justify-center gap-8 pt-6"
              stats={[
                { value: people.length, label: uiCopy('people') },
                { value: books.length, label: uiCopy('books') },
                { value: protocols.length, label: uiCopy('protocols') },
                { value: totalItems, label: uiCopy('total') },
              ]}
            />
          </MotionContainer>
        </div>
      </section>

      {/* People Section */}
      {people.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-purple-400" />
                  <h2 className="text-3xl font-bold">{uiCopy("people")}</h2>
                  <span className="text-sm text-muted-foreground">({people.length})</span>
                </div>
                <Link href="/people" className="text-sm text-primary hover:underline flex items-center gap-1">{uiCopy("viewAll")} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {people.slice(0, 6).map((person: any) => (
                  <PersonCard key={person.id} featuredLabel={uiCopy("featured")} person={person} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Books Section */}
      {books.length > 0 && (
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-orange-400" />
                  <h2 className="text-3xl font-bold">{uiCopy("books")}</h2>
                  <span className="text-sm text-muted-foreground">({books.length})</span>
                </div>
                <Link href="/books" className="text-sm text-primary hover:underline flex items-center gap-1">{uiCopy("viewAll")} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {books.slice(0, 6).map(book => <BookCard key={book.id} book={book} />)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Protocols Section */}
      {protocols.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-green-400" />
                  <h2 className="text-3xl font-bold">{uiCopy("protocols")}</h2>
                  <span className="text-sm text-muted-foreground">({protocols.length})</span>
                </div>
                <Link href="/protocols" className="text-sm text-primary hover:underline flex items-center gap-1">{uiCopy("viewAll")} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {protocols.slice(0, 6).map(protocol => <DirectoryProtocol key={protocol.slug} protocol={protocol} />)}
              </div>
            </div>
          </div>
        </section>
      )}

      {(["project", "organization"] as const).map(kind => {
        const rows = organizations.filter(row => row.directoryKind === kind)
        const section = kind === "project" ? "projects" : "organizations"
        if (!rows.length) return null
        return <section key={kind} className="py-16 bg-muted/20">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-3xl font-bold">{directoryCopy[section]} <span className="text-sm text-muted-foreground">({rows.length})</span></h2>
              <Link href={`/${section}`}>{uiCopy("viewAll")} <ArrowRight className="inline size-3" /></Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{rows.slice(0, 6).map(org => <OrganizationCard key={org.id} org={org} />)}</div>
          </div>
        </section>
      })}

      {/* Articles Section */}
      {articles.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-400" />
                  <h2 className="text-3xl font-bold">{uiCopy("articles")}</h2>
                  <span className="text-sm text-muted-foreground">({articles.length})</span>
                </div>
                <Link href="/articles" className="text-sm text-primary hover:underline flex items-center gap-1">{uiCopy("viewAll")} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {articles.map(article => <ArticleCard key={article.slug} article={article} />)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Empty state if nothing at all */}
      {totalItems === 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">{uiCopy("noContentYetInThisPillarCheckBack")}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      <MotionSection delay={0.2}>
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h3 className="text-2xl font-bold">{uiCopy("exploreOtherPillars")}</h3>
              <p className="text-muted-foreground">{uiCopy("libertureIsBuiltOn6InterconnectedPillarsOf")}</p>
              <AnimatedOtherPillars pillars={otherPillars} />
            </div>
          </div>
        </section>
      </MotionSection>
    </div>
  )
}
