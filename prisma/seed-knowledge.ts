import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const knowledgeArticles = [
  // COGNITION PILLAR
  {
    title: "The Science of Flow States: How to Access Deep Focus on Demand",
    description: "Understanding the neuroscience behind flow states and practical protocols to trigger them consistently",
    pillar: "cognition",
    tags: ["Flow State", "Neuroscience", "Dopamine", "Focus", "Performance"],
    author: "Dr. Andrew Huberman",
    readTime: 12,
    url: "/knowledge/flow-states-neuroscience",
    publishedAt: new Date("2026-01-15"),
  },
  {
    title: "Nootropic Stacks: Evidence-Based Cognitive Enhancement",
    description: "A comprehensive guide to nootropics backed by clinical research, from racetams to natural adaptogens",
    pillar: "cognition",
    tags: ["Nootropics", "Cognitive Enhancement", "Supplements", "Brain Health"],
    author: "Dr. Rhonda Patrick",
    readTime: 18,
    url: "/knowledge/nootropic-stacks-guide",
    publishedAt: new Date("2026-01-20"),
  },
  {
    title: "Ultradian Rhythms: Optimizing Your 90-Minute Work Cycles",
    description: "How to structure your day around natural 90-minute attention cycles for maximum productivity",
    pillar: "cognition",
    tags: ["Productivity", "Circadian Rhythm", "Focus", "Time Management"],
    author: "Cal Newport",
    readTime: 10,
    url: "/knowledge/ultradian-rhythms",
    publishedAt: new Date("2026-02-01"),
  },

  // RECOVERY PILLAR
  {
    title: "Sleep Architecture: Mastering the 4 Stages for Optimal Recovery",
    description: "Deep dive into sleep cycles, REM vs deep sleep, and protocols to optimize each stage",
    pillar: "recovery",
    tags: ["Sleep", "Recovery", "HRV", "Circadian Rhythm", "Deep Sleep"],
    author: "Dr. Matthew Walker",
    readTime: 15,
    url: "/knowledge/sleep-architecture-guide",
    publishedAt: new Date("2026-01-10"),
  },
  {
    title: "Cold Exposure Protocol: From Beginner to Advanced",
    description: "Science-backed guide to cold showers, ice baths, and deliberate cold exposure for recovery and resilience",
    pillar: "recovery",
    tags: ["Cold Therapy", "Recovery", "Dopamine", "Inflammation", "Hormesis"],
    author: "Wim Hof & Dr. Susanna Søberg",
    readTime: 14,
    url: "/knowledge/cold-exposure-protocol",
    publishedAt: new Date("2026-01-25"),
  },
  {
    title: "HRV Tracking: What Your Heart Rate Variability Really Means",
    description: "Understanding HRV metrics, what affects them, and how to use HRV to optimize training and recovery",
    pillar: "recovery",
    tags: ["HRV", "Recovery", "Stress", "ANS", "Tracking"],
    author: "Dr. Peter Attia",
    readTime: 11,
    url: "/knowledge/hrv-tracking-guide",
    publishedAt: new Date("2026-02-03"),
  },

  // FUELING PILLAR
  {
    title: "Metabolic Flexibility: Training Your Body to Burn Fat and Glucose",
    description: "How to build metabolic flexibility through strategic fasting, ketosis, and carb cycling",
    pillar: "fueling",
    tags: ["Metabolism", "Ketosis", "Fasting", "Nutrition", "Mitochondria"],
    author: "Dr. Ben Bikman",
    readTime: 16,
    url: "/knowledge/metabolic-flexibility",
    publishedAt: new Date("2026-01-12"),
  },
  {
    title: "Intermittent Fasting Protocols: Finding Your Optimal Window",
    description: "Comparing 16:8, 18:6, OMAD, and alternate-day fasting with practical implementation strategies",
    pillar: "fueling",
    tags: ["Fasting", "Autophagy", "Insulin", "Weight Loss", "Longevity"],
    author: "Dr. Jason Fung",
    readTime: 13,
    url: "/knowledge/intermittent-fasting-protocols",
    publishedAt: new Date("2026-01-18"),
  },
  {
    title: "Protein Timing and Muscle Protein Synthesis",
    description: "Evidence-based guide to protein intake timing, amounts, and sources for optimal body composition",
    pillar: "fueling",
    tags: ["Protein", "Nutrition", "Muscle", "Recovery", "MPS"],
    author: "Dr. Layne Norton",
    readTime: 12,
    url: "/knowledge/protein-timing-guide",
    publishedAt: new Date("2026-02-05"),
  },

  // MENTAL PILLAR
  {
    title: "Meditation for Skeptics: Neuroscience-Backed Mindfulness",
    description: "How meditation physically changes your brain, backed by fMRI studies and practical protocols",
    pillar: "mental",
    tags: ["Meditation", "Mindfulness", "Neuroscience", "Stress", "Mental Health"],
    author: "Dr. Sam Harris",
    readTime: 14,
    url: "/knowledge/meditation-neuroscience",
    publishedAt: new Date("2026-01-22"),
  },
  {
    title: "The Vagus Nerve: Activating Your Body's Calm Response",
    description: "Understanding vagal tone and evidence-based techniques to activate the parasympathetic nervous system",
    pillar: "mental",
    tags: ["Vagus Nerve", "Stress", "ANS", "Breathing", "Recovery"],
    author: "Dr. Stephen Porges",
    readTime: 11,
    url: "/knowledge/vagus-nerve-activation",
    publishedAt: new Date("2026-01-28"),
  },
  {
    title: "Psychedelics and Mental Health: Current Research Status",
    description: "Overview of clinical research on psilocybin, MDMA, and ketamine for depression, PTSD, and anxiety",
    pillar: "mental",
    tags: ["Psychedelics", "Mental Health", "Research", "Therapy", "Consciousness"],
    author: "Dr. Robin Carhart-Harris",
    readTime: 20,
    url: "/knowledge/psychedelics-mental-health",
    publishedAt: new Date("2026-02-02"),
  },

  // PHYSICALITY PILLAR
  {
    title: "Zone 2 Training: The Foundation of Metabolic Health",
    description: "Why low-intensity cardio matters more than you think, and how to implement it effectively",
    pillar: "physicality",
    tags: ["Cardio", "Zone 2", "Mitochondria", "Endurance", "Longevity"],
    author: "Dr. Iñigo San-Millán",
    readTime: 13,
    url: "/knowledge/zone-2-training",
    publishedAt: new Date("2026-01-14"),
  },
  {
    title: "Strength Training for Longevity: Beyond Aesthetics",
    description: "How resistance training affects healthspan, bone density, metabolic health, and longevity",
    pillar: "physicality",
    tags: ["Strength Training", "Longevity", "Muscle", "Bone Health", "Aging"],
    author: "Dr. Gabrielle Lyon",
    readTime: 15,
    url: "/knowledge/strength-training-longevity",
    publishedAt: new Date("2026-01-27"),
  },
  {
    title: "Movement Variability: Why Gym Bros Need Yoga",
    description: "The case for movement diversity, mobility work, and breaking out of repetitive movement patterns",
    pillar: "physicality",
    tags: ["Mobility", "Movement", "Flexibility", "Injury Prevention", "Yoga"],
    author: "Kelly Starrett",
    readTime: 10,
    url: "/knowledge/movement-variability",
    publishedAt: new Date("2026-02-04"),
  },

  // FINANCE PILLAR
  {
    title: "The Psychology of Enough: When More Money Stops Mattering",
    description: "Understanding your \"enough\" number and the relationship between wealth, happiness, and freedom",
    pillar: "finance",
    tags: ["Psychology of Money", "Financial Independence", "Happiness", "Wealth", "FIRE"],
    author: "Morgan Housel",
    readTime: 12,
    url: "/knowledge/psychology-of-enough",
    publishedAt: new Date("2026-01-16"),
  },
  {
    title: "Bitcoin Standard: Sound Money for Sound Bodies",
    description: "Why Bitcoin's properties align with long-term thinking, low time preference, and health optimization",
    pillar: "finance",
    tags: ["Bitcoin", "Sound Money", "Time Preference", "Savings", "Independence"],
    author: "Saifedean Ammous",
    readTime: 18,
    url: "/knowledge/bitcoin-standard-health",
    publishedAt: new Date("2026-01-24"),
  },
  {
    title: "Index Funds and the 4% Rule: Financial Optimization Basics",
    description: "Simple, evidence-based approach to investing and financial independence for knowledge workers",
    pillar: "finance",
    tags: ["Investing", "Index Funds", "FIRE", "Passive Income", "Financial Independence"],
    author: "JL Collins",
    readTime: 14,
    url: "/knowledge/index-funds-4-percent-rule",
    publishedAt: new Date("2026-01-31"),
  },
]

async function main() {
  console.log('🌱 Seeding knowledge articles...')

  for (const article of knowledgeArticles) {
    await prisma.knowledgeArticle.create({
      data: {
        ...article,
        tags: JSON.stringify(article.tags),
      },
    })
  }

  console.log(`✅ Created ${knowledgeArticles.length} knowledge articles`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
