import type { Metadata } from 'next';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export const metadata: Metadata = {
  title: 'Cognitive Enhancement & Brain Optimization | Liberture',
  description: 'Master your mind with science-backed strategies for focus, memory, learning, and mental performance. Explore nootropics, brain training, and cognitive biohacking.',
  keywords: 'cognitive enhancement, nootropics, brain optimization, focus, memory, learning, mental performance, biohacking',
};

export default async function CognitionPillarPage() {
  // Fetch all cognition articles
  const articles = await prisma.knowledgeArticle.findMany({
    where: { pillar: 'Cognition' },
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
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/directory" className="text-emerald-400 hover:text-emerald-300 text-sm mb-4 inline-block">
            ← Back to Directory
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Cognitive Enhancement
          </h1>
          <p className="text-xl text-white/70 max-w-3xl">
            Master your mind with science-backed strategies for focus, memory, learning, and peak mental performance.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Introduction */}
        <section className="mb-16">
          <div className="prose prose-invert prose-emerald max-w-none">
            <h2 className="text-3xl font-bold mb-6">Why Cognitive Optimization Matters</h2>
            <p className="text-lg text-white/80 leading-relaxed mb-4">
              Your brain is your most valuable asset. In a world demanding constant focus, creativity, and problem-solving, 
              optimizing cognitive performance isn't optional—it's essential. Whether you're a founder building a startup, 
              a student mastering new subjects, or a professional seeking peak productivity, cognitive biohacking provides 
              the tools to unlock your mental potential.
            </p>
            <p className="text-lg text-white/80 leading-relaxed mb-4">
              From evidence-based nootropics and strategic supplementation to training protocols and lifestyle interventions, 
              this pillar covers the full spectrum of cognitive enhancement. We focus on sustainable, science-backed approaches 
              that deliver real results without compromising long-term brain health.
            </p>
          </div>
        </section>

        {/* Key Topics */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Key Areas of Focus</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Nootropics & Supplements',
                description: 'Evidence-based cognitive enhancers, from adaptogens to synthetic compounds',
                icon: '💊'
              },
              {
                title: 'Focus & Attention',
                description: 'Strategies to eliminate distraction and enter deep work states',
                icon: '🎯'
              },
              {
                title: 'Memory & Learning',
                description: 'Techniques for faster learning, better retention, and recall',
                icon: '🧠'
              },
              {
                title: 'Brain Nutrition',
                description: 'Foods, fats, and nutrients that fuel cognitive performance',
                icon: '🥗'
              },
              {
                title: 'Mental Clarity',
                description: 'Reduce brain fog, improve processing speed, sharpen thinking',
                icon: '✨'
              },
              {
                title: 'Cognitive Longevity',
                description: 'Protect your brain from aging and neurodegeneration',
                icon: '🧬'
              }
            ].map((topic) => (
              <div key={topic.title} className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-emerald-400/50 transition-colors">
                <div className="text-4xl mb-3">{topic.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{topic.title}</h3>
                <p className="text-white/70">{topic.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Articles */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">
            Latest Articles <span className="text-emerald-400">({articles.length})</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/knowledge/${article.slug}`}
                className="group p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-emerald-400 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs text-emerald-400 font-medium">
                    {article.readTime} min read
                  </span>
                  <span className="text-xs text-white/50">
                    {new Date(article.publishedAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-emerald-400 transition-colors">
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

        {/* Related Pillars */}
        <section>
          <h2 className="text-3xl font-bold mb-8">Explore Related Pillars</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Mental', slug: 'mental', description: 'Stress management, emotional regulation, meditation', color: 'purple' },
              { name: 'Recovery', slug: 'recovery', description: 'Sleep optimization, rest, nervous system regulation', color: 'blue' },
              { name: 'Fueling', slug: 'fueling', description: 'Nutrition, supplements, metabolic optimization', color: 'orange' },
            ].map((pillar) => (
              <Link
                key={pillar.slug}
                href={`/pillars/${pillar.slug}`}
                className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-emerald-400 transition-all hover:scale-[1.02]"
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
