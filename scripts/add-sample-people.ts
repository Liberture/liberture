import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Note: These tables don't exist in the schema yet, but this script is ready
// when we add them. For now, this serves as documentation of the structure.

const samplePeople = [
  {
    slug: 'wim-hof',
    name: 'Wim Hof',
    bio: 'Dutch motivational speaker and extreme athlete known for his ability to withstand extreme cold. Developer of the Wim Hof Method combining cold exposure, breathing techniques, and commitment.',
    title: 'The Iceman',
    website: 'https://www.wimhofmethod.com',
    twitter: 'iceman_hof',
    focus: JSON.stringify(['cold-exposure', 'breathwork', 'mental-resilience']),
    pillars: JSON.stringify(['Recovery', 'Mental', 'Physicality']),
    achievements: JSON.stringify([
      'Climbed Mount Kilimanjaro in shorts',
      '26 Guinness World Records',
      'Developed scientifically validated method'
    ]),
    verified: true,
  },
  {
    slug: 'andrew-huberman',
    name: 'Dr. Andrew Huberman',
    bio: 'Neuroscientist and professor at Stanford University. Host of the Huberman Lab podcast, translating neuroscience research into practical protocols for optimizing brain and body.',
    title: 'Neuroscientist & Professor',
    website: 'https://hubermanlab.com',
    twitter: 'hubermanlab',
    focus: JSON.stringify(['neuroscience', 'sleep', 'focus', 'protocols']),
    pillars: JSON.stringify(['Cognition', 'Recovery', 'Mental']),
    achievements: JSON.stringify([
      'Stanford Professor of Neurobiology',
      'Top science podcast globally',
      'McKnight Foundation Scholar'
    ]),
    verified: true,
  },
  {
    slug: 'rhonda-patrick',
    name: 'Dr. Rhonda Patrick',
    bio: 'Biomedical scientist focused on aging, nutrition, and metabolic disease. Host of FoundMyFitness, sharing evidence-based health information and longevity protocols.',
    title: 'Biomedical Scientist',
    website: 'https://www.foundmyfitness.com',
    twitter: 'foundmyfitness',
    focus: JSON.stringify(['longevity', 'nutrition', 'supplementation', 'sauna']),
    pillars: JSON.stringify(['Fueling', 'Recovery', 'Cognition']),
    achievements: JSON.stringify([
      'PhD in Biomedical Science',
      'Researched aging at CHORI',
      'Popular science communicator'
    ]),
    verified: true,
  },
];

async function main() {
  console.log('Sample people data ready for when Person table is added to schema')
  console.log(`\nWould add ${samplePeople.length} people:`)
  samplePeople.forEach(person => {
    console.log(`- ${person.name} (${person.slug})`)
  })
  
  // Uncomment when Person table exists:
  /*
  for (const person of samplePeople) {
    await prisma.person.create({ data: person })
    console.log(`✅ Added: ${person.name}`)
  }
  */
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
