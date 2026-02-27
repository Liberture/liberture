/**
 * Quickly seed directory data based on the autonomous work session
 */

import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding directory data...\n')

  // People
  console.log('👥 Creating People...')
  const people = [
    {
      slug: 'wim-hof',
      name: 'Wim Hof',
      title: 'The Iceman',
      bio: 'Dutch extreme athlete noted for his ability to withstand freezing temperatures. Developed the Wim Hof Method combining cold therapy, breathing techniques, and meditation.',
      pillars: 'recovery,mental,physicality',
      expertise: 'Cold exposure, Breathing techniques, Mental resilience',
      followers: '4.3M',
      website: 'https://www.wimhofmethod.com',
      twitter: 'iceman_hof',
      instagram: 'iceman_hof',
      youtube: '@wimhof',
      featured: true,
    },
    {
      slug: 'andrew-huberman',
      name: 'Andrew Huberman',
      title: 'Neuroscientist & Professor',
      bio: 'Professor of Neurobiology at Stanford School of Medicine. Host of the Huberman Lab podcast, focused on science-based tools for everyday life.',
      pillars: 'cognition,recovery,mental',
      expertise: 'Neuroscience, Sleep, Performance optimization',
      followers: '6.2M',
      website: 'https://hubermanlab.com',
      twitter: 'hubermanlab',
      instagram: 'hubermanlab',
      youtube: '@hubermanlab',
      podcast: 'Huberman Lab',
      featured: true,
    },
    {
      slug: 'peter-attia',
      name: 'Peter Attia',
      title: 'MD, Longevity Expert',
      bio: 'Physician focusing on the applied science of longevity. Host of The Drive podcast. Author of "Outlive: The Science and Art of Longevity".',
      pillars: 'recovery,fueling,physicality,cognition',
      expertise: 'Longevity, Metabolic health, Exercise physiology',
      followers: '2.1M',
      website: 'https://peterattiamd.com',
      twitter: 'PeterAttiaMD',
      instagram: 'peterattiamd',
      youtube: '@PeterAttiaMD',
      podcast: 'The Drive',
      featured: true,
    },
    {
      slug: 'rhonda-patrick',
      name: 'Rhonda Patrick',
      title: 'PhD, Biomedical Scientist',
      bio: 'Biomedical scientist and health educator. Expert in nutritional health, brain aging, and cancer. Founder of FoundMyFitness.',
      pillars: 'cognition,fueling,recovery',
      expertise: 'Nutritional genomics, Mitochondrial health, Longevity',
      followers: '1.8M',
      website: 'https://www.foundmyfitness.com',
      twitter: 'FoundMyFitness',
      instagram: 'foundmyfitness',
      youtube: '@FoundMyFitness',
      featured: true,
    },
    {
      slug: 'bryan-johnson',
      name: 'Bryan Johnson',
      title: 'Entrepreneur & Biohacker',
      bio: 'Tech entrepreneur spending $2M/year on age reversal. Created the Blueprint protocol for radical life extension.',
      pillars: 'recovery,fueling,physicality,cognition,finance',
      expertise: 'Age reversal, Quantified self, Protocol optimization',
      followers: '900K',
      website: 'https://blueprint.bryanjohnson.co',
      twitter: 'bryan_johnson',
      instagram: 'bryanjohnson_',
      youtube: '@BryanJohnson',
      featured: true,
    },
    {
      slug: 'david-sinclair',
      name: 'David Sinclair',
      title: 'PhD, Professor of Genetics',
      bio: 'Professor of Genetics at Harvard Medical School. Leading researcher in aging and longevity. Author of "Lifespan".',
      pillars: 'recovery,cognition,fueling',
      expertise: 'Aging biology, NAD+, Sirtuins',
      followers: '1.2M',
      website: 'https://sinclair.hms.harvard.edu',
      twitter: 'davidasinclair',
      instagram: 'davidasinclair',
      featured: true,
    },
    {
      slug: 'matthew-walker',
      name: 'Matthew Walker',
      title: 'PhD, Sleep Scientist',
      bio: 'Professor of Neuroscience and Psychology at UC Berkeley. Leading expert on sleep. Author of "Why We Sleep".',
      pillars: 'recovery,cognition,mental',
      expertise: 'Sleep science, Circadian biology, Memory consolidation',
      followers: '500K',
      website: 'https://www.sleepdiplomat.com',
      twitter: 'sleepdiplomat',
      featured: true,
    },
    {
      slug: 'james-nestor',
      name: 'James Nestor',
      title: 'Author & Journalist',
      bio: 'Science journalist specializing in breath and breathing techniques. Author of "Breath: The New Science of a Lost Art".',
      pillars: 'recovery,physicality,mental',
      expertise: 'Breathing techniques, Respiratory health, Free diving',
      followers: '300K',
      website: 'https://www.mrjamesnestor.com',
      twitter: 'mrjamesnestor',
      instagram: 'mrjamesnestor',
      featured: false,
    },
  ]

  for (const person of people) {
    const exists = await prisma.person.findUnique({ where: { slug: person.slug } })
    if (!exists) {
      await prisma.person.create({ data: person })
      console.log(`  ✅ ${person.name}`)
    } else {
      console.log(`  ⏭️  ${person.name} (exists)`)
    }
  }

  // Organizations
  console.log('\n🏢 Creating Organizations...')
  const organizations = [
    {
      slug: 'examine-com',
      name: 'Examine.com',
      description: 'Independent organization analyzing research on supplementation and nutrition. Evidence-based guides on 650+ health topics.',
      pillars: 'fueling,recovery,cognition',
      type: 'research',
      website: 'https://examine.com',
      featured: true,
    },
    {
      slug: 'foundmyfitness',
      name: 'FoundMyFitness',
      description: 'Science-based health and wellness platform founded by Dr. Rhonda Patrick. Focus on nutritional health, aging, and disease prevention.',
      pillars: 'cognition,fueling,recovery',
      type: 'platform',
      website: 'https://www.foundmyfitness.com',
      featured: true,
    },
    {
      slug: 'quantified-self',
      name: 'The Quantified Self',
      description: 'Global community of users and makers of self-tracking tools. Pioneers in personal data collection and analysis.',
      pillars: 'cognition,recovery,physicality,mental',
      type: 'community',
      founded: '2007',
      website: 'https://quantifiedself.com',
      featured: false,
    },
    {
      slug: 'lifespan-io',
      name: 'Lifespan.io',
      description: 'Non-profit organization advancing longevity research. Funds and promotes scientific studies aimed at extending healthy human lifespan.',
      pillars: 'recovery,cognition,fueling',
      type: 'research',
      founded: '2014',
      website: 'https://www.lifespan.io',
      featured: true,
    },
  ]

  for (const org of organizations) {
    const exists = await prisma.organization.findUnique({ where: { slug: org.slug } })
    if (!exists) {
      await prisma.organization.create({ data: org })
      console.log(`  ✅ ${org.name}`)
    } else {
      console.log(`  ⏭️  ${org.name} (exists)`)
    }
  }

  // Protocols
  console.log('\n📋 Creating Protocols...')
  const protocols = [
    {
      slug: 'wim-hof-method',
      name: 'Wim Hof Method',
      description: 'Combination of cold exposure, breathing techniques, and meditation to improve immune function, mental resilience, and physical performance.',
      pillar: 'recovery',
      creator: 'Wim Hof',
      duration: '10-20 minutes daily',
      difficulty: 'intermediate',
      steps: JSON.stringify([
        'Controlled hyperventilation breathing (30-40 breaths)',
        'Breath retention after exhalation',
        'Recovery breath',
        'Cold exposure (shower, ice bath, or outdoor cold)',
      ]),
      benefits: JSON.stringify([
        'Improved immune response',
        'Reduced inflammation',
        'Enhanced mental clarity',
        'Increased energy levels',
        'Better stress management',
      ]),
      risks: JSON.stringify([
        'Not suitable for pregnant women',
        'Avoid while driving or in water',
        'Consult doctor if you have heart conditions',
      ]),
      equipment: JSON.stringify(['Cold shower or ice bath', 'Timer (optional)']),
      references: JSON.stringify(['https://www.wimhofmethod.com']),
      featured: true,
    },
    {
      slug: 'huberman-sleep-protocol',
      name: 'Huberman Lab Sleep Protocol',
      description: 'Science-based protocol for optimizing sleep quality and duration, developed by neuroscientist Andrew Huberman.',
      pillar: 'recovery',
      creator: 'Andrew Huberman',
      duration: 'Daily routine',
      difficulty: 'beginner',
      steps: JSON.stringify([
        'Get morning sunlight within 30-60 minutes of waking (10-30 min)',
        'Delay caffeine 90-120 minutes after waking',
        'Get afternoon sunlight (optional but helpful)',
        'Avoid caffeine after 2 PM',
        'Dim lights after sunset',
        'Cool bedroom (60-67°F / 15-19°C)',
        'Consistent sleep/wake times',
      ]),
      benefits: JSON.stringify([
        'Improved sleep quality',
        'Faster sleep onset',
        'Better daytime alertness',
        'Regulated circadian rhythm',
      ]),
      equipment: JSON.stringify(['None required']),
      references: JSON.stringify(['https://hubermanlab.com']),
      featured: true,
    },
    {
      slug: 'zone-2-training',
      name: 'Zone 2 Cardio Training',
      description: 'Low-intensity cardiovascular exercise for metabolic health and mitochondrial function. Popularized by longevity experts like Peter Attia.',
      pillar: 'physicality',
      duration: '3-4 sessions per week, 45-60 min each',
      difficulty: 'beginner',
      steps: JSON.stringify([
        'Find your Zone 2 heart rate (180 - age, or use lactate testing)',
        'Choose activity: cycling, rowing, running, swimming',
        'Maintain steady Zone 2 heart rate for duration',
        'Should be able to hold a conversation (nasal breathing)',
      ]),
      benefits: JSON.stringify([
        'Improved mitochondrial function',
        'Better fat oxidation',
        'Enhanced cardiovascular health',
        'Increased aerobic capacity',
        'Longevity benefits',
      ]),
      equipment: JSON.stringify(['Heart rate monitor', 'Cardio equipment (bike, rower, treadmill, etc.)']),
      references: JSON.stringify(['https://peterattiamd.com']),
      featured: true,
    },
    {
      id: crypto.randomUUID(),
      slug: 'grease-the-groove',
      name: 'Grease the Groove (GTG)',
      description: 'Neurological strength training method developed by Pavel Tsatsouline that builds strength through frequent, sub-maximal practice throughout the day. Based on the principle that "strength is a skill," GTG leverages neural adaptation and myelination to improve motor unit recruitment without muscle fatigue or hypertrophy.',
      pillar: 'physicality',
      creator: 'Pavel Tsatsouline',
      duration: 'Ongoing daily practice (5-15 sets spread throughout the day)',
      difficulty: 'beginner',
      steps: JSON.stringify([
        'Choose one exercise to focus on (pull-ups, push-ups, dips, pistol squats, or kettlebell presses)',
        'Test your max reps with perfect form',
        'Perform 40-80% of your max per set, spread throughout the day (every 30-90 minutes)',
        'Never train to failure — every rep should feel smooth and controlled',
        'Rest fully between sets — you should feel fresh, not fatigued',
        'Place equipment in high-traffic areas (e.g., pull-up bar in a doorway)',
        'Retest your max every 2-4 weeks and adjust working reps',
      ]),
      benefits: JSON.stringify([
        'Rapid strength gains through neural adaptation',
        'Improves neuromuscular efficiency via myelination',
        'Fits into any schedule — no dedicated gym time required',
        'Builds perfect movement patterns through fatigue-free repetitions',
        'Complements existing training without adding recovery burden',
      ]),
      risks: JSON.stringify([
        'Never train to failure — trains your nervous system to fail',
        'Not designed for muscle hypertrophy',
        'Improvements are exercise-specific and do not transfer broadly',
      ]),
      equipment: JSON.stringify(['Pull-up bar', 'Kettlebell (optional)', 'Timer or reminder app (optional)']),
      references: JSON.stringify([
        'Pavel Tsatsouline — "Power to the People"',
        'Pavel Tsatsouline — "The Naked Warrior"',
      ]),
      featured: true,
      updatedAt: new Date(),
    },
  ]

  for (const protocol of protocols) {
    const exists = await prisma.protocol.findUnique({ where: { slug: protocol.slug } })
    if (!exists) {
      await prisma.protocol.create({ data: protocol })
      console.log(`  ✅ ${protocol.name}`)
    } else {
      console.log(`  ⏭️  ${protocol.name} (exists)`)
    }
  }

  console.log('\n✅ Directory seeding complete!')
  
  const [peopleCount, orgCount, protocolCount] = await Promise.all([
    prisma.person.count({ where: { title: { not: 'Author' } } }),
    prisma.organization.count(),
    prisma.protocol.count(),
  ])
  
  console.log(`\n📊 Summary:`)
  console.log(`  People: ${peopleCount}`)
  console.log(`  Organizations: ${orgCount}`)
  console.log(`  Protocols: ${protocolCount}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
