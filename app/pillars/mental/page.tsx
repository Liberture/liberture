import type { Metadata } from 'next';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export const metadata: Metadata = {
  title: 'Mental Health & Emotional Optimization | Liberture',
  description: 'Master stress management, emotional regulation, and mindfulness. Science-backed strategies for resilience, mental clarity, and psychological wellbeing.',
  keywords: 'mental health, stress management, meditation, mindfulness, emotional regulation, therapy, resilience, psychology',
};

export default async function MentalPillarPage() {
  const articles = await prisma.knowledgeArticle.findMany({
    where: { pillar: 'Mental' },
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
          <Link href="/directory" className="text-purple-400 hover:text-purple-300 text-sm mb-4 inline-block">
            ← Back to Directory
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Mental Health & Resilience
          </h1>
          <p className="text-xl text-white/70 max-w-3xl">
            Build unshakeable mental resilience. Master stress, regulate emotions, and cultivate psychological wellbeing through evidence-based practices.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-16">
          <div className="prose prose-invert prose-purple max-w-none">
            <h2 className="text-3xl font-bold mb-6">Why Mental Health is Everything</h2>
            <p className="text-lg text-white/80 leading-relaxed mb-4">
              No amount of physical optimization matters if your mind is struggling. Mental health isn't separate from physical health—it's foundational. 
              Chronic stress destroys performance, disrupts hormones, impairs cognition, and accelerates aging. Conversely, emotional regulation, 
              stress resilience, and psychological wellbeing amplify every other area of human performance.
            </p>
            <p className="text-lg text-white/80 leading-relaxed mb-4">
              This pillar covers the full spectrum of mental optimization: stress management techniques, meditation and mindfulness practices, 
              therapeutic modalities (CBT, ACT, IFS), emotional regulation strategies, and tools for building unshakeable resilience. 
              We focus on practical, evidence-based approaches that deliver real results.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Key Areas of Focus</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Stress Management',
                description: 'Tools to reduce cortisol, manage anxiety, build resilience',
                icon: '🧘'
              },
              {
                title: 'Meditation & Mindfulness',
                description: 'Practices for presence, awareness, mental clarity',
                icon: '🧠'
              },
              {
                title: 'Emotional Regulation',
                description: 'Process emotions, reduce reactivity, cultivate equanimity',
                icon: '💭'
              },
              {
                title: 'Therapy & Healing',
                description: 'Evidence-based modalities: CBT, ACT, IFS, EMDR',
                icon: '🩹'
              },
              {
                title: 'Journaling & Reflection',
                description: 'Self-awareness, processing, perspective-shifting',
                icon: '📝'
              },
              {
                title: 'Connection & Community',
                description: 'Relationships, support systems, meaningful connection',
                icon: '🤝'
              }
            ].map((topic) => (
              <div key={topic.title} className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-purple-400/50 transition-colors">
                <div className="text-4xl mb-3">{topic.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{topic.title}</h3>
                <p className="text-white/70">{topic.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">
            Latest Articles <span className="text-purple-400">({articles.length})</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/knowledge/${article.slug}`}
                className="group p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-purple-400 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs text-purple-400 font-medium">
                    {article.readTime} min read
                  </span>
                  <span className="text-xs text-white/50">
                    {new Date(article.publishedAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors">
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
              { name: 'Cognition', slug: 'cognition', description: 'Brain optimization, focus, memory, learning', color: 'emerald' },
              { name: 'Recovery', slug: 'recovery', description: 'Sleep, rest, nervous system regulation', color: 'blue' },
              { name: 'Finance', slug: 'finance', description: 'Financial independence, wealth building, security', color: 'yellow' },
            ].map((pillar) => (
              <Link
                key={pillar.slug}
                href={`/pillars/${pillar.slug}`}
                className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-purple-400 transition-all hover:scale-[1.02]"
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
