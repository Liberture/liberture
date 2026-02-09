import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const articles = [
  {
    title: "Morning Sunlight Protocol for Circadian Optimization",
    description: "Science-backed guide to using natural light exposure within 30-60 minutes of waking to regulate cortisol, improve alertness, and optimize sleep-wake cycles.",
    pillar: "Recovery",
    tags: "circadian-rhythm,sunlight,cortisol,sleep,andrew-huberman",
    author: "Andrew Huberman Lab",
    readTime: 10,
    url: "https://hubermanlab.com/light-and-health/",
    publishedAt: new Date('2024-01-10'),
  },
  {
    title: "Magnesium Threonate for Cognitive Enhancement",
    description: "Deep dive into magnesium L-threonate's unique ability to cross the blood-brain barrier, enhancing memory, learning, and neuroprotection.",
    pillar: "Cognition",
    tags: "magnesium,nootropics,brain-health,memory,neuroprotection",
    author: "Examine.com",
    readTime: 12,
    url: "https://examine.com/supplements/magnesium-l-threonate/",
    publishedAt: new Date('2024-02-05'),
  },
  {
    title: "Zone 2 Training: The Metabolic Health Foundation",
    description: "How low-intensity aerobic training builds mitochondrial capacity, enhances fat oxidation, and serves as the foundation for longevity and metabolic health.",
    pillar: "Physicality",
    tags: "zone-2,cardio,mitochondria,fat-burning,longevity",
    author: "Peter Attia MD",
    readTime: 18,
    url: "https://peterattiamd.com/zone-2-training/",
    publishedAt: new Date('2023-11-20'),
  },
  {
    title: "Building a Resilient Mindset Through Voluntary Hardship",
    description: "Psychological strategies for embracing discomfort, developing antifragility, and using controlled stress exposure to build mental toughness.",
    pillar: "Mental",
    tags: "resilience,antifragility,hardship,stoicism,mental-toughness",
    author: "David Goggins",
    readTime: 14,
    url: "https://davidgoggins.com/mindset/",
    publishedAt: new Date('2024-01-05'),
  },
  {
    title: "Passive Income Foundations: Creating Digital Assets",
    description: "Practical guide to building income-generating digital products, online courses, and content that generates revenue while you sleep.",
    pillar: "Finance",
    tags: "passive-income,digital-products,online-business,financial-independence",
    author: "Pat Flynn",
    readTime: 16,
    url: "https://www.smartpassiveincome.com/guide/",
    publishedAt: new Date('2024-01-15'),
  },
  {
    title: "Omega-3 Dosing for Brain and Heart Health",
    description: "Evidence-based recommendations for EPA and DHA dosing, testing protocols, and choosing high-quality fish oil supplements.",
    pillar: "Fueling",
    tags: "omega-3,epa,dha,fish-oil,heart-health,brain-health",
    author: "Rhonda Patrick PhD",
    readTime: 11,
    url: "https://www.foundmyfitness.com/topics/omega-3-fatty-acids",
    publishedAt: new Date('2024-01-20'),
  },
];

async function main() {
  console.log('Adding overnight batch 1 of knowledge articles...\n')
  
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
