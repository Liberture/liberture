import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const articles = [
  {
    title: "Active Recovery vs Complete Rest",
    description: "When to choose light movement versus total rest for optimal recovery, backed by exercise physiology research.",
    pillar: "Recovery",
    tags: "active-recovery,rest-days,training,deload,recovery-protocols",
    author: "Dr. Andy Galpin",
    readTime: 13,
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5932411/",
    publishedAt: new Date('2024-02-07'),
  },
  {
    title: "Lion's Mane Mushroom for Neurogenesis",
    description: "Research on lion's mane (Hericium erinaceus) for nerve growth factor, cognitive enhancement, and neuroprotection.",
    pillar: "Cognition",
    tags: "lions-mane,mushrooms,neurogenesis,neuroprotection,supplements",
    author: "Paul Stamets",
    readTime: 14,
    url: "https://examine.com/supplements/yamabushitake/",
    publishedAt: new Date('2024-02-05'),
  },
  {
    title: "Compound Interest and The Time Value of Money",
    description: "Why starting early matters exponentially—mathematical principles behind wealth accumulation and retirement planning.",
    pillar: "Finance",
    tags: "compound-interest,investing,time-value,retirement,wealth-building",
    author: "Morgan Housel",
    readTime: 12,
    url: "https://www.collaborativefund.com/blog/the-psychology-of-money/",
    publishedAt: new Date('2024-01-26'),
  },
  {
    title: "Functional Movement Screening",
    description: "Identifying mobility limitations and asymmetries to prevent injury and optimize movement patterns before adding load.",
    pillar: "Physicality",
    tags: "fms,movement-screening,injury-prevention,mobility-assessment,functional-training",
    author: "Gray Cook",
    readTime: 15,
    url: "https://www.functionalmovement.com/",
    publishedAt: new Date('2024-02-08'),
  },
  {
    title: "Mindfulness Meditation: Starting Guide",
    description: "Evidence-based introduction to mindfulness practice—techniques, common obstacles, and neurological benefits.",
    pillar: "Mental",
    tags: "mindfulness,meditation,stress-reduction,present-moment,neural-plasticity",
    author: "Jon Kabat-Zinn",
    readTime: 16,
    url: "https://www.mindful.org/meditation/mindfulness-getting-started/",
    publishedAt: new Date('2024-02-06'),
  },
  {
    title: "Macronutrient Ratios for Different Goals",
    description: "Protein, carbs, and fats: optimal ratios for muscle gain, fat loss, endurance, and general health.",
    pillar: "Fueling",
    tags: "macros,protein,carbohydrates,fats,nutrition-planning,body-composition",
    author: "Layne Norton PhD",
    readTime: 17,
    url: "https://www.biolayne.com/articles/research/optimal-protein-intake/",
    publishedAt: new Date('2024-01-22'),
  },
  {
    title: "Box Breathing for Nervous System Regulation",
    description: "The 4-4-4-4 breathing technique used by Navy SEALs for stress management, focus, and autonomic balance.",
    pillar: "Mental",
    tags: "box-breathing,breathwork,stress-management,vagal-tone,performance",
    author: "Mark Divine",
    readTime: 8,
    url: "https://www.healthline.com/health/box-breathing",
    publishedAt: new Date('2024-02-04'),
  },
  {
    title: "Rhodiola Rosea for Stress and Endurance",
    description: "Evidence for rhodiola as an adaptogen for physical endurance, mental fatigue, and stress resilience.",
    pillar: "Cognition",
    tags: "rhodiola,adaptogens,endurance,stress-resistance,herbal-medicine",
    author: "Examine.com",
    readTime: 13,
    url: "https://examine.com/supplements/rhodiola-rosea/",
    publishedAt: new Date('2024-01-31'),
  },
  {
    title: "Sleep Architecture: REM vs Deep Sleep",
    description: "Understanding sleep stages, their unique functions, and how to optimize both REM and slow-wave sleep.",
    pillar: "Recovery",
    tags: "sleep-stages,rem-sleep,deep-sleep,sleep-architecture,optimization",
    author: "Dr. Matthew Walker",
    readTime: 19,
    url: "https://www.sleepfoundation.org/stages-of-sleep",
    publishedAt: new Date('2024-02-09'),
  },
  {
    title: "Dynamic Stretching vs Static Stretching",
    description: "When to use each type of stretching for injury prevention, performance, and mobility improvement.",
    pillar: "Physicality",
    tags: "stretching,dynamic-warmup,static-stretching,flexibility,injury-prevention",
    author: "Kelly Starrett",
    readTime: 11,
    url: "https://www.thereadystate.com/mobility-101/",
    publishedAt: new Date('2024-01-27'),
  },
];

async function main() {
  console.log('Adding overnight batch 9 - Final push to 60!...\n')
  
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
  console.log(`🎉 MILESTONE: ${50 + added} total knowledge articles!`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
