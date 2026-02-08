import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const articles = [
  // Cognition
  {
    title: "Neuroplasticity and Brain Training",
    description: "How to harness neuroplasticity to improve cognitive function, memory, and learning capacity through deliberate practice.",
    pillar: "Cognition",
    tags: "neuroplasticity,brain-training,learning,memory",
    author: "Andrew Huberman",
    readTime: 12,
    url: "https://hubermanlab.com/neuroplasticity",
    publishedAt: new Date('2024-01-10'),
  },
  {
    title: "Caffeine Optimization Protocol",
    description: "Evidence-based guidelines for caffeine timing, dosing, and cycling to maximize cognitive benefits while minimizing tolerance.",
    pillar: "Cognition",
    tags: "caffeine,stimulants,focus,adenosine",
    author: "Matthew Walker",
    readTime: 8,
    url: "https://www.sleepdiplomat.com/caffeine",
    publishedAt: new Date('2023-11-15'),
  },
  // Recovery
  {
    title: "Sleep Hygiene Essentials",
    description: "Science-backed strategies for optimizing sleep environment, routine, and habits for deep restorative sleep.",
    pillar: "Recovery",
    tags: "sleep,circadian,melatonin,sleep-hygiene",
    author: "Matthew Walker",
    readTime: 10,
    url: "https://www.sleepdiplomat.com/",
    publishedAt: new Date('2024-01-05'),
  },
  {
    title: "Foam Rolling and Myofascial Release",
    description: "Techniques for self-myofascial release to improve mobility, reduce soreness, and accelerate recovery.",
    pillar: "Recovery",
    tags: "foam-rolling,mobility,recovery,myofascial",
    author: "Kelly Starrett",
    readTime: 9,
    url: "https://thereadystate.com/",
    publishedAt: new Date('2023-12-10'),
  },
  // Fueling  
  {
    title: "Protein Timing and Distribution",
    description: "Optimal protein intake patterns for muscle protein synthesis, recovery, and body composition.",
    pillar: "Fueling",
    tags: "protein,nutrition,muscle,amino-acids",
    author: "Layne Norton",
    readTime: 11,
    url: "https://biolayne.com/articles/nutrition/protein-intake/",
    publishedAt: new Date('2024-01-20'),
  },
  {
    title: "Micronutrient Deficiency Guide",
    description: "Common deficiencies (B12, D, magnesium, iron), symptoms, testing, and supplementation strategies.",
    pillar: "Fueling",
    tags: "micronutrients,vitamins,minerals,deficiency",
    author: "Examine.com",
    readTime: 14,
    url: "https://examine.com/guides/vitamin-mineral-guide/",
    publishedAt: new Date('2023-11-30'),
  },
  // Mental
  {
    title: "Cognitive Behavioral Therapy Basics",
    description: "Introduction to CBT techniques for managing anxiety, depression, and negative thought patterns.",
    pillar: "Mental",
    tags: "cbt,therapy,mental-health,anxiety",
    author: "David Burns",
    readTime: 13,
    url: "https://feelinggood.com/",
    publishedAt: new Date('2023-12-15'),
  },
  {
    title: "Gratitude Practice and Well-Being",
    description: "The science of gratitude and practical methods for cultivating appreciation to improve mental health.",
    pillar: "Mental",
    tags: "gratitude,happiness,well-being,positive-psychology",
    author: "Robert Emmons",
    readTime: 7,
    url: "https://greatergood.berkeley.edu/topic/gratitude",
    publishedAt: new Date('2024-01-08'),
  },
  // Physicality
  {
    title: "Mobility and Flexibility Training",
    description: "Daily mobility routines to improve range of motion, prevent injury, and enhance athletic performance.",
    pillar: "Physicality",
    tags: "mobility,flexibility,stretching,movement",
    author: "Kelly Starrett",
    readTime: 10,
    url: "https://thereadystate.com/",
    publishedAt: new Date('2023-12-05'),
  },
  {
    title: "Vo2 Max Training",
    description: "High-intensity interval protocols to improve maximal aerobic capacity and cardiovascular health.",
    pillar: "Physicality",
    tags: "vo2max,cardio,hiit,endurance",
    author: "Peter Attia",
    readTime: 12,
    url: "https://peterattiamd.com/vo2-max/",
    publishedAt: new Date('2024-01-15'),
  },
  // Finance
  {
    title: "Tax-Advantaged Accounts Guide",
    description: "Maximizing 401(k), IRA, HSA, and other tax-advantaged accounts for long-term wealth building.",
    pillar: "Finance",
    tags: "taxes,retirement,401k,ira,investing",
    author: "Mad Fientist",
    readTime: 16,
    url: "https://www.madfientist.com/",
    publishedAt: new Date('2023-11-20'),
  },
  {
    title: "Real Estate Investment Basics",
    description: "Introduction to rental property investing, house hacking, and real estate wealth building strategies.",
    pillar: "Finance",
    tags: "real-estate,investing,rental-property,passive-income",
    author: "Bigger Pockets",
    readTime: 15,
    url: "https://www.biggerpockets.com/",
    publishedAt: new Date('2023-12-01'),
  },
  // More across all pillars
  {
    title: "Dopamine Regulation and Motivation",
    description: "Understanding dopamine's role in motivation and how to maintain healthy dopamine baseline levels.",
    pillar: "Cognition",
    tags: "dopamine,motivation,neurotransmitters,focus",
    author: "Andrew Huberman",
    readTime: 14,
    url: "https://hubermanlab.com/dopamine",
    publishedAt: new Date('2024-01-25'),
  },
  {
    title: "Contrast Therapy: Hot and Cold",
    description: "Alternating hot and cold exposure protocols for recovery, circulation, and resilience.",
    pillar: "Recovery",
    tags: "contrast-therapy,sauna,cold-plunge,recovery",
    author: "Wim Hof",
    readTime: 9,
    url: "https://www.wimhofmethod.com/",
    publishedAt: new Date('2024-01-12'),
  },
  {
    title: "Anti-Inflammatory Diet Guide",
    description: "Foods and eating patterns to reduce chronic inflammation and optimize health.",
    pillar: "Fueling",
    tags: "inflammation,diet,anti-inflammatory,nutrition",
    author: "Rhonda Patrick",
    readTime: 13,
    url: "https://www.foundmyfitness.com/",
    publishedAt: new Date('2023-12-20'),
  },
  {
    title: "Mindfulness for Stress Reduction",
    description: "Mindfulness-based stress reduction (MBSR) techniques and practices for daily life.",
    pillar: "Mental",
    tags: "mindfulness,mbsr,stress,meditation",
    author: "Jon Kabat-Zinn",
    readTime: 11,
    url: "https://www.mindfulnesscds.com/",
    publishedAt: new Date('2024-01-18'),
  },
  {
    title: "Functional Movement Screening",
    description: "Assessing movement patterns to identify weaknesses and prevent injury.",
    pillar: "Physicality",
    tags: "movement,fms,injury-prevention,assessment",
    author: "Gray Cook",
    readTime: 10,
    url: "https://www.functionalmovement.com/",
    publishedAt: new Date('2023-12-08'),
  },
  {
    title: "Side Hustles and Income Streams",
    description: "Creating multiple income streams through side businesses, freelancing, and digital products.",
    pillar: "Finance",
    tags: "side-hustle,income,entrepreneurship,business",
    author: "Chris Guillebeau",
    readTime: 12,
    url: "https://chrisguillebeau.com/",
    publishedAt: new Date('2023-11-28'),
  },
];

async function main() {
  console.log('Adding remaining 18 articles...')
  
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
