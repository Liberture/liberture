import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const articles = [
  {
    title: "The Science of Cold Exposure",
    description: "Understanding how cold therapy impacts metabolism, immune function, and mental resilience through hormesis and adaptive stress.",
    pillar: "Recovery",
    tags: "cold-exposure,hormesis,immune-system,metabolism",
    author: "Wim Hof Institute",
    readTime: 8,
    url: "https://www.wimhofmethod.com/science",
    publishedAt: new Date('2024-01-15'),
  },
  {
    title: "Nootropics: A Beginner's Guide",
    description: "Evidence-based overview of cognitive enhancers, their mechanisms of action, safety profiles, and practical implementation strategies.",
    pillar: "Cognition",
    tags: "nootropics,cognition,supplements,brain-health",
    author: "Examine.com",
    readTime: 12,
    url: "https://examine.com/supplements/nootropic/",
    publishedAt: new Date('2024-02-01'),
  },
  {
    title: "Sleep Optimization Protocol",
    description: "Comprehensive guide to improving sleep quality through circadian rhythm management, light exposure, temperature regulation, and supplement timing.",
    pillar: "Recovery",
    tags: "sleep,circadian-rhythm,recovery,supplements",
    author: "Andrew Huberman",
    readTime: 15,
    url: "https://hubermanlab.com/sleep-toolkit/",
    publishedAt: new Date('2023-12-10'),
  },
  {
    title: "Metabolic Flexibility & Ketosis",
    description: "How to train your body to efficiently switch between glucose and fat metabolism for enhanced energy and cognitive performance.",
    pillar: "Fueling",
    tags: "ketosis,metabolism,fasting,nutrition",
    author: "Dom D'Agostino",
    readTime: 10,
    url: "https://www.ketonutrition.org/metabolic-flexibility",
    publishedAt: new Date('2024-01-20'),
  },
  {
    title: "Heart Rate Variability Training",
    description: "Using HRV as a biomarker for stress, recovery, and nervous system health. Practical protocols for measurement and improvement.",
    pillar: "Physicality",
    tags: "hrv,biofeedback,stress,recovery,nervous-system",
    author: "Elite HRV",
    readTime: 7,
    url: "https://elitehrv.com/hrv-training",
    publishedAt: new Date('2024-01-05'),
  },
  {
    title: "Breathwork for Stress Management",
    description: "Evidence-based breathing techniques for regulating the autonomic nervous system, reducing stress, and improving mental clarity.",
    pillar: "Mental",
    tags: "breathwork,stress,anxiety,meditation,vagus-nerve",
    author: "Breath Research Institute",
    readTime: 9,
    url: "https://www.breathresearch.org/techniques",
    publishedAt: new Date('2023-11-15'),
  },
  {
    title: "Red Light Therapy: Mechanisms & Benefits",
    description: "Scientific overview of photobiomodulation for mitochondrial function, inflammation reduction, and tissue repair.",
    pillar: "Recovery",
    tags: "red-light-therapy,photobiomodulation,mitochondria,recovery",
    author: "Michael Hamblin",
    readTime: 11,
    url: "https://www.photomedicine.com/mechanisms",
    publishedAt: new Date('2024-02-05'),
  },
  {
    title: "Financial Independence Framework",
    description: "Systematic approach to building wealth through passive income, asset allocation, and financial literacy for long-term freedom.",
    pillar: "Finance",
    tags: "financial-independence,investing,passive-income,wealth",
    author: "Mr. Money Mustache",
    readTime: 14,
    url: "https://www.mrmoneymustache.com/framework",
    publishedAt: new Date('2023-10-20'),
  },
];

async function main() {
  console.log('Adding knowledge articles...')
  
  for (const article of articles) {
    await prisma.knowledgeArticle.create({
      data: article,
    })
    console.log(`✅ Added: ${article.title}`)
  }
  
  console.log(`\n✅ Successfully added ${articles.length} knowledge articles!`)
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
