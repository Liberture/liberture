import type { Metadata } from 'next';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export const metadata: Metadata = {
  title: 'Work Optimization & Productivity | Liberture',
  description: 'Optimize your work environment, productivity, flow states, and professional performance with science-backed biohacking strategies.',
  keywords: 'productivity, work optimization, flow state, ergonomics, focus, deep work, professional performance, biohacking',
};

export default async function WorkPillarPage() {
  // Fetch all work-related articles
  const articles = await prisma.knowledgeArticle.findMany({
    where: { pillar: 'cognition' },
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
          <Link href="/directory" className="text-purple-400 hover:text-purple-300 text-sm mb-4 inline-block">
            ← Back to Directory
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Work Optimization
          </h1>
          <p className="text-xl text-white/70 max-w-3xl">
            Master productivity, flow states, work environment, and professional performance for meaningful achievement and sustainable success.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Introduction */}
        <section className="mb-16">
          <div className="prose prose-invert prose-purple max-w-none">
            <h2 className="text-3xl font-bold mb-6">Why Work Optimization Matters</h2>
            <p className="text-lg text-white/80 leading-relaxed mb-4">
              Your work is where you spend most of your waking hours. Optimizing how you work—your environment, routines, 
              energy management, and mental clarity—directly impacts your quality of life, professional success, and long-term fulfillment.
            </p>
            <p className="text-lg text-white/80 leading-relaxed mb-4">
              From achieving flow states and managing blood sugar for sustained focus to optimizing ergonomics and travel protocols, 
              this pillar covers evidence-based strategies to make your work more effective, enjoyable, and sustainable.
            </p>
          </div>
        </section>

        {/* Key Topics */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Key Areas of Focus</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Flow State Mastery',
                description: 'Enter deep focus states where productivity and creativity peak',
                icon: '🌊'
              },
              {
                title: 'Work Environment',
                description: 'Optimize lighting, air quality, ergonomics, and workspace design',
                icon: '🏢'
              },
              {
                title: 'Energy Management',
                description: 'Regulate blood sugar, caffeine, and energy cycles for peak performance',
                icon: '⚡'
              },
              {
                title: 'Focus & Deep Work',
                description: 'Eliminate distractions and build sustained attention capacity',
                icon: '🎯'
              },
              {
                title: 'Productivity Systems',
                description: 'Time blocking, GTD, Pomodoro, and other proven frameworks',
                icon: '📊'
              },
              {
                title: 'Travel Optimization',
                description: 'Manage jet lag, maintain routines, and stay productive on the road',
                icon: '✈️'
              },
            ].map((topic) => (
              <div
                key={topic.title}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-400/50 transition-all"
              >
                <div className="text-4xl mb-4">{topic.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{topic.title}</h3>
                <p className="text-white/60">{topic.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Articles */}
        <section>
          <h2 className="text-3xl font-bold mb-8">Latest Work Optimization Articles</h2>
          {articles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/knowledge/${article.slug}`}
                  className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-400/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-400/20 text-purple-300">
                      {article.readTime} min read
                    </span>
                    {article.publishedAt && (
                      <span className="text-xs text-white/40">
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-white/60 mb-4 line-clamp-3">{article.description}</p>
                  {article.tags && (
                    <div className="flex flex-wrap gap-2">
                      {article.tags.split(',').slice(0, 3).map((tag) => (
                        <span
                          key={tag.trim()}
                          className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/50"
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-white/40">
              <p className="text-lg mb-4">No articles yet for this pillar.</p>
              <p className="text-sm">Check back soon for work optimization content!</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
