import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const philosophers = [
  {
    name: 'Alan Watts',
    slug: 'alan-watts',
    title: 'Philosopher, Writer, Speaker',
    bio: 'British philosopher who interpreted Eastern philosophy for a Western audience. Known for popularizing Zen Buddhism and exploring consciousness, the nature of reality, and the human experience.',
    pillars: 'Mental',
    expertise: 'Eastern Philosophy, Zen Buddhism, Consciousness, Meditation',
    category: 'author',
    wikipedia: 'https://en.wikipedia.org/wiki/Alan_Watts',
    featured: true,
  },
  {
    name: 'Jiddu Krishnamurti',
    slug: 'jiddu-krishnamurti',
    title: 'Philosopher, Spiritual Teacher',
    bio: 'Indian philosopher and spiritual teacher who emphasized the need for a revolution in the psyche of every human being. Taught psychological revolution, freedom from conditioning, and the nature of consciousness.',
    pillars: 'Mental',
    expertise: 'Consciousness, Meditation, Self-Inquiry, Psychological Freedom',
    category: 'author',
    wikipedia: 'https://en.wikipedia.org/wiki/Jiddu_Krishnamurti',
    featured: true,
  },
  {
    name: 'Aldous Huxley',
    slug: 'aldous-huxley',
    title: 'Philosopher, Writer, Author of Brave New World',
    bio: 'English writer and philosopher who explored human consciousness, mysticism, and psychedelics. Author of "The Doors of Perception" and pioneered discussions on expanded consciousness and human potential.',
    pillars: 'Mental, Cognition',
    expertise: 'Consciousness Studies, Mysticism, Psychedelics, Philosophy',
    category: 'author',
    wikipedia: 'https://en.wikipedia.org/wiki/Aldous_Huxley',
    featured: true,
  },
  {
    name: 'Terence McKenna',
    slug: 'terence-mckenna',
    title: 'Ethnobotanist, Psychonaut, Philosopher',
    bio: 'American ethnobotanist, mystic, and advocate for the exploration of altered states of consciousness through psychedelics. Developed theories on consciousness, language, and human evolution.',
    pillars: 'Mental, Cognition',
    expertise: 'Ethnobotany, Psychedelics, Consciousness, Philosophy',
    category: 'practitioner',
    wikipedia: 'https://en.wikipedia.org/wiki/Terence_McKenna',
    featured: true,
  },
  {
    name: 'Carl Jung',
    slug: 'carl-jung',
    title: 'Psychiatrist, Psychoanalyst, Founder of Analytical Psychology',
    bio: 'Swiss psychiatrist who founded analytical psychology. Explored the unconscious mind, archetypes, collective unconscious, and the process of individuation. His work bridges psychology, philosophy, and spirituality.',
    pillars: 'Mental',
    expertise: 'Depth Psychology, Archetypes, Shadow Work, Dream Analysis',
    category: 'author',
    wikipedia: 'https://en.wikipedia.org/wiki/Carl_Jung',
    featured: true,
  },
  {
    name: 'Ram Dass',
    slug: 'ram-dass',
    title: 'Spiritual Teacher, Psychologist, Author',
    bio: 'American spiritual teacher and author of "Be Here Now". Former Harvard psychologist who explored consciousness through Eastern spirituality, meditation, and psychedelics. Taught love, service, and present-moment awareness.',
    pillars: 'Mental',
    expertise: 'Spirituality, Meditation, Consciousness, Compassion',
    category: 'author',
    wikipedia: 'https://en.wikipedia.org/wiki/Ram_Dass',
    featured: true,
  },
  {
    name: 'Eckhart Tolle',
    slug: 'eckhart-tolle',
    title: 'Spiritual Teacher, Author of The Power of Now',
    bio: 'German-born spiritual teacher and author. Known for teachings on presence, ego transcendence, and awakening. Author of "The Power of Now" and "A New Earth", emphasizing consciousness and living in the present moment.',
    pillars: 'Mental',
    expertise: 'Presence, Mindfulness, Spiritual Awakening, Ego Transcendence',
    category: 'author',
    wikipedia: 'https://en.wikipedia.org/wiki/Eckhart_Tolle',
    featured: true,
  },
  {
    name: 'Stanislav Grof',
    slug: 'stanislav-grof',
    title: 'Psychiatrist, Consciousness Researcher',
    bio: 'Czech psychiatrist and pioneer in consciousness research. Developed holotropic breathwork and conducted extensive research on non-ordinary states of consciousness, psychedelics, and transpersonal psychology.',
    pillars: 'Mental, Cognition',
    expertise: 'Consciousness Research, Holotropic Breathwork, Transpersonal Psychology',
    category: 'practitioner',
    wikipedia: 'https://en.wikipedia.org/wiki/Stanislav_Grof',
    featured: true,
  },
];

async function addPhilosophers() {
  console.log('🧠 Adding philosopher profiles...\n');

  try {
    for (const philosopher of philosophers) {
      const existing = await prisma.person.findUnique({
        where: { slug: philosopher.slug },
      });

      if (existing) {
        console.log(`⏭️  Skipping ${philosopher.name} (already exists)`);
        continue;
      }

      await prisma.person.create({
        data: {
          id: `person-${philosopher.slug}`,
          ...philosopher,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Added ${philosopher.name}`);
    }

    const total = await prisma.person.count();
    console.log(`\n📊 Total people in database: ${total}`);
  } catch (error) {
    console.error('❌ Error adding philosophers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addPhilosophers();
