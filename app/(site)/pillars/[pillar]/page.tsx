import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, TrendingUp, Users, Building2, Zap, FileText, ArrowRight, Star, Clock } from 'lucide-react'
import Link from 'next/link'
import { MotionContainer, MotionItem, MotionStats, MotionSection, AnimatedArticleGrid, AnimatedOtherPillars } from '@/components/animations'
import { PillarIcon } from '@/components/pillars/PillarIcon'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const VALID_PILLARS = ['work', 'sleep', 'nutrition', 'mind', 'exercise', 'finance'] as const
type Pillar = (typeof VALID_PILLARS)[number]

const pillarConfig: Record<Pillar, { title: string; description: string; color: string; tagline: string }> = {
  work: { title: 'Work & Cognition', description: 'Optimize your brain for focus, memory, learning, and peak mental performance.', color: 'from-work/20 to-work/5', tagline: 'Think Sharper' },
  sleep: { title: 'Sleep & Recovery', description: 'Master sleep, stress management, and active recovery for sustainable performance.', color: 'from-sleep/20 to-sleep/5', tagline: 'Rest Better' },
  nutrition: { title: 'Nutrition & Fueling', description: 'Nutrition strategies for energy, longevity, and metabolic health.', color: 'from-nutrition/20 to-nutrition/5', tagline: 'Eat Smarter' },
  mind: { title: 'Mind & Mental Health', description: 'Build resilience, emotional intelligence, and psychological strength.', color: 'from-mind/20 to-mind/5', tagline: 'Feel Stronger' },
  exercise: { title: 'Exercise & Physicality', description: 'Training, movement, and body optimization for functional longevity.', color: 'from-exercise/20 to-exercise/5', tagline: 'Move Better' },
  finance: { title: 'Finance & Wealth', description: 'Financial independence, passive income, and wealth-building strategies.', color: 'from-finance/20 to-finance/5', tagline: 'Build Wealth' },
}

interface PageProps {
  params: Promise<{ pillar: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pillar: pillarParam } = await params
  const pillar = VALID_PILLARS.find(p => p === pillarParam)
  
  if (!pillar) {
    return {
      title: 'Pillar Not Found | Liberture',
    }
  }

  const config = pillarConfig[pillar]
  
  return {
    title: `${config.title} | Liberture`,
    description: config.description,
    openGraph: {
      title: `${config.title} | Liberture`,
      description: config.description,
      url: `https://liberture.com/pillars/${pillar}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${config.title} | Liberture`,
      description: config.description,
    },
  }
}

