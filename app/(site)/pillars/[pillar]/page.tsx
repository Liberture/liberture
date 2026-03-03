import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, TrendingUp } from 'lucide-react'
import { MotionContainer, MotionItem, MotionLoop, MotionStats, MotionSection, AnimatedArticleGrid, AnimatedOtherPillars } from '@/components/animations'
import type { Metadata } from 'next'

const VALID_PILLARS = ['work', 'sleep', 'nutrition', 'mind', 'exercise', 'finance'] as const
type Pillar = (typeof VALID_PILLARS)[number]

const pillarConfig: Record<Pillar, { title: string; description: string; color: string; icon: string; tagline: string }> = {
  work: { title: 'Work & Cognition', description: 'Optimize your brain for focus, memory, learning, and peak mental performance.', color: 'from-cognition/20 to-cognition/5', icon: '🧠', tagline: 'Think Sharper' },
  sleep: { title: 'Sleep & Recovery', description: 'Master sleep, stress management, and active recovery for sustainable performance.', color: 'from-recovery/20 to-recovery/5', icon: '💤', tagline: 'Rest Better' },
  nutrition: { title: 'Nutrition & Fueling', description: 'Nutrition strategies for energy, longevity, and metabolic health.', color: 'from-fueling/20 to-fueling/5', icon: '🥗', tagline: 'Eat Smarter' },
  mind: { title: 'Mind & Mental Health', description: 'Build resilience, emotional intelligence, and psychological strength.', color: 'from-mental/20 to-mental/5', icon: '🧘', tagline: 'Feel Stronger' },
  exercise: { title: 'Exercise & Physicality', description: 'Training, movement, and body optimization for functional longevity.', color: 'from-physicality/20 to-physicality/5', icon: '💪', tagline: 'Move Better' },
  finance: { title: 'Finance & Wealth', description: 'Financial independence, passive income, and wealth-building strategies.', color: 'from-finance/20 to-finance/5', icon: '💰', tagline: 'Build Wealth' },
}

interface PageProps {
  params: Promise<{ pillar: string }>
}

export async function generateStaticParams() {
  return VALID_PILLARS.map((pillar) => ({ pillar }))
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

  let articles: Awaited<ReturnType<typeof prisma.knowledgeArticle.findMany<{ select: { id: true; title: true; description: true; tags: true; author: true; readTime: true; url: true; publishedAt: true; slug: true } }>>> = []
  try {
    articles = await prisma.knowledgeArticle.findMany({
      where: { pillar },
      select: { id: true, title: true, description: true, tags: true, author: true, readTime: true, url: true, publishedAt: true, slug: true },
      orderBy: { publishedAt: 'desc' },
    })
  } catch {
    // Database unavailable — render empty state
  }

  const totalReadTime = articles.reduce((sum, a) => sum + a.readTime, 0)
  const otherPillars = VALID_PILLARS.filter(p => p !== pillar).map(p => ({ id: p, config: pillarConfig[p] }))

  return (
    <div className="min-h-screen">
      <section className={`relative py-20 bg-gradient-to-br ${config.color}`}>
        <div className="container mx-auto px-4">
          <MotionContainer className="max-w-4xl mx-auto text-center space-y-6">
            <MotionItem>
              <MotionLoop className="text-6xl mb-4 inline-block" type="pulse">
                {config.icon}
              </MotionLoop>
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
                { value: articles.length, label: 'Articles' },
                { value: totalReadTime, label: 'Min Read' },
                { value: 'Free', label: 'Always' },
              ]}
            />
          </MotionContainer>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <MotionSection>
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
            </MotionSection>

            {articles.length === 0 ? (
              <MotionSection delay={0.1}>
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No articles yet in this pillar. Check back soon!</p>
                  </CardContent>
                </Card>
              </MotionSection>
            ) : (
              <AnimatedArticleGrid articles={articles} pillar={pillar} icon={config.icon} />
            )}
          </div>
        </div>
      </section>

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
