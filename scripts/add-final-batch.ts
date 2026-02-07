import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const articles = [
  {
    title: "Morning Sunlight Exposure",
    description: "The critical importance of early morning sunlight for circadian rhythm, cortisol awakening response, and mood regulation.",
    pillar: "Recovery",
    tags: "circadian-rhythm,sunlight,cortisol,sleep,mood",
    author: "Dr. Andrew Huberman",
    readTime: 7,
    url: "https://hubermanlab.com/using-light-for-health/",
    publishedAt: new Date('2024-01-18'),
  },
  {
    title: "Omega-3 Fatty Acids for Brain Health",
    description: "EPA and DHA's role in neuroplasticity, inflammation reduction, and cognitive performance with dosing recommendations.",
    pillar: "Cognition",
    tags: "omega-3,dha,epa,brain-health,supplements",
    author: "Examine.com",
    readTime: 11,
    url: "https://examine.com/supplements/fish-oil/",
    publishedAt: new Date('2024-02-03'),
  },
  {
    title: "Compound Exercises vs Isolation",
    description: "Understanding when to use compound movements vs isolation exercises for strength, hypertrophy, and injury prevention.",
    pillar: "Physicality",
    tags: "strength-training,compound-exercises,programming,hypertrophy",
    author: "StrongLifts",
    readTime: 9,
    url: "https://stronglifts.com/compound-exercises/",
    publishedAt: new Date('2023-12-20'),
  },
  {
    title: "Stoic Philosophy for Modern Life",
    description: "Practical applications of Stoic principles for emotional resilience, decision-making, and mental fortitude.",
    pillar: "Mental",
    tags: "stoicism,philosophy,resilience,mental-health",
    author: "Daily Stoic",
    readTime: 10,
    url: "https://dailystoic.com/what-is-stoicism/",
    publishedAt: new Date('2024-01-12'),
  },
  {
    title: "The FIRE Movement Explained",
    description: "Financial Independence, Retire Early: strategies, savings rates, withdrawal rates, and lifestyle design principles.",
    pillar: "Finance",
    tags: "fire,financial-independence,retirement,savings",
    author: "Mr. Money Mustache",
    readTime: 15,
    url: "https://www.mrmoneymustache.com/2013/02/22/getting-rich-from-zero-to-hero-in-one-blog-post/",
    publishedAt: new Date('2023-11-25'),
  },
  {
    title: "Electrolyte Balance & Hydration",
    description: "Sodium, potassium, magnesium ratios for optimal hydration, performance, and cellular function.",
    pillar: "Fueling",
    tags: "electrolytes,hydration,sodium,potassium,magnesium",
    author: "LMNT Research",
    readTime: 8,
    url: "https://drinklmnt.com/blogs/health/electrolyte-basics",
    publishedAt: new Date('2024-01-30'),
  },
];

async function main() {
  console.log('Adding final batch of articles...')
  
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
  console.log(`\n✅ Knowledge base now has ${total} total articles!`)
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
