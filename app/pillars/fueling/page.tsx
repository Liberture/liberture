import type { Metadata } from 'next';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export const metadata: Metadata = {
  title: 'Nutrition & Metabolic Optimization | Liberture',
  description: 'Master nutrition, supplementation, and metabolic flexibility. Science-backed strategies for energy, longevity, and peak performance through optimal fueling.',
  keywords: 'nutrition, supplements, metabolic flexibility, keto, fasting, vitamins, minerals, metabolic health, longevity',
};

export default async function FuelingPillarPage() {
  const articles = await prisma.knowledgeArticle.findMany({
    where: { pillar: 'Fueling' },
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
          <Link href="/directory" className="text-orange-400 hover:text-orange-300 text-sm mb-4 inline-block">
            ← Back to Directory
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
            Fueling & Metabolic Optimization
          </h1>
          <p className="text-xl text-white/70 max-w-3xl">
            Your body is a high-performance machine. Master nutrition, supplementation, and metabolic flexibility to unlock sustained energy and longevity.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-16">
          <div className="prose prose-invert prose-orange max-w-none">
            <h2 className="text-3xl font-bold mb-6">Why Nutrition is the Foundation</h2>
            <p className="text-lg text-white/80 leading-relaxed mb-4">
              You are what you eat—literally. Every cell in your body is built from the nutrients you consume. Optimal nutrition isn't about restriction or deprivation; 
              it's about strategic fueling that supports energy, performance, recovery, and longevity. From macronutrient timing to micronutrient optimization, 
              metabolic flexibility to targeted supplementation, this pillar covers the science of eating for peak human performance.
            </p>
            <p className="text-lg text-white/80 leading-relaxed mb-4">
              We focus on sustainable, evidence-based approaches that enhance metabolic health, reduce inflammation, optimize hormones, and extend healthspan. 
              No fads, no dogma—just practical nutrition science that works.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Key Areas of Focus</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Strategic Supplementation',
                description: 'Vitamins, minerals, adaptogens—fill the gaps, optimize performance',
                icon: '💊'
              },
              {
                title: 'Metabolic Flexibility',
                description: 'Fat adaptation, ketosis, insulin sensitivity, metabolic health',
                icon: '🔥'
              },
              {
                title: 'Intermittent Fasting',
                description: 'Time-restricted eating, autophagy, longevity protocols',
                icon: '⏱️'
              },
              {
                title: 'Micronutrient Optimization',
                description: 'Vitamins, minerals, phytonutrients for cellular health',
                icon: '🌿'
              },
              {
                title: 'Anti-Inflammatory Nutrition',
                description: 'Foods that reduce inflammation and support recovery',
                icon: '🥬'
              },
              {
                title: 'Gut Health',
                description: 'Microbiome optimization, digestion, nutrient absorption',
                icon: '🦠'
              }
            ].map((topic) => (
              <div key={topic.title} className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-orange-400/50 transition-colors">
                <div className="text-4xl mb-3">{topic.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{topic.title}</h3>
                <p className="text-white/70">{topic.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">
            Latest Articles <span className="text-orange-400">({articles.length})</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/knowledge/${article.slug}`}
                className="group p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-orange-400 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs text-orange-400 font-medium">
                    {article.readTime} min read
                  </span>
                  <span className="text-xs text-white/50">
                    {new Date(article.publishedAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-orange-400 transition-colors">
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
              { name: 'Recovery', slug: 'recovery', description: 'Sleep optimization, rest, regeneration', color: 'blue' },
              { name: 'Physicality', slug: 'physicality', description: 'Training, strength, endurance, movement', color: 'red' },
              { name: 'Cognition', slug: 'cognition', description: 'Brain optimization, focus, memory', color: 'emerald' },
            ].map((pillar) => (
              <Link
                key={pillar.slug}
                href={`/pillars/${pillar.slug}`}
                className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-orange-400 transition-all hover:scale-[1.02]"
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
