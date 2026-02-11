import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const articles = [
  {
    title: "The Huberman Lab Sleep Toolkit: Implementation Guide",
    description: "Step-by-step implementation of Andrew Huberman's science-backed sleep optimization protocols including light, temperature, and supplement timing.",
    pillar: "Recovery",
    tags: "sleep,huberman,circadian-rhythm,supplements,protocol",
    author: "Andrew Huberman Lab",
    readTime: 20,
    url: "https://hubermanlab.com/toolkit-for-sleep/",
    publishedAt: new Date('2024-01-28'),
  },
  {
    title: "Creatine Monohydrate: Beyond Muscle Building",
    description: "Evidence for creatine's cognitive benefits, neuroprotection, and mood enhancement beyond its well-known effects on physical performance.",
    pillar: "Cognition",
    tags: "creatine,nootropics,brain-health,supplements,mood",
    author: "Examine.com",
    readTime: 14,
    url: "https://examine.com/supplements/creatine/",
    publishedAt: new Date('2024-02-10'),
  },
  {
    title: "Mobility Work for Longevity: The Daily 15-Minute Protocol",
    description: "Essential mobility drills to maintain functional movement, prevent injury, and preserve range of motion as you age.",
    pillar: "Physicality",
    tags: "mobility,flexibility,longevity,injury-prevention,daily-practice",
    author: "Kelly Starrett",
    readTime: 12,
    url: "https://www.thereadystate.com/mobility-workout/",
    publishedAt: new Date('2024-01-22'),
  },
  {
    title: "Journaling for Mental Clarity: Evidence-Based Techniques",
    description: "Research-backed journaling practices for emotional processing, goal setting, and cognitive offloading to reduce mental load.",
    pillar: "Mental",
    tags: "journaling,mental-health,self-reflection,emotional-regulation,clarity",
    author: "James Pennebaker",
    readTime: 11,
    url: "https://www.apa.org/monitor/2018/09/ce-corner",
    publishedAt: new Date('2024-02-04'),
  },
  {
    title: "The 4% Rule: Financial Independence Math Explained",
    description: "Understanding the Trinity Study and safe withdrawal rates for early retirement and financial independence planning.",
    pillar: "Finance",
    tags: "fire,retirement,financial-independence,withdrawal-rate,savings",
    author: "Mr. Money Mustache",
    readTime: 17,
    url: "https://www.mrmoneymustache.com/2012/05/29/how-much-do-i-need-for-retirement/",
    publishedAt: new Date('2024-01-30'),
  },
  {
    title: "Protein Timing and Muscle Protein Synthesis",
    description: "When and how much protein to consume for optimal muscle building, recovery, and metabolic health across different training protocols.",
    pillar: "Fueling",
    tags: "protein,nutrition,muscle-building,meal-timing,recovery",
    author: "Brad Schoenfeld PhD",
    readTime: 13,
    url: "https://www.strongerbyscience.com/athlete-protein-intake/",
    publishedAt: new Date('2024-02-06'),
  },
  {
    title: "Heat Stress Adaptation: Sauna Protocol for Performance",
    description: "How regular sauna use improves heat shock protein expression, cardiovascular function, and endurance performance through hormetic stress.",
    pillar: "Recovery",
    tags: "sauna,heat-exposure,hormesis,cardiovascular,endurance",
    author: "Dr. Rhonda Patrick",
    readTime: 16,
    url: "https://www.foundmyfitness.com/topics/sauna",
    publishedAt: new Date('2024-01-26'),
  },
];

async function main() {
  console.log('Adding overnight batch 3 of knowledge articles...\n')
  
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
