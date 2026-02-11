import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const articles = [
  {
    title: "Grounding (Earthing): Science and Skepticism",
    description: "Examining the evidence for direct skin contact with Earth's surface, inflammation reduction claims, and what science actually supports.",
    pillar: "Recovery",
    tags: "grounding,earthing,inflammation,electron-transfer,alternative-health",
    author: "Dr. James Oschman",
    readTime: 14,
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3265077/",
    publishedAt: new Date('2024-02-03'),
  },
  {
    title: "Tracking HRV for Recovery and Readiness",
    description: "How heart rate variability reflects nervous system state, training readiness, and overall stress resilience—with practical measurement tips.",
    pillar: "Physicality",
    tags: "hrv,heart-rate-variability,recovery,nervous-system,training-readiness",
    author: "HRV4Training",
    readTime: 13,
    url: "https://www.hrv4training.com/blog/heart-rate-variability-hrv-what-is-it-and-why-does-it-matter",
    publishedAt: new Date('2024-02-04'),
  },
  {
    title: "Financial Independence Number: Calculate Your FI",
    description: "Step-by-step guide to calculating your financial independence number using the 4% rule and personal expenses.",
    pillar: "Finance",
    tags: "financial-independence,fire-number,retirement-planning,4-percent-rule",
    author: "Mr. Money Mustache",
    readTime: 10,
    url: "https://www.mrmoneymustache.com/2012/01/13/the-shockingly-simple-math-behind-early-retirement/",
    publishedAt: new Date('2024-01-25'),
  },
  {
    title: "Adaptogens: Stress Resilience Through Plants",
    description: "Evidence for ashwagandha, rhodiola, and other adaptogenic herbs in modulating cortisol, improving stress response, and enhancing resilience.",
    pillar: "Mental",
    tags: "adaptogens,ashwagandha,rhodiola,stress-management,herbal-medicine",
    author: "Examine.com",
    readTime: 15,
    url: "https://examine.com/supplements/ashwagandha/",
    publishedAt: new Date('2024-02-01'),
  },
  {
    title: "Circadian Fasting: Aligning Eating with Your Clock",
    description: "Time-restricted eating aligned with circadian rhythms for metabolic health, autophagy, and improved insulin sensitivity.",
    pillar: "Fueling",
    tags: "circadian-fasting,time-restricted-eating,circadian-rhythm,metabolism,autophagy",
    author: "Dr. Satchin Panda",
    readTime: 16,
    url: "https://www.salk.edu/news-release/how-when-you-eat-is-just-as-important/",
    publishedAt: new Date('2024-01-23'),
  },
];

async function main() {
  console.log('Adding overnight batch 6 of knowledge articles...\n')
  
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
  console.log(`📊 Running total: ${31 + added} articles`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
