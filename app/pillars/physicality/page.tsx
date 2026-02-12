import type { Metadata } from 'next';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export const metadata: Metadata = {
  title: 'Training & Physical Optimization | Liberture',
  description: 'Master strength, endurance, mobility, and movement. Science-backed training protocols for peak physical performance and longevity.',
  keywords: 'training, strength, endurance, mobility, movement, exercise, zone 2, resistance training, cardio, fitness',
};

export default async function PhysicalityPillarPage() {
  const articles = await prisma.knowledgeArticle.findMany({
    where: { pillar: 'Physicality' },
    orderBy: { viewCount: 'desc' },
    select: {
      slug: true,
      title: true,
      description: true,
      readTime: true,
      tags: true,
      publishedAt: true,
    }
  });

  await prisma.$disconnect();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/directory" className="text-red-400 hover:text-red-300 text-sm mb-4 inline-block">
            ← Back to Directory
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Training & Movement
          </h1>
          <p className="text-xl text-white/70 max-w-3xl">
            Build superhuman strength, endurance, and mobility. Master training protocols that optimize performance and extend healthspan.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-16">
          <div className="prose prose-invert prose-red max-w-none">
            <h2 className="text-3xl font-bold mb-6">Why Training is Non-Negotiable</h2>
            <p className="text-lg text-white/80 leading-relaxed mb-4">
              Your body adapts to the stress you place on it. Without deliberate physical challenge, you atrophy—muscles weaken, bones thin, 
              mitochondria decline, metabolic health deteriorates. Training isn't about aesthetics; it's about maintaining the physical capacity 
              to live life on your terms well into old age. Strength preserves independence. Cardiovascular fitness extends lifespan. Mobility prevents injury.
            </p>
            <p className="text-lg text-white/80 leading-relaxed mb-4">
              This pillar covers the full spectrum of physical optimization: resistance training for strength and muscle, Zone 2 cardio for metabolic health, 
              mobility work for injury prevention, movement quality for longevity. We prioritize sustainable, evidence-based protocols that build 
              resilient, capable bodies without burnout.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Key Areas of Focus</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Strength Training',
                description: 'Resistance protocols for muscle, bone density, metabolic health',
                icon: '💪'
              },
              {
                title: 'Zone 2 Cardio',
                description: 'Aerobic base building, fat adaptation, mitochondrial health',
                icon: '🏃'
              },
              {
                title: 'Mobility & Flexibility',
                description: 'Joint health, range of motion, injury prevention',
                icon: '🤸'
              },
              {
                title: 'Movement Quality',
                description: 'Functional patterns, biomechanics, longevity movement',
                icon: '🧘'
              },
              {
                title: 'Athletic Performance',
                description: 'Power, speed, agility, sport-specific training',
                icon: '⚡'
              },
              {
                title: 'Recovery Protocols',
                description: 'Active recovery, deload weeks, periodization',
                icon: '🔄'
              }
            ].map((topic) => (
              <div key={topic.title} className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-red-400/50 transition-colors">
                <div className="text-4xl mb-3">{topic.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{topic.title}</h3>
                <p className="text-white/70">{topic.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">
            Latest Articles <span className="text-red-400">({articles.length})</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/knowledge/${article.slug}`}
                className="group p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-red-400 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs text-red-400 font-medium">
                    {article.readTime} min read
                  </span>
                  <span className="text-xs text-white/50">
                    {new Date(article.publishedAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-red-400 transition-colors">
                  {article.title}
                </h3>
                <p className="text-white/70 text-sm line-clamp-2 mb-3">
                  {article.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {article.tags.split(',').slice(0, 3).map((tag) => (
                    <span key={tag} className="text-xs px-2 py-1 rounded bg-white/5 text-white/60">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-8">Explore Related Pillars</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Recovery', slug: 'recovery', description: 'Sleep, rest, nervous system regulation, regeneration', color: 'blue' },
              { name: 'Fueling', slug: 'fueling', description: 'Nutrition, supplements, metabolic optimization', color: 'orange' },
              { name: 'Cognition', slug: 'cognition', description: 'Brain optimization, focus, memory', color: 'emerald' },
            ].map((pillar) => (
              <Link
                key={pillar.slug}
                href={`/pillars/${pillar.slug}`}
                className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-red-400 transition-all hover:scale-[1.02]"
              >
                <h3 className="text-xl font-semibold mb-2">{pillar.name}</h3>
                <p className="text-white/70 text-sm">{pillar.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
