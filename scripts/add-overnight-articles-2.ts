import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const articles = [
  {
    title: "Red Light Therapy: Mechanisms and Applications",
    description: "How photobiomodulation with red and near-infrared light stimulates mitochondrial function, reduces inflammation, and accelerates tissue repair.",
    pillar: "Recovery",
    tags: "red-light,photobiomodulation,mitochondria,inflammation,recovery",
    author: "Dr. Michael Hamblin",
    readTime: 13,
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6122750/",
    publishedAt: new Date('2024-01-18'),
  },
  {
    title: "Meditation Techniques for Stress Reduction",
    description: "Comprehensive guide to various meditation practices including mindfulness, transcendental meditation, and body scans for managing stress and anxiety.",
    pillar: "Mental",
    tags: "meditation,mindfulness,stress-reduction,anxiety,mental-health",
    author: "Jon Kabat-Zinn",
    readTime: 15,
    url: "https://www.mindful.org/meditation/",
    publishedAt: new Date('2024-02-01'),
  },
  {
    title: "Strength Training for Longevity and Metabolic Health",
    description: "Evidence for resistance training's role in maintaining muscle mass, bone density, insulin sensitivity, and overall healthspan as we age.",
    pillar: "Physicality",
    tags: "strength-training,muscle-mass,bone-density,longevity,metabolic-health",
    author: "Brad Schoenfeld PhD",
    readTime: 16,
    url: "https://www.strongerbyscience.com/hypertrophy-range/",
    publishedAt: new Date('2023-12-15'),
  },
  {
    title: "Time-Restricted Eating: 16/8 Protocol Guide",
    description: "Practical implementation guide for 16-hour fasting with 8-hour eating window, including timing strategies, common mistakes, and expected outcomes.",
    pillar: "Fueling",
    tags: "intermittent-fasting,time-restricted-eating,autophagy,metabolic-health",
    author: "Dr. Satchin Panda",
    readTime: 14,
    url: "https://www.salk.edu/news-release/time-restricted-eating-reshapes-gene-expression/",
    publishedAt: new Date('2024-01-12'),
  },
  {
    title: "Index Fund Investing: The FIRE Movement Foundation",
    description: "Why low-cost index funds form the backbone of financial independence strategies, with asset allocation recommendations across different life stages.",
    pillar: "Finance",
    tags: "index-funds,fire,investing,financial-independence,passive-income",
    author: "JL Collins",
    readTime: 18,
    url: "https://jlcollinsnh.com/stock-series/",
    publishedAt: new Date('2024-01-08'),
  },
  {
    title: "L-Theanine and Caffeine: The Ultimate Focus Stack",
    description: "How combining L-theanine with caffeine creates smooth, sustained focus without jitters—mechanisms, dosing, and timing protocols.",
    pillar: "Cognition",
    tags: "l-theanine,caffeine,focus,nootropics,energy",
    author: "Examine.com",
    readTime: 9,
    url: "https://examine.com/supplements/theanine/",
    publishedAt: new Date('2024-02-03'),
  },
  {
    title: "Breathwork for Performance and Recovery",
    description: "Scientific overview of breathing techniques including box breathing, Wim Hof method, and nasal breathing for stress management and athletic performance.",
    pillar: "Recovery",
    tags: "breathwork,breathing-techniques,stress-management,performance,wim-hof",
    author: "James Nestor",
    readTime: 12,
    url: "https://www.mrbreathe.com/science/",
    publishedAt: new Date('2024-01-25'),
  },
];

async function main() {
  console.log('Adding overnight batch 2 of knowledge articles...\n')
  
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
