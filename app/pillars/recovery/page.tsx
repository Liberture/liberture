import type { Metadata } from 'next';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export const metadata: Metadata = {
  title: 'Sleep Optimization Recovery & Sleep Optimization Recovery | Liberture',
  description: 'Master rest and recovery with science-backed strategies for deep sleep, nervous system regulation, and accelerated healing. Biohack your way to peak performance through optimal recovery.',
  keywords: 'recovery, sleep optimization, rest, nervous system, healing, red light therapy, cold therapy, massage, regeneration',
};

export default async function RecoveryPillarPage() {
  const articles = await prisma.knowledgeArticle.findMany({
    where: { pillar: 'recovery' },
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
          <Link href="/directory" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            ← Back to Directory
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Recovery & Regeneration
          </h1>
          <p className="text-xl text-white/70 max-w-3xl">
            Peak performance demands peak recovery. Master sleep, rest, and regeneration to unlock superhuman resilience.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-16">
          <div className="prose prose-invert prose-blue max-w-none">
            <h2 className="text-3xl font-bold mb-6">Why Recovery is Performance</h2>
            <p className="text-lg text-white/80 leading-relaxed mb-4">
              You don't grow in the gym—you grow in recovery. Whether you're training for strength, endurance, or cognitive performance, 
              adaptation happens during rest. Sleep isn't downtime; it's when your brain consolidates memories, your muscles rebuild stronger, 
              and your nervous system resets.
            </p>
            <p className="text-lg text-white/80 leading-relaxed mb-4">
              This pillar covers the full spectrum of recovery science: sleep architecture optimization, nervous system regulation, 
              therapeutic modalities (red light, cold exposure, massage), and strategic rest periods. We prioritize evidence-based protocols 
              that accelerate healing without compromising long-term health.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Key Areas of Focus</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Sleep Optimization',
                description: 'Deep sleep protocols, circadian rhythm hacks, sleep tech',
                icon: '😴'
              },
              {
                title: 'Cold & Heat Therapy',
                description: 'Ice baths, saunas, contrast therapy for recovery',
                icon: '🧊'
              },
              {
                title: 'Red Light Therapy',
                description: 'Photobiomodulation for healing, inflammation, mitochondria',
                icon: '🔴'
              },
              {
                title: 'Nervous System Regulation',
                description: 'Vagal tone, HRV optimization, parasympathetic activation',
                icon: '🧘'
              },
              {
                title: 'Massage & Bodywork',
                description: 'Tissue recovery, fascia release, lymphatic drainage',
                icon: '💆'
              },
              {
                title: 'Active Recovery',
                description: 'Zone 1 cardio, mobility work, regeneration protocols',
                icon: '🚶'
              }
            ].map((topic) => (
              <div key={topic.title} className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-blue-400/50 transition-colors">
                <div className="text-4xl mb-3">{topic.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{topic.title}</h3>
                <p className="text-white/70">{topic.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">
            Latest Articles <span className="text-blue-400">({articles.length})</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/knowledge/${article.slug}`}
                className="group p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-blue-400 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs text-blue-400 font-medium">
                    {article.readTime} min read
                  </span>
                  <span className="text-xs text-white/50">
                    {new Date(article.publishedAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
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
              { name: 'Cognition', slug: 'cognition', description: 'Brain optimization, focus, memory, nootropics', color: 'emerald' },
              { name: 'Physicality', slug: 'physicality', description: 'Training, strength, endurance, movement', color: 'red' },
              { name: 'Mental', slug: 'mental', description: 'Stress management, emotional regulation, mindfulness', color: 'purple' },
            ].map((pillar) => (
              <Link
                key={pillar.slug}
                href={`/pillars/${pillar.slug}`}
                className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-blue-400 transition-all hover:scale-[1.02]"
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
