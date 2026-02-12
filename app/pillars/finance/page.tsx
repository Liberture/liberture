import type { Metadata } from 'next';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export const metadata: Metadata = {
  title: 'Financial Independence & Wealth Building | Liberture',
  description: 'Master money, build wealth, achieve financial independence. Science-backed strategies for investing, passive income, and economic freedom.',
  keywords: 'financial independence, FIRE, investing, passive income, wealth building, personal finance, early retirement, money management',
};

export default async function FinancePillarPage() {
  const articles = await prisma.knowledgeArticle.findMany({
    where: { pillar: 'finance' },
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
          <Link href="/directory" className="text-yellow-400 hover:text-yellow-300 text-sm mb-4 inline-block">
            ← Back to Directory
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
            Financial Independence
          </h1>
          <p className="text-xl text-white/70 max-w-3xl">
            Build wealth, achieve financial freedom, and design a life on your terms. Master money to unlock time, autonomy, and optionality.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-16">
          <div className="prose prose-invert prose-yellow max-w-none">
            <h2 className="text-3xl font-bold mb-6">Why Financial Independence Matters</h2>
            <p className="text-lg text-white/80 leading-relaxed mb-4">
              Money doesn't buy happiness—but financial independence buys time, autonomy, and the freedom to pursue what matters most. 
              When you're not trading hours for dollars, you can focus on health, relationships, meaningful work, and personal growth. 
              Financial optimization isn't about accumulating wealth for its own sake; it's about building a foundation that supports 
              the life you want to live.
            </p>
            <p className="text-lg text-white/80 leading-relaxed mb-4">
              This pillar covers the full spectrum of financial optimization: investing strategies, passive income streams, the FIRE movement 
              (Financial Independence, Retire Early), tax optimization, and wealth preservation. We focus on practical, sustainable approaches 
              that build long-term security without sacrificing present-day quality of life.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Key Areas of Focus</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'FIRE Movement',
                description: 'Financial Independence, Retire Early—build wealth, quit the rat race',
                icon: '🔥'
              },
              {
                title: 'Investing Strategies',
                description: 'Index funds, real estate, diversification, long-term wealth',
                icon: '📈'
              },
              {
                title: 'Passive Income',
                description: 'Build income streams that don\'t require active work',
                icon: '💰'
              },
              {
                title: 'Tax Optimization',
                description: 'Legal strategies to minimize taxes, maximize wealth retention',
                icon: '🧾'
              },
              {
                title: 'Frugal Living',
                description: 'Maximize savings rate without sacrificing quality of life',
                icon: '🎯'
              },
              {
                title: 'Wealth Preservation',
                description: 'Protect assets, plan for long-term security, estate planning',
                icon: '🛡️'
              }
            ].map((topic) => (
              <div key={topic.title} className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-yellow-400/50 transition-colors">
                <div className="text-4xl mb-3">{topic.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{topic.title}</h3>
                <p className="text-white/70">{topic.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">
            Latest Articles <span className="text-yellow-400">({articles.length})</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/knowledge/${article.slug}`}
                className="group p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-yellow-400 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs text-yellow-400 font-medium">
                    {article.readTime} min read
                  </span>
                  <span className="text-xs text-white/50">
                    {new Date(article.publishedAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-yellow-400 transition-colors">
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
              { name: 'Mental', slug: 'mental', description: 'Stress management, emotional regulation, mindfulness', color: 'purple' },
              { name: 'Cognition', slug: 'cognition', description: 'Brain optimization, focus, memory, learning', color: 'emerald' },
              { name: 'Fueling', slug: 'fueling', description: 'Nutrition, supplements, metabolic health', color: 'orange' },
            ].map((pillar) => (
              <Link
                key={pillar.slug}
                href={`/pillars/${pillar.slug}`}
                className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-yellow-400 transition-all hover:scale-[1.02]"
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