export default async function PillarPage({ params }: PageProps) {
  const { pillar: pillarParam } = await params
  const pillar = VALID_PILLARS.find(p => p === pillarParam)
  if (!pillar) notFound()

  const config = pillarConfig[pillar]

  let articles: any[] = []
  let people: any[] = []
  let books: any[] = []
  let organizations: any[] = []
  let protocols: any[] = []

  try {
    const [articlesRes, peopleRes, booksRes, orgsRes, protocolsRes] = await Promise.all([
      prisma.article.findMany({
        where: { pillar },
        select: { id: true, title: true, description: true, tags: true, author: true, readTime: true, url: true, publishedAt: true, slug: true },
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.person.findMany({
        where: { pillars: { contains: pillar } },
        select: { id: true, name: true, slug: true, bio: true, title: true, imageUrl: true, featured: true },
        orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      }),
      prisma.book.findMany({
        where: { pillars: { contains: pillar } },
        select: { id: true, title: true, slug: true, author: true, description: true, rating: true, year: true, imageUrl: true, featured: true },
        orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
      }),
      prisma.organization.findMany({
        where: { pillars: { contains: pillar } },
        select: { id: true, name: true, slug: true, description: true, type: true, website: true, imageUrl: true, featured: true },
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

  const totalItems = articles.length + people.length + books.length + organizations.length + protocols.length
  const otherPillars = VALID_PILLARS.filter(p => p !== pillar).map(p => ({ id: p, config: pillarConfig[p] }))

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
                { value: people.length, label: 'People' },
                { value: books.length, label: 'Books' },
                { value: protocols.length, label: 'Protocols' },
                { value: totalItems, label: 'Total' },
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
                  <h2 className="text-3xl font-bold">People</h2>
                  <span className="text-sm text-muted-foreground">({people.length})</span>
                </div>
                <Link href="/people" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {people.slice(0, 6).map((person: any) => (
                  <Link key={person.id} href={`/people/${person.slug}`}>
                    <Card className="h-full hover:border-purple-500/50 transition-colors">
                      <CardContent className="p-5">
                        {person.featured && <Badge className="mb-2 bg-purple-500/20 text-purple-400 border-purple-500/30">Featured</Badge>}
                        <h3 className="font-semibold mb-1">{person.name}</h3>
                        {person.title && <p className="text-xs text-muted-foreground mb-2">{person.title}</p>}
                        <p className="text-sm text-muted-foreground line-clamp-2">{person.bio}</p>
                      </CardContent>
                    </Card>
                  </Link>
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
                  <h2 className="text-3xl font-bold">Books</h2>
                  <span className="text-sm text-muted-foreground">({books.length})</span>
                </div>
                <Link href="/books" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {books.slice(0, 6).map((book: any) => (
                  <Link key={book.id} href={`/books/${book.slug}`}>
                    <Card className="h-full hover:border-orange-500/50 transition-colors">
                      <CardContent className="p-5">
                        {book.featured && <Badge className="mb-2 bg-orange-500/20 text-orange-400 border-orange-500/30">Featured</Badge>}
                        <h3 className="font-semibold mb-1 line-clamp-1">{book.title}</h3>
                        <p className="text-xs text-muted-foreground mb-2">{book.author}{book.year ? ` (${book.year})` : ''}</p>
                        {book.rating && (
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{book.rating.toFixed(1)}</span>
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">{book.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
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
                  <h2 className="text-3xl font-bold">Protocols</h2>
                  <span className="text-sm text-muted-foreground">({protocols.length})</span>
                </div>
                <Link href="/protocols" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {protocols.slice(0, 6).map((protocol: any) => (
                  <Link key={protocol.id} href={`/protocols/${protocol.slug}`}>
                    <Card className="h-full hover:border-green-500/50 transition-colors">
                      <CardContent className="p-5">
                        {protocol.featured && <Badge className="mb-2 bg-green-500/20 text-green-400 border-green-500/30">Featured</Badge>}
                        <h3 className="font-semibold mb-1">{protocol.name}</h3>
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="text-xs">{protocol.difficulty}</Badge>
                          {protocol.duration && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {protocol.duration}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{protocol.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Organizations Section */}
      {organizations.length > 0 && (
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-cyan-400" />
                  <h2 className="text-3xl font-bold">Organizations</h2>
                  <span className="text-sm text-muted-foreground">({organizations.length})</span>
                </div>
                <Link href="/organizations" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {organizations.slice(0, 6).map((org: any) => (
                  <Link key={org.id} href={`/organizations/${org.slug}`}>
                    <Card className="h-full hover:border-cyan-500/50 transition-colors">
                      <CardContent className="p-5">
                        {org.featured && <Badge className="mb-2 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Featured</Badge>}
                        <h3 className="font-semibold mb-1">{org.name}</h3>
                        {org.type && <p className="text-xs text-muted-foreground mb-2 capitalize">{org.type}</p>}
                        <p className="text-sm text-muted-foreground line-clamp-2">{org.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Articles Section */}
      {articles.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-400" />
                  <h2 className="text-3xl font-bold">Articles</h2>
                  <span className="text-sm text-muted-foreground">({articles.length})</span>
                </div>
                <Link href="/articles" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <AnimatedArticleGrid articles={articles} pillar={pillar} />
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
                  <p className="text-muted-foreground">No content yet in this pillar. Check back soon!</p>
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
              <h3 className="text-2xl font-bold">Explore Other Pillars</h3>
              <p className="text-muted-foreground">Liberture is built on 6 interconnected pillars of human optimization</p>
              <AnimatedOtherPillars pillars={otherPillars} />
            </div>
          </div>
        </section>
      </MotionSection>
    </div>
  )
}
