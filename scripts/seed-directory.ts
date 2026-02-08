import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding directory...')

  // Add prominent biohackers and health experts
  const people = [
    {
      slug: 'wim-hof',
      name: 'Wim Hof',
      title: 'The Iceman',
      bio: 'Extreme athlete known for his ability to withstand freezing temperatures. Developer of the Wim Hof Method combining cold exposure, breathing techniques, and commitment.',
      pillars: 'Recovery,Mental,Physicality',
      expertise: 'Cold exposure, breathwork, mental resilience',
      followers: '4M+ (Instagram)',
      website: 'https://www.wimhofmethod.com',
      instagram: 'iceman_hof',
      youtube: '@wimhof',
      achievements: JSON.stringify([
        '26 Guinness World Records',
        'Climbed Mount Kilimanjaro in shorts',
        'Ran a half marathon above the Arctic Circle barefoot',
        'Demonstrated immune system control in lab studies'
      ]),
      protocols: JSON.stringify(['wim-hof-method']),
      featured: true
    },
    {
      slug: 'andrew-huberman',
      name: 'Andrew Huberman',
      title: 'Neuroscientist, Stanford Professor',
      bio: 'Professor of Neurobiology and Ophthalmology at Stanford. Host of Huberman Lab podcast, translating neuroscience into actionable protocols for sleep, focus, and performance.',
      pillars: 'Cognition,Recovery,Mental',
      expertise: 'Neuroscience, sleep optimization, neuroplasticity, performance protocols',
      followers: '5M+ (Instagram)',
      website: 'https://hubermanlab.com',
      twitter: 'hubermanlab',
      instagram: 'hubermanlab',
      youtube: '@hubermanlab',
      podcast: 'Huberman Lab',
      achievements: JSON.stringify([
        'McKnight Foundation Neuroscience Scholar Award',
        'Pew Charitable Trust Fellow',
        '100+ peer-reviewed publications',
        'Huberman Lab podcast: 100M+ downloads'
      ]),
      protocols: JSON.stringify(['huberman-sleep-protocol', 'nsdr-protocol']),
      featured: true
    },
    {
      slug: 'peter-attia',
      name: 'Peter Attia',
      title: 'Physician, Longevity Expert',
      bio: 'Physician focused on longevity science. Author of "Outlive" and host of The Drive podcast. Specializes in healthspan extension through exercise, nutrition, and metabolic health.',
      pillars: 'Recovery,Fueling,Physicality',
      expertise: 'Longevity, metabolic health, exercise science, cardiovascular health',
      followers: '1M+ (Twitter)',
      website: 'https://peterattiamd.com',
      twitter: 'PeterAttiaMD',
      podcast: 'The Drive',
      achievements: JSON.stringify([
        'NYT Bestselling author (Outlive)',
        'Former Johns Hopkins surgical resident',
        'Former consultant to XPRIZE Foundation',
        'Pioneer in continuous glucose monitoring'
      ]),
      featured: true
    },
    {
      slug: 'rhonda-patrick',
      name: 'Rhonda Patrick',
      title: 'PhD, Biomedical Scientist',
      bio: 'Biomedical scientist focused on nutritional health and aging. Creator of FoundMyFitness, making complex health science accessible through evidence-based content.',
      pillars: 'Cognition,Recovery,Fueling',
      expertise: 'Nutrigenomics, micronutrient optimization, healthspan, sauna therapy',
      followers: '1M+ (Instagram)',
      website: 'https://www.foundmyfitness.com',
      twitter: 'FoundMyFitness',
      instagram: 'foundmyfitness',
      youtube: '@FoundMyFitness',
      achievements: JSON.stringify([
        'PhD in Biomedical Science from University of Tennessee',
        'Postdoctoral research at Children\'s Hospital Oakland Research Institute',
        'FoundMyFitness platform with millions of views',
        'Pioneer in sauna and heat stress research'
      ]),
      featured: true
    },
    {
      slug: 'bryan-johnson',
      name: 'Bryan Johnson',
      title: 'Entrepreneur, Blueprint Protocol Creator',
      bio: 'Tech entrepreneur investing $2M+/year in age reversal. Creator of Blueprint protocol for systematic whole-body regeneration using data-driven interventions.',
      pillars: 'Recovery,Fueling,Physicality,Cognition',
      expertise: 'Age reversal, quantified self, systematic optimization, data-driven health',
      followers: '800K+ (Twitter)',
      website: 'https://blueprint.bryanjohnson.co',
      twitter: 'bryan_johnson',
      instagram: 'bryanjohnson_',
      achievements: JSON.stringify([
        'Founded Braintree (sold to PayPal for $800M)',
        'Blueprint protocol: reversing biological age',
        'Documented speed of aging: 0.76 (slower than average)',
        'Open-sourced his entire health protocol'
      ]),
      protocols: JSON.stringify(['blueprint-protocol']),
      featured: true
    },
    {
      slug: 'david-sinclair',
      name: 'David Sinclair',
      title: 'PhD, Harvard Genetics Professor',
      bio: 'Professor of Genetics at Harvard Medical School. Author of "Lifespan" and leading researcher in aging biology, focusing on NAD+ boosters and longevity interventions.',
      pillars: 'Recovery,Fueling,Cognition',
      expertise: 'Aging biology, NAD+ metabolism, sirtuins, longevity science',
      followers: '500K+ (Twitter)',
      website: 'https://genetics.med.harvard.edu/sinclair/',
      twitter: 'davidasinclair',
      podcast: 'Lifespan Podcast',
      achievements: JSON.stringify([
        'NYT Bestselling author (Lifespan)',
        'Co-founder of multiple biotech companies',
        'Named by Time as one of the 100 most influential people',
        'Pioneer in NAD+ and resveratrol research'
      ]),
      featured: true
    },
    {
      slug: 'matthew-walker',
      name: 'Matthew Walker',
      title: 'PhD, Sleep Scientist',
      bio: 'Professor of Neuroscience and Psychology at UC Berkeley. Author of "Why We Sleep", the definitive guide to sleep science and optimization.',
      pillars: 'Recovery,Mental,Cognition',
      expertise: 'Sleep science, circadian rhythms, sleep optimization, dream research',
      followers: '200K+ (Twitter)',
      website: 'https://www.sleepdiplomat.com',
      twitter: 'sleepdiplomat',
      achievements: JSON.stringify([
        'NYT Bestselling author (Why We Sleep)',
        'Director of UC Berkeley Sleep and Neuroimaging Lab',
        'Featured on major podcasts (Rogan, Huberman, Attia)',
        'Pioneering research on sleep deprivation effects'
      ]),
      featured: true
    },
    {
      slug: 'james-nestor',
      name: 'James Nestor',
      title: 'Author, Journalist',
      bio: 'Science journalist and author of "Breath: The New Science of a Lost Art". Explores the forgotten art of breathing and its profound impacts on health.',
      pillars: 'Recovery,Mental,Physicality',
      expertise: 'Breathwork, nasal breathing, pranayama, respiratory health',
      followers: '100K+ (Instagram)',
      website: 'https://www.mrjamesnestor.com',
      twitter: 'mrjamesnestor',
      instagram: 'mrjamesnestor',
      achievements: JSON.stringify([
        'NYT Bestselling author (Breath)',
        'Investigative reporting on freediving and breathing',
        'Featured in Outside, Scientific American, The Atlantic',
        'Transformed breathing science into accessible practice'
      ]),
      featured: true
    }
  ]

  for (const person of people) {
    await prisma.person.upsert({
      where: { slug: person.slug },
      update: person,
      create: person
    })
  }

  console.log(`✅ Added ${people.length} people`)

  // Add key organizations
  const organizations = [
    {
      slug: 'examine-com',
      name: 'Examine.com',
      description: 'Independent organization analyzing health and nutrition research. No ads, no sponsored content—just evidence-based supplement and nutrition information.',
      pillars: 'Fueling,Cognition,Recovery',
      type: 'research',
      founded: '2011',
      website: 'https://examine.com',
      resources: JSON.stringify([
        'Supplement Database (1000+ supplements)',
        'Nutrition Guides',
        'Study Summaries',
        'Evidence-Based Ratings'
      ]),
      featured: true
    },
    {
      slug: 'foundmyfitness',
      name: 'FoundMyFitness',
      description: 'Science-based health platform by Dr. Rhonda Patrick. Provides in-depth analysis of nutrition, genetics, and healthspan research.',
      pillars: 'Cognition,Recovery,Fueling',
      type: 'platform',
      founded: '2014',
      website: 'https://www.foundmyfitness.com',
      resources: JSON.stringify([
        'Comprehensive health reports',
        'Genetics analysis tools',
        'Podcast episodes with researchers',
        'Scientific summaries and infographics'
      ]),
      keyPeople: JSON.stringify(['rhonda-patrick']),
      featured: true
    },
    {
      slug: 'quantified-self',
      name: 'Quantified Self',
      description: 'International community of users and makers of self-tracking tools. Focused on self-knowledge through numbers and personal data.',
      pillars: 'Cognition,Recovery,Physicality',
      type: 'community',
      founded: '2007',
      website: 'https://quantifiedself.com',
      resources: JSON.stringify([
        'Global meetups and conferences',
        'Self-tracking tools directory',
        'Research collaboration',
        'Personal data ethics discussions'
      ]),
      featured: false
    },
    {
      slug: 'lifespan-io',
      name: 'Lifespan.io',
      description: 'Non-profit organization promoting increased healthy human lifespan through advancement of rejuvenation biotechnology.',
      pillars: 'Recovery,Fueling',
      type: 'research',
      founded: '2014',
      website: 'https://www.lifespan.io',
      resources: JSON.stringify([
        'Longevity research news',
        'Crowdfunding for aging research',
        'Rejuvenation Roadmap',
        'Scientific publications'
      ]),
      featured: true
    }
  ]

  for (const org of organizations) {
    await prisma.organization.upsert({
      where: { slug: org.slug },
      update: org,
      create: org
    })
  }

  console.log(`✅ Added ${organizations.length} organizations`)

  // Add protocols
  const protocols = [
    {
      slug: 'wim-hof-method',
      name: 'Wim Hof Method',
      description: 'Three-pillar approach combining specific breathing techniques, cold exposure, and commitment for improved immune function, energy, and mental clarity.',
      pillar: 'Recovery',
      creator: 'wim-hof',
      duration: '15-30 min daily',
      difficulty: 'beginner',
      steps: JSON.stringify([
        'Breathing: 30-40 deep breaths (inhale fully, exhale passively)',
        'Retention: Hold breath after last exhale for as long as comfortable',
        'Recovery breath: Inhale fully and hold for 10-15 seconds',
        'Repeat 3-4 rounds',
        'Cold exposure: Cold shower 30s-2min or ice bath 2-5min'
      ]),
      benefits: JSON.stringify([
        'Improved immune response',
        'Increased energy and focus',
        'Reduced stress and inflammation',
        'Better sleep quality',
        'Enhanced mood and mental resilience'
      ]),
      risks: JSON.stringify([
        'Never practice breathing exercises in water',
        'Not recommended for pregnant women',
        'Consult doctor if you have cardiovascular conditions',
        'Cold exposure: start gradually'
      ]),
      equipment: JSON.stringify([
        'Cold shower or ice bath',
        'Timer (optional)',
        'Comfortable space to lie down'
      ]),
      references: JSON.stringify([
        'https://www.wimhofmethod.com/practice-the-method',
        'https://pubmed.ncbi.nlm.nih.gov/24799686/ (immune study)'
      ]),
      featured: true
    },
    {
      slug: 'huberman-sleep-protocol',
      name: 'Huberman Lab Sleep Protocol',
      description: 'Science-based protocol for optimizing sleep quality and duration, developed by neuroscientist Andrew Huberman.',
      pillar: 'Recovery',
      creator: 'andrew-huberman',
      duration: '24-hour cycle',
      difficulty: 'beginner',
      steps: JSON.stringify([
        'Morning: View bright light within 30-60 min of waking (10-30 min outdoors)',
        'Delay caffeine 90-120 min after waking',
        'Afternoon: View afternoon/evening light before sunset',
        'Evening: Dim lights 2-3 hours before bed',
        'Avoid bright light 10pm-4am (use red light if needed)',
        'Cool sleeping environment (65-68°F / 18-20°C)',
        'Supplements (optional): Magnesium threonate, L-theanine, Apigenin'
      ]),
      benefits: JSON.stringify([
        'Improved sleep onset and depth',
        'Better circadian rhythm alignment',
        'Increased daytime alertness',
        'Enhanced learning and memory',
        'Mood stabilization'
      ]),
      equipment: JSON.stringify([
        'Access to outdoor light or bright light therapy lamp',
        'Blackout curtains or eye mask',
        'Room thermometer'
      ]),
      references: JSON.stringify([
        'https://hubermanlab.com/toolkit-for-sleep/',
        'Huberman Lab Podcast Episode #2'
      ]),
      featured: true
    },
    {
      slug: 'zone-2-training',
      name: 'Zone 2 Cardio Training',
      description: 'Low-intensity aerobic exercise for mitochondrial health, fat oxidation, and longevity. Popularized by Peter Attia and Iñigo San Millán.',
      pillar: 'Physicality',
      creator: 'peter-attia',
      duration: '45-60 min, 3-4x per week',
      difficulty: 'beginner',
      steps: JSON.stringify([
        'Determine Zone 2 heart rate: typically 60-70% of max HR, or lactate threshold ~2 mmol/L',
        'Choose activity: cycling, rowing, jogging, swimming',
        'Maintain steady pace where you can still hold a conversation',
        'Monitor heart rate to stay in zone',
        'Duration: minimum 45 min, ideally 60-90 min',
        'Consistency: 3-4 sessions per week minimum'
      ]),
      benefits: JSON.stringify([
        'Improved mitochondrial function',
        'Enhanced fat oxidation',
        'Increased aerobic capacity',
        'Longevity benefits',
        'Metabolic flexibility',
        'Cardiovascular health'
      ]),
      equipment: JSON.stringify([
        'Heart rate monitor',
        'Activity tracker (optional)',
        'Bike, treadmill, rowing machine, or outdoor access'
      ]),
      references: JSON.stringify([
        'https://peterattiamd.com/exercise-zone-2/',
        'Iñigo San-Millán research on Zone 2'
      ]),
      featured: true
    }
  ]

  for (const protocol of protocols) {
    await prisma.protocol.upsert({
      where: { slug: protocol.slug },
      update: protocol,
      create: protocol
    })
  }

  console.log(`✅ Added ${protocols.length} protocols`)

  // Add books
  const books = [
    {
      slug: 'why-we-sleep',
      title: 'Why We Sleep: Unlocking the Power of Sleep and Dreams',
      author: 'Matthew Walker',
      description: 'Comprehensive exploration of sleep science, revealing why sleep is essential for every aspect of our physical and mental health.',
      pillars: 'Recovery,Mental,Cognition',
      year: 2017,
      pages: 368,
      isbn: '978-1501144318',
      amazonUrl: 'https://www.amazon.com/Why-We-Sleep-Unlocking-Dreams/dp/1501144316',
      rating: 4.6,
      keyTakeaways: JSON.stringify([
        'Adults need 7-9 hours of sleep; chronic deprivation has serious health consequences',
        'REM sleep is crucial for emotional processing and creativity',
        'Deep sleep clears brain toxins and consolidates memories',
        'Blue light exposure before bed disrupts circadian rhythm',
        'Alcohol disrupts REM sleep even if it helps you fall asleep'
      ]),
      forWho: 'Anyone wanting to understand sleep science and optimize their rest. Essential reading for those struggling with sleep or interested in cognitive performance.',
      featured: true
    },
    {
      slug: 'lifespan',
      title: 'Lifespan: Why We Age—and Why We Don\'t Have To',
      author: 'David Sinclair',
      description: 'Groundbreaking look at aging biology and interventions that may extend healthy lifespan, from a leading Harvard researcher.',
      pillars: 'Recovery,Fueling,Cognition',
      year: 2019,
      pages: 432,
      isbn: '978-1501191978',
      amazonUrl: 'https://www.amazon.com/Lifespan-Why-Age-Dont-Have/dp/1501191977',
      rating: 4.5,
      keyTakeaways: JSON.stringify([
        'Aging is a disease that can be treated, not an inevitability',
        'Sirtuins and NAD+ play crucial roles in longevity pathways',
        'Caloric restriction and fasting activate longevity genes',
        'Metformin and resveratrol show promise for healthspan extension',
        'Information theory of aging: epigenetic changes drive aging'
      ]),
      forWho: 'Readers interested in cutting-edge longevity science and practical interventions for healthspan extension.',
      featured: true
    },
    {
      slug: 'breath',
      title: 'Breath: The New Science of a Lost Art',
      author: 'James Nestor',
      description: 'Journey into the forgotten science of breathing, revealing how proper breathing can transform health, performance, and longevity.',
      pillars: 'Recovery,Mental,Physicality',
      year: 2020,
      pages: 304,
      isbn: '978-0735213616',
      amazonUrl: 'https://www.amazon.com/Breath-New-Science-Lost-Art/dp/0735213615',
      rating: 4.7,
      keyTakeaways: JSON.stringify([
        'Modern humans breathe incorrectly; mouth breathing causes health issues',
        'Nasal breathing improves oxygen absorption and nitric oxide production',
        'Slow breathing activates parasympathetic nervous system',
        'Ancient breathing techniques have measurable health benefits',
        'Chewing hard foods can improve airway development'
      ]),
      forWho: 'Anyone interested in breathwork, respiratory health, or simple interventions with profound health impacts.',
      featured: true
    },
    {
      slug: 'outlive',
      title: 'Outlive: The Science and Art of Longevity',
      author: 'Peter Attia',
      description: 'Evidence-based approach to extending healthspan through exercise, nutrition, sleep, and metabolic health optimization.',
      pillars: 'Recovery,Fueling,Physicality',
      year: 2023,
      pages: 496,
      isbn: '978-0593236598',
      amazonUrl: 'https://www.amazon.com/Outlive-Science-Art-Longevity/dp/0593236599',
      rating: 4.8,
      keyTakeaways: JSON.stringify([
        'Medicine 3.0: prevention and optimization over reactive treatment',
        'The Four Horsemen of death: heart disease, cancer, neurodegenerative disease, metabolic dysfunction',
        'Exercise is the most powerful longevity drug',
        'Zone 2 cardio and strength training are essential',
        'Continuous glucose monitoring reveals metabolic health'
      ]),
      forWho: 'Health-conscious individuals seeking comprehensive, science-based longevity strategies from a leading physician.',
      featured: true
    }
  ]

  for (const book of books) {
    await prisma.book.upsert({
      where: { slug: book.slug },
      update: book,
      create: book
    })
  }

  console.log(`✅ Added ${books.length} books`)

  console.log('✨ Directory seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
