import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addArticles() {
  const generateId = () => Math.random().toString(36).substring(2, 15);

  // Article 1: Adaptogens Guide
  const adaptogen = await prisma.knowledgeArticle.create({
    data: {
      id: generateId(),
      title: 'Adaptogens: Nature\'s Stress-Fighting Herbs',
      description: 'A comprehensive guide to adaptogenic herbs that help your body resist physical, chemical, and biological stressors.',
      pillar: 'Cognition',
      tags: 'adaptogens, stress, supplements, herbs, cognition',
      author: 'Liberture Team',
      readTime: 6,
      url: 'https://examine.com/supplements/ashwagandha/',
      publishedAt: new Date(),
      slug: 'adaptogens-stress-fighting-herbs',
      updatedAt: new Date()
    }
  });

  // Article 2: Journaling for Mental Clarity
  const journaling = await prisma.knowledgeArticle.create({
    data: {
      id: generateId(),
      title: 'Journaling for Mental Clarity: Science-Backed Techniques',
      description: 'Evidence-based journaling practices to reduce stress, improve decision-making, and enhance emotional regulation.',
      pillar: 'Mental',
      tags: 'journaling, mental-health, mindfulness, productivity',
      author: 'Liberture Team',
      readTime: 7,
      url: 'https://www.apa.org/topics/mental-health/journaling',
      publishedAt: new Date(),
      slug: 'journaling-mental-clarity-techniques',
      updatedAt: new Date()
    }
  });

  // Article 3: Vitamin D Supplementation
  const vitaminD = await prisma.knowledgeArticle.create({
    data: {
      id: generateId(),
      title: 'Vitamin D: The Sunshine Vitamin for Immunity and Mood',
      description: 'Why vitamin D deficiency is so common and how to optimize your levels naturally and through supplementation.',
      pillar: 'Fueling',
      tags: 'vitamin-d, supplements, immunity, mood, bone-health',
      author: 'Liberture Team',
      readTime: 5,
      url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3356951/',
      publishedAt: new Date(),
      slug: 'vitamin-d-sunshine-vitamin',
      updatedAt: new Date()
    }
  });

  console.log('✅ Added 3 articles:');
  console.log(`  - ${adaptogen.title}`);
  console.log(`  - ${journaling.title}`);
  console.log(`  - ${vitaminD.title}`);
}

addArticles()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
