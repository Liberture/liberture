import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const articles = [
  {
    title: "Magnesium Glycinate for Sleep and Stress",
    description: "Why magnesium glycinate is the superior form for sleep quality, stress reduction, and why most people are deficient.",
    pillar: "Recovery",
    tags: "magnesium,sleep,stress-relief,supplements,mineral-deficiency",
    author: "Dr. Mark Hyman",
    readTime: 10,
    url: "https://drhyman.com/blog/2019/01/24/magnesium-the-most-powerful-relaxation-mineral-available/",
    publishedAt: new Date('2024-02-10'),
  },
  {
    title: "Testosterone Optimization Naturally",
    description: "Evidence-based strategies for optimizing testosterone through sleep, strength training, nutrition, and stress management.",
    pillar: "Physicality",
    tags: "testosterone,hormones,strength-training,sleep,stress-management",
    author: "Dr. Andrew Huberman",
    readTime: 20,
    url: "https://hubermanlab.com/optimize-your-hormones-for-health-and-vitality/",
    publishedAt: new Date('2024-01-29'),
  },
  {
    title: "Stoicism for Modern Life",
    description: "Practical applications of Stoic philosophy for resilience, emotional regulation, and navigating uncertainty in the 21st century.",
    pillar: "Mental",
    tags: "stoicism,philosophy,resilience,emotional-regulation,mindset",
    author: "Ryan Holiday",
    readTime: 14,
    url: "https://dailystoic.com/what-is-stoicism-a-definition-3-stoic-exercises-to-get-you-started/",
    publishedAt: new Date('2024-02-04'),
  },
  {
    title: "L-Theanine and Alpha Brain Waves",
    description: "How L-theanine from green tea promotes relaxed focus, enhances alpha brain waves, and synergizes with caffeine.",
    pillar: "Cognition",
    tags: "l-theanine,nootropics,focus,alpha-waves,green-tea,caffeine",
    author: "Examine.com",
    readTime: 12,
    url: "https://examine.com/supplements/theanine/",
    publishedAt: new Date('2024-02-03'),
  },
  {
    title: "Geographic Arbitrage for Financial Freedom",
    description: "Earning first-world income while living in low-cost locations—strategy, logistics, and tax implications.",
    pillar: "Finance",
    tags: "geographic-arbitrage,digital-nomad,cost-of-living,remote-work,fire",
    author: "Tim Ferriss",
    readTime: 16,
    url: "https://tim.blog/2022/02/01/geoarbitrage/",
    publishedAt: new Date('2024-01-27'),
  },
];

async function main() {
  console.log('Adding overnight batch 8 - Final push to 50 articles!...\n')
  
  let added = 0;
  let skipped = 0;
  
  for (const article of articles) {
    const existing = await prisma.knowledgeArticle.findFirst({
      where: { title: article.title }
    })
    
    if (existing) {
      console.log(`⏭️  Skipped: ${article.title} (already exists)`)
      skipped++;
      continue
    }
    
    const slug = article.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    const created = await prisma.knowledgeArticle.create({
      data: {
        id: `knowledge-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        ...article,
        slug,
        updatedAt: new Date(),
      }
    })
    
    console.log(`✅ Added: ${created.title}`)
    added++;
  }
  
  console.log(`\n✨ Complete! Added: ${added}, Skipped: ${skipped}`)
  console.log(`🎉 MILESTONE: ${45 + added} total knowledge articles!`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
