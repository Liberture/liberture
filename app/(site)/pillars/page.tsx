import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { AnimatedPillarGrid } from '@/components/pillars'
import { IslandRidge, RippleBloom, VortexShell } from '@/components/patterns'
import { MotionContainer, MotionItem, MotionStats, MotionSection } from '@/components/animations'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The 6 Pillars of Human Optimization | Liberture',
  description: 'A comprehensive framework for human performance, longevity, and wellbeing. Explore Cognition, Recovery, Fueling, Mental, Physicality, and Finance pillars.',
  openGraph: {
    title: 'The 6 Pillars of Human Optimization | Liberture',
    description: 'A comprehensive framework for human performance across Cognition, Recovery, Fueling, Mental, Physicality, and Finance.',
    url: 'https://liberture.com/pillars',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The 6 Pillars of Human Optimization | Liberture',
    description: 'A comprehensive framework for human performance and longevity.',
  },
}

const PILLARS = [
  { name: 'Work', slug: 'work', tagline: 'Think Sharper', description: 'Optimize productivity, flow states, work environment, and professional performance for meaningful achievement.', color: 'from-work/20 to-work/5 hover:from-work/30 hover:to-work/10', borderColor: 'border-work/30' },
  { name: 'Sleep', slug: 'sleep', tagline: 'Rest Better', description: 'Master sleep architecture, circadian rhythm, and recovery protocols to maximize restoration and longevity.', color: 'from-sleep/20 to-sleep/5 hover:from-sleep/30 hover:to-sleep/10', borderColor: 'border-sleep/30' },
  { name: 'Nutrition', slug: 'nutrition', tagline: 'Eat Smarter', description: 'Optimize digestion, microbiome, macros, and supplementation for peak energy and metabolic health.', color: 'from-nutrition/20 to-nutrition/5 hover:from-nutrition/30 hover:to-nutrition/10', borderColor: 'border-nutrition/30' },
  { name: 'Mind', slug: 'mind', tagline: 'Feel Stronger', description: 'Enhance brain function, neurotransmitters, nootropics, and mental resilience for cognitive excellence.', color: 'from-mind/20 to-mind/5 hover:from-mind/30 hover:to-mind/10', borderColor: 'border-mind/30' },
  { name: 'Exercise', slug: 'exercise', tagline: 'Move Better', description: 'Build strength, cardiovascular capacity, mobility, and athletic performance through evidence-based training.', color: 'from-exercise/20 to-exercise/5 hover:from-exercise/30 hover:to-exercise/10', borderColor: 'border-exercise/30' },
  { name: 'Finance', slug: 'finance', tagline: 'Build Wealth', description: 'Master wealth creation, financial independence, and resource optimization for life freedom.', color: 'from-finance/20 to-finance/5 hover:from-finance/30 hover:to-finance/10', borderColor: 'border-finance/30' },
] as const

export default async function PillarsPage() {
  let countMap: Record<string, number> = {}
  let totalItems = 0
  try {
    const pillars = ['work', 'sleep', 'nutrition', 'mind', 'exercise', 'finance']
    const counts = await Promise.all(pillars.map(async (p) => {
      const [articles, people, books, orgs, protocols] = await Promise.all([
        prisma.article.count({ where: { pillar: p } }),
        prisma.person.count({ where: { pillars: { contains: p } } }),
        prisma.book.count({ where: { pillars: { contains: p } } }),
        prisma.organization.count({ where: { pillars: { contains: p } } }),
        prisma.protocol.count({ where: { pillar: p, published: true } }),
      ])
      return { pillar: p, total: articles + people + books + orgs + protocols }
    }))
    countMap = Object.fromEntries(counts.map(({ pillar, total }) => [pillar, total]))
    totalItems = counts.reduce((sum, { total }) => sum + total, 0)
  } catch {
    // Database unavailable — render with zero counts
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-20 bg-gradient-to-br from-primary/10 to-background">
        <VortexShell
          placement="corner"
          gradient="plasma"
          size="500px"
          className="-right-20 -top-20"
          opacity={0.15}
        />
        <IslandRidge
          placement="corner"
          gradient="neon"
          size="340px"
          className="-left-24 bottom-0"
          opacity={0.12}
        />

        <div className="container relative mx-auto px-4">
          <MotionContainer className="max-w-4xl mx-auto text-center space-y-6">
            <MotionItem>
              <Badge variant="outline" className="text-sm">Your Biological Operating System</Badge>
            </MotionItem>
            <MotionItem delay={0.1}>
              <h1 className="text-5xl font-bold tracking-tight">The 6 Pillars of Optimization</h1>
            </MotionItem>
            <MotionItem delay={0.2}>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                A comprehensive framework for human performance, longevity, and wellbeing. Each pillar is backed by science and designed to work synergistically.
              </p>
            </MotionItem>
            <MotionStats
              className="flex items-center justify-center gap-8 pt-6"
              stats={[
                { value: totalItems, label: 'Total Resources' },
                { value: 6, label: 'Pillars' },
                { value: '100%', label: 'Free' },
              ]}
            />
          </MotionContainer>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <AnimatedPillarGrid pillars={PILLARS} countMap={countMap} />
          </div>
        </div>
      </section>

      <MotionSection delay={0.2}>
        <section className="relative overflow-hidden py-16 bg-muted/30">
          <RippleBloom
            placement="corner"
            gradient="plasma"
            size="380px"
            className="-left-20 bottom-0"
            opacity={0.12}
          />

          <div className="container relative mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-3xl font-bold">Start Your Optimization Journey</h2>
              <p className="text-muted-foreground">
                Choose a pillar that resonates with you, or explore them all. Every article is curated from trusted experts and backed by science.
              </p>
              <div className="flex items-center justify-center gap-4 pt-4">
                <Link href="/articles" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  Browse All Articles <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/directory" className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors">
                  Explore Directory
                </Link>
              </div>
            </div>
          </div>
        </section>
      </MotionSection>
    </div>
  )
}
