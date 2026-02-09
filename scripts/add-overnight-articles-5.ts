import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const articles = [
  {
    title: "NAD+ Precursors: NMN vs NR for Longevity",
    description: "Comparing nicotinamide mononucleotide (NMN) and nicotinamide riboside (NR) for NAD+ boosting, cellular energy, and aging intervention.",
    pillar: "Cognition",
    tags: "nad,nmn,nr,longevity,anti-aging,mitochondria",
    author: "David Sinclair PhD",
    readTime: 16,
    url: "https://www.lifespan.io/topic/nmn/",
    publishedAt: new Date('2024-02-08'),
  },
  {
    title: "Contrast Therapy: Hot-Cold Protocol for Recovery",
    description: "Evidence for alternating heat and cold exposure to enhance circulation, reduce inflammation, and accelerate recovery from training.",
    pillar: "Recovery",
    tags: "contrast-therapy,sauna,cold-plunge,recovery,circulation,inflammation",
    author: "Dr. Rhonda Patrick",
    readTime: 13,
    url: "https://www.foundmyfitness.com/topics/hyperthermic-conditioning",
    publishedAt: new Date('2024-01-27'),
  },
  {
    title: "Compound Lifts for Muscle and Metabolic Health",
    description: "Why squat, deadlift, bench, and overhead press form the foundation of functional strength and metabolic conditioning.",
    pillar: "Physicality",
    tags: "strength-training,compound-lifts,squats,deadlifts,muscle-building",
    author: "Mark Rippetoe",
    readTime: 15,
    url: "https://startingstrength.com/article/barbell-training-is-big-medicine",
    publishedAt: new Date('2024-01-18'),
  },
  {
    title: "Cognitive Behavioral Therapy: Evidence-Based Mental Training",
    description: "How CBT rewires thought patterns, breaks negative cycles, and provides practical tools for anxiety and depression management.",
    pillar: "Mental",
    tags: "cbt,therapy,mental-health,anxiety,depression,cognitive-training",
    author: "Cognitive Behavioral Therapy Society",
    readTime: 18,
    url: "https://www.apa.org/ptsd-guideline/patients-and-families/cognitive-behavioral",
    publishedAt: new Date('2024-02-09'),
  },
  {
    title: "Index Investing vs Stock Picking: The Math",
    description: "Why passive index investing outperforms 90% of active managers over 15+ years, with evidence from the S&P 500.",
    pillar: "Finance",
    tags: "index-funds,passive-investing,stock-market,fire,long-term-wealth",
    author: "John Bogle",
    readTime: 14,
    url: "https://www.investopedia.com/articles/investing/030916/buffetts-bet-hedge-funds-year-eight-brka-brkb.asp",
    publishedAt: new Date('2024-01-29'),
  },
  {
    title: "Fiber and Gut Health: The Microbiome Connection",
    description: "How dietary fiber feeds beneficial bacteria, produces short-chain fatty acids, and regulates metabolism and inflammation.",
    pillar: "Fueling",
    tags: "fiber,gut-health,microbiome,scfa,prebiotics,digestive-health",
    author: "Dr. Will Bulsiewicz",
    readTime: 12,
    url: "https://www.theplantfedgut.com/blog/fiber-gut-health",
    publishedAt: new Date('2024-02-07'),
  },
  {
    title: "Sleep Hygiene: The Non-Negotiables",
    description: "Core principles of optimal sleep environment: darkness, temperature, noise control, and consistent timing for circadian alignment.",
    pillar: "Recovery",
    tags: "sleep-hygiene,sleep-environment,circadian-rhythm,sleep-quality",
    author: "Matthew Walker PhD",
    readTime: 11,
    url: "https://www.sleepfoundation.org/sleep-hygiene",
    publishedAt: new Date('2024-02-05'),
  },
  {
    title: "Glycemic Index and Metabolic Health",
    description: "Understanding how different carbohydrates affect blood sugar, insulin response, and long-term metabolic health outcomes.",
    pillar: "Fueling",
    tags: "glycemic-index,blood-sugar,insulin,carbohydrates,metabolic-health",
    author: "Dr. David Ludwig",
    readTime: 17,
    url: "https://www.health.harvard.edu/diseases-and-conditions/glycemic-index-and-glycemic-load-for-100-foods",
    publishedAt: new Date('2024-01-21'),
  },
];

async function main() {
  console.log('Adding overnight batch 5 of knowledge articles...\n')
  
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
  console.log(`📊 Running total: ${23 + added} articles`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
