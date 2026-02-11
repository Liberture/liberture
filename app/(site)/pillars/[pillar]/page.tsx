import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Clock, ExternalLink, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const VALID_PILLARS = [
  'Cognition',
  'Recovery', 
  'Fueling',
  'Mental',
  'Physicality',
  'Finance',
] as const

type Pillar = (typeof VALID_PILLARS)[number]

const pillarConfig: Record<Pillar, {
  title: string
  description: string
  color: string
  icon: string
  tagline: string
}> = {
  Cognition: {
    title: 'Cognition',
    description: 'Optimize your brain for focus, memory, learning, and peak mental performance.',
    color: 'from-cognition/20 to-cognition/5',
    icon: '🧠',
    tagline: 'Think Sharper',
  },
  Recovery: {
    title: 'Recovery',
    description: 'Master sleep, stress management, and active recovery for sustainable performance.',
    color: 'from-recovery/20 to-recovery/5',
    icon: '💤',
    tagline: 'Rest Better',
  },
  Fueling: {
    title: 'Fueling',
    description: 'Nutrition strategies for energy, longevity, and metabolic health.',
    color: 'from-fueling/20 to-fueling/5',
    icon: '🥗',
    tagline: 'Eat Smarter',
  },
  Mental: {
    title: 'Mental',
    description: 'Build resilience, emotional intelligence, and psychological strength.',
    color: 'from-mental/20 to-mental/5',
    icon: '🧘',
    tagline: 'Feel Stronger',
  },
  Physicality: {
    title: 'Physicality',
    description: 'Training, movement, and body optimization for functional longevity.',
    color: 'from-physicality/20 to-physicality/5',
    icon: '💪',
    tagline: 'Move Better',
  },
  Finance: {
    title: 'Finance',
    description: 'Financial independence, passive income, and wealth-building strategies.',
    color: 'from-finance/20 to-finance/5',
    icon: '💰',
    tagline: 'Build Wealth',
  },
}

interface PageProps {
  params: Promise<{ pillar: string }>
}

export async function generateStaticParams() {
  return VALID_PILLARS.map((pillar) => ({
    pillar: pillar.toLowerCase(),
  }))
}

export default async function PillarPage({ params }: PageProps) {
  const { pillar: pillarParam } = await params
  
  // Normalize pillar name
  const pillar = VALID_PILLARS.find(
    p => p.toLowerCase() === pillarParam.toLowerCase()
  )

  if (!pillar) {
    notFound()
  }

  const config = pillarConfig[pillar]

  // Fetch all articles for this pillar
  const articles = await prisma.knowledgeArticle.findMany({
    where: { pillar },
    select: {
      id: true,
      title: true,
      description: true,
      tags: true,
      author: true,
      readTime: true,
      url: true,
      publishedAt: true,
      slug: true,
    },
    orderBy: { publishedAt: 'desc' },
  })

  const totalReadTime = articles.reduce((sum, a) => sum + a.readTime, 0)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`relative py-20 bg-gradient-to-br ${config.color}`}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="text-6xl mb-4">{config.icon}</div>
            <Badge variant="outline" className="text-sm">
              {config.tagline}
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight">
              {config.title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {config.description}
            </p>
            <div className="flex items-center justify-center gap-8 pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{articles.length}</div>
                <div className="text-sm text-muted-foreground">Articles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{totalReadTime}</div>
                <div className="text-sm text-muted-foreground">Min Read</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">Free</div>
                <div className="text-sm text-muted-foreground">Always</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <h2 className="text-3xl font-bold">Knowledge Base</h2>
              </div>
              <Badge variant="outline">
                <TrendingUp className="h-3 w-3 mr-1" />
                Recently Updated
              </Badge>
            </div>

            {articles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No articles yet in this pillar. Check back soon!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => {
                  const tags = article.tags.split(',').map(t => t.trim()).filter(Boolean)
                  
                  return (
                    <Card 
                      key={article.id}
                      className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {config.icon} {pillar}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {article.readTime} min
                          </div>
                        </div>
                        <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {article.description}
                        </p>
                        
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tags.slice(0, 3).map((tag) => (
                              <Badge 
                                key={tag} 
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <span className="text-xs text-muted-foreground truncate">
                            {article.author}
                          </span>
                          <Link
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Read
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Other Pillars CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h3 className="text-2xl font-bold">Explore Other Pillars</h3>
            <p className="text-muted-foreground">
              Liberture is built on 6 interconnected pillars of human optimization
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4">
              {VALID_PILLARS.filter(p => p !== pillar).map((otherPillar) => {
                const otherConfig = pillarConfig[otherPillar]
                return (
                  <Link
                    key={otherPillar}
                    href={`/pillars/${otherPillar.toLowerCase()}`}
                    className="group"
                  >
                    <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
                      <CardContent className="p-6 text-center space-y-2">
                        <div className="text-4xl">{otherConfig.icon}</div>
                        <h4 className="font-semibold group-hover:text-primary transition-colors">
                          {otherConfig.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {otherConfig.tagline}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
