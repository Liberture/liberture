import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const PILLARS = [
  {
    name: 'Cognition',
    slug: 'cognition',
    icon: '🧠',
    tagline: 'Think Sharper',
    description: 'Optimize brain function, focus, memory, and mental performance',
    color: 'from-cognition/20 to-cognition/5 hover:from-cognition/30 hover:to-cognition/10',
    borderColor: 'border-cognition/30',
  },
  {
    name: 'Recovery',
    slug: 'recovery',
    icon: '💤',
    tagline: 'Rest Better',
    description: 'Master sleep, stress management, and sustainable performance',
    color: 'from-recovery/20 to-recovery/5 hover:from-recovery/30 hover:to-recovery/10',
    borderColor: 'border-recovery/30',
  },
  {
    name: 'Fueling',
    slug: 'fueling',
    icon: '🥗',
    tagline: 'Eat Smarter',
    description: 'Nutrition strategies for energy, longevity, and metabolic health',
    color: 'from-fueling/20 to-fueling/5 hover:from-fueling/30 hover:to-fueling/10',
    borderColor: 'border-fueling/30',
  },
  {
    name: 'Mental',
    slug: 'mental',
    icon: '🧘',
    tagline: 'Feel Stronger',
    description: 'Build resilience, emotional intelligence, and psychological strength',
    color: 'from-mental/20 to-mental/5 hover:from-mental/30 hover:to-mental/10',
    borderColor: 'border-mental/30',
  },
  {
    name: 'Physicality',
    slug: 'physicality',
    icon: '💪',
    tagline: 'Move Better',
    description: 'Training, movement, and body optimization for longevity',
    color: 'from-physicality/20 to-physicality/5 hover:from-physicality/30 hover:to-physicality/10',
    borderColor: 'border-physicality/30',
  },
  {
    name: 'Finance',
    slug: 'finance',
    icon: '💰',
    tagline: 'Build Wealth',
    description: 'Financial independence, passive income, and wealth strategies',
    color: 'from-finance/20 to-finance/5 hover:from-finance/30 hover:to-finance/10',
    borderColor: 'border-finance/30',
  },
] as const

export default async function PillarsPage() {
  // Get article counts per pillar
  const articleCounts = await prisma.knowledgeArticle.groupBy({
    by: ['pillar'],
    _count: {
      id: true,
    },
  })

  const countMap = Object.fromEntries(
    articleCounts.map(({ pillar, _count }) => [pillar, _count.id])
  )

  const totalArticles = articleCounts.reduce((sum, { _count }) => sum + _count.id, 0)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="text-sm">
              Your Biological Operating System
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight">
              The 6 Pillars of Optimization
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive framework for human performance, longevity, and wellbeing.
              Each pillar is backed by science and designed to work synergistically.
            </p>
            <div className="flex items-center justify-center gap-8 pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold">{totalArticles}</div>
                <div className="text-sm text-muted-foreground">Total Articles</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">6</div>
                <div className="text-sm text-muted-foreground">Pillars</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">100%</div>
                <div className="text-sm text-muted-foreground">Free</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {PILLARS.map((pillar) => {
                const count = countMap[pillar.name] || 0
                
                return (
                  <Link
                    key={pillar.slug}
                    href={`/pillars/${pillar.slug}`}
                    className="group"
                  >
                    <Card className={`h-full bg-gradient-to-br ${pillar.color} border-2 ${pillar.borderColor} transition-all duration-300 hover:shadow-xl hover:-translate-y-2`}>
                      <CardContent className="p-8 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="text-6xl">{pillar.icon}</div>
                          <Badge variant="secondary" className="text-xs">
                            {count} {count === 1 ? 'article' : 'articles'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">
                              {pillar.name}
                            </h3>
                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                          <p className="text-sm font-medium text-primary">
                            {pillar.tagline}
                          </p>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {pillar.description}
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

      {/* CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">Start Your Optimization Journey</h2>
            <p className="text-muted-foreground">
              Choose a pillar that resonates with you, or explore them all.
              Every article is curated from trusted experts and backed by science.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link
                href="/knowledge"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Browse All Articles
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/directory"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Explore Directory
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
