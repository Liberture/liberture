import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const articles = [
  {
    title: "Electrolytes and Hydration: Beyond Water",
    description: "Why sodium, potassium, and magnesium matter for cellular function, athletic performance, and cognitive clarity—plus optimal intake strategies.",
    pillar: "Fueling",
    tags: "electrolytes,hydration,sodium,potassium,magnesium,performance",
    author: "Dr. James DiNicolantonio",
    readTime: 13,
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6315424/",
    publishedAt: new Date('2024-02-06'),
  },
  {
    title: "Fascia and Movement Quality",
    description: "Understanding fascial health, myofascial release techniques, and how connective tissue impacts mobility, posture, and pain.",
    pillar: "Physicality",
    tags: "fascia,mobility,myofascial-release,movement-quality,tissue-health",
    author: "Thomas Myers",
    readTime: 16,
    url: "https://www.anatomytrains.com/fascia/",
    publishedAt: new Date('2024-01-20'),
  },
  {
    title: "Dopamine Fasting: Science vs Hype",
    description: "What the research actually says about dopamine regulation, reward pathways, and breaking addictive behavior patterns.",
    pillar: "Mental",
    tags: "dopamine,addiction,neuroscience,behavior-change,self-regulation",
    author: "Dr. Andrew Huberman",
    readTime: 14,
    url: "https://hubermanlab.com/controlling-your-dopamine-for-motivation-focus-and-satisfaction/",
    publishedAt: new Date('2024-02-02'),
  },
  {
    title: "Autophagy and Cellular Renewal",
    description: "How fasting, exercise, and sleep trigger cellular cleanup, remove damaged proteins, and support longevity through autophagy.",
    pillar: "Recovery",
    tags: "autophagy,fasting,cellular-health,longevity,mitophagy",
    author: "Dr. Valter Longo",
    readTime: 17,
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6257056/",
    publishedAt: new Date('2024-01-28'),
  },
  {
    title: "Tax-Advantaged Accounts for Early Retirement",
    description: "Strategic use of Roth IRA, 401(k), and HSA to minimize taxes and fund early retirement without penalties.",
    pillar: "Finance",
    tags: "roth-ira,401k,hsa,tax-optimization,early-retirement,fire",
    author: "Mad Fientist",
    readTime: 19,
    url: "https://www.madfientist.com/tax-avoidance/",
    publishedAt: new Date('2024-02-09'),
  },
  {
    title: "Omega-3 Fatty Acids: DHA vs EPA",
    description: "Comparing the different omega-3s for brain health, inflammation, cardiovascular function, and optimal dosing strategies.",
    pillar: "Cognition",
    tags: "omega-3,dha,epa,brain-health,inflammation,fish-oil",
    author: "Examine.com",
    readTime: 15,
    url: "https://examine.com/supplements/fish-oil/",
    publishedAt: new Date('2024-01-30'),
  },
  {
    title: "Sleep Debt: Can You Catch Up?",
    description: "Research on sleep deprivation, cumulative effects, recovery strategies, and why weekend sleep-ins aren't enough.",
    pillar: "Recovery",
    tags: "sleep-debt,sleep-deprivation,recovery,circadian-rhythm,rest",
    author: "Dr. Matthew Walker",
    readTime: 12,
    url: "https://www.sleepfoundation.org/sleep-deprivation/sleep-debt",
    publishedAt: new Date('2024-02-05'),
  },
  {
    title: "Lactate Threshold Training for Endurance",
    description: "Understanding lactate threshold, training zones, and how to improve your aerobic capacity for endurance sports.",
    pillar: "Physicality",
    tags: "lactate-threshold,endurance,training-zones,vo2max,aerobic-capacity",
    author: "Joe Friel",
    readTime: 18,
    url: "https://www.trainingpeaks.com/blog/what-is-lactate-threshold/",
    publishedAt: new Date('2024-01-25'),
  },
  {
    title: "Meal Prep for Consistent Nutrition",
    description: "Practical strategies for batch cooking, storage, and maintaining nutritional quality while saving time and money.",
    pillar: "Fueling",
    tags: "meal-prep,nutrition,time-management,batch-cooking,food-storage",
    author: "Precision Nutrition",
    readTime: 11,
    url: "https://www.precisionnutrition.com/meal-prep-guide",
    publishedAt: new Date('2024-02-08'),
  },
];

async function main() {
  console.log('Adding overnight batch 7 of knowledge articles...\n')
  
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
  console.log(`📊 Running total: ${36 + added} articles`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
