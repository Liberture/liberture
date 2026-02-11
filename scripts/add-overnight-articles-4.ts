import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const articles = [
  {
    title: "Polyphenols and Gut Microbiome Health",
    description: "How plant polyphenols feed beneficial gut bacteria, reduce inflammation, and support metabolic health through the gut-brain axis.",
    pillar: "Fueling",
    tags: "polyphenols,gut-health,microbiome,inflammation,plant-compounds",
    author: "Dr. Will Bulsiewicz",
    readTime: 15,
    url: "https://www.theplantfedgut.com/blog/polyphenols",
    publishedAt: new Date('2024-02-02'),
  },
  {
    title: "Building Mental Resilience Through Cold Exposure",
    description: "Psychological mechanisms of cold adaptation: stress inoculation, vagal tone improvement, and developing comfort with discomfort.",
    pillar: "Mental",
    tags: "cold-exposure,resilience,stress-management,vagal-tone,psychological-adaptation",
    author: "Wim Hof Institute",
    readTime: 10,
    url: "https://www.wimhofmethod.com/practice-the-method",
    publishedAt: new Date('2024-01-19'),
  },
  {
    title: "High-Intensity Interval Training: The Science of Time-Efficient Fitness",
    description: "HIIT protocols for maximum cardiovascular and metabolic benefits in minimal time—research-backed approaches to interval design.",
    pillar: "Physicality",
    tags: "hiit,cardio,time-efficient,metabolic-health,interval-training",
    author: "Martin Gibala PhD",
    readTime: 14,
    url: "https://www.mcmasteroptimalaging.org/hiit-research",
    publishedAt: new Date('2024-01-24'),
  },
  {
    title: "Vitamin D: Dosing, Testing, and Optimization",
    description: "Evidence-based guide to vitamin D supplementation including optimal blood levels, testing protocols, and co-factor requirements.",
    pillar: "Fueling",
    tags: "vitamin-d,supplementation,hormones,immune-system,bone-health",
    author: "Dr. Rhonda Patrick",
    readTime: 18,
    url: "https://www.foundmyfitness.com/topics/vitamin-d",
    publishedAt: new Date('2024-01-31'),
  },
];

async function main() {
  console.log('Adding overnight batch 4 of knowledge articles...\n')
  
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
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
