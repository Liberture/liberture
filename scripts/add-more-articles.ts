import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const articles = [
  {
    title: "Intermittent Fasting: Complete Guide",
    description: "Science-backed protocols for time-restricted eating, fasting windows, and metabolic benefits from autophagy to insulin sensitivity.",
    pillar: "Fueling",
    tags: "fasting,intermittent-fasting,autophagy,metabolism,insulin",
    author: "Dr. Jason Fung",
    readTime: 12,
    url: "https://www.dietdoctor.com/intermittent-fasting",
    publishedAt: new Date('2024-01-10'),
  },
  {
    title: "Meditation for Beginners",
    description: "Step-by-step guide to starting a meditation practice, understanding different techniques, and building consistency.",
    pillar: "Mental",
    tags: "meditation,mindfulness,mental-health,stress-reduction",
    author: "Headspace Research",
    readTime: 8,
    url: "https://www.headspace.com/meditation-101",
    publishedAt: new Date('2023-12-05'),
  },
  {
    title: "Strength Training Fundamentals",
    description: "Progressive overload, compound movements, and evidence-based programming for building strength and muscle mass.",
    pillar: "Physicality",
    tags: "strength-training,resistance-training,hypertrophy,progressive-overload",
    author: "Starting Strength",
    readTime: 15,
    url: "https://startingstrength.com/article/fundamentals",
    publishedAt: new Date('2024-02-01'),
  },
  {
    title: "Vitamin D Optimization",
    description: "Understanding vitamin D deficiency, optimal blood levels, supplementation strategies, and co-factors for absorption.",
    pillar: "Cognition",
    tags: "vitamin-d,supplements,deficiency,immune-system",
    author: "Vitamin D Council",
    readTime: 10,
    url: "https://www.vitamindcouncil.org/about-vitamin-d/",
    publishedAt: new Date('2023-11-20'),
  },
  {
    title: "Building an Emergency Fund",
    description: "Financial security fundamentals: how much to save, where to keep it, and when to use it for true financial independence.",
    pillar: "Finance",
    tags: "emergency-fund,savings,financial-planning,budgeting",
    author: "Dave Ramsey",
    readTime: 7,
    url: "https://www.ramseysolutions.com/dave-ramsey-7-baby-steps/emergency-fund",
    publishedAt: new Date('2024-01-15'),
  },
  {
    title: "Sauna Therapy Benefits",
    description: "Heat exposure effects on cardiovascular health, detoxification, growth hormone release, and longevity markers.",
    pillar: "Recovery",
    tags: "sauna,heat-therapy,cardiovascular,detox,hormesis",
    author: "Dr. Rhonda Patrick",
    readTime: 11,
    url: "https://www.foundmyfitness.com/topics/sauna",
    publishedAt: new Date('2023-10-25'),
  },
  {
    title: "Magnesium: The Master Mineral",
    description: "Magnesium's role in 300+ biochemical reactions, deficiency symptoms, best forms for supplementation, and optimal dosing.",
    pillar: "Cognition",
    tags: "magnesium,supplements,minerals,sleep,recovery",
    author: "Examine.com",
    readTime: 9,
    url: "https://examine.com/supplements/magnesium/",
    publishedAt: new Date('2024-01-25'),
  },
  {
    title: "Zone 2 Cardio Training",
    description: "Low-intensity aerobic training for mitochondrial health, fat oxidation, and aerobic base building with heart rate targets.",
    pillar: "Physicality",
    tags: "zone-2,cardio,aerobic-training,mitochondria,endurance",
    author: "Dr. Peter Attia",
    readTime: 13,
    url: "https://peterattiamd.com/zone-2-training/",
    publishedAt: new Date('2023-12-15'),
  },
  {
    title: "Journaling for Mental Clarity",
    description: "Evidence-based journaling techniques for processing emotions, reducing stress, and improving mental health outcomes.",
    pillar: "Mental",
    tags: "journaling,mental-health,self-reflection,therapy,stress",
    author: "Tim Ferriss",
    readTime: 6,
    url: "https://tim.blog/morning-pages/",
    publishedAt: new Date('2023-11-10'),
  },
  {
    title: "Index Fund Investing Basics",
    description: "Passive investing strategy for long-term wealth building through low-cost index funds and compound growth.",
    pillar: "Finance",
    tags: "investing,index-funds,passive-investing,stocks,wealth",
    author: "Bogleheads Wiki",
    readTime: 14,
    url: "https://www.bogleheads.org/wiki/Getting_started",
    publishedAt: new Date('2024-02-10'),
  },
];

async function main() {
  console.log('Adding more knowledge articles...')
  
  for (const article of articles) {
    const existing = await prisma.knowledgeArticle.findFirst({
      where: { title: article.title }
    })
    
    if (existing) {
      console.log(`⏭️  Skipped: ${article.title} (already exists)`)
      continue
    }
    
    await prisma.knowledgeArticle.create({
      data: article,
    })
    console.log(`✅ Added: ${article.title}`)
  }
  
  const total = await prisma.knowledgeArticle.count()
  console.log(`\n✅ Database now has ${total} knowledge articles!`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
