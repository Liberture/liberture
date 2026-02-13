import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addArticles() {
  const generateId = () => Math.random().toString(36).substring(2, 15);

  const articles = [
    {
      id: generateId(),
      title: 'Red Light Therapy: Science-Backed Benefits for Recovery',
      description: 'How red and near-infrared light therapy reduces inflammation, speeds healing, and improves mitochondrial function.',
      pillar: 'Recovery',
      tags: 'red-light, photobiomodulation, recovery, inflammation, mitochondria',
      author: 'Liberture Team',
      readTime: 6,
      url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6280109/',
      slug: 'red-light-therapy-benefits',
    },
    {
      id: generateId(),
      title: 'Zone 2 Training: Building Metabolic Flexibility',
      description: 'The science of low-intensity aerobic training for fat adaptation, mitochondrial health, and endurance performance.',
      pillar: 'Physicality',
      tags: 'zone-2, cardio, endurance, mitochondria, metabolic-flexibility',
      author: 'Liberture Team',
      readTime: 5,
      url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5470532/',
      slug: 'zone-2-training-metabolic-flexibility',
    },
    {
      id: generateId(),
      title: 'Magnesium: The Most Underrated Mineral',
      description: 'Why 50% of people are deficient in magnesium and how it affects sleep, stress, muscle function, and heart health.',
      pillar: 'Fueling',
      tags: 'magnesium, minerals, supplements, sleep, muscle-recovery',
      author: 'Liberture Team',
      readTime: 5,
      url: 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/',
      slug: 'magnesium-underrated-mineral',
    },
    {
      id: generateId(),
      title: 'Building Financial Independence: The FIRE Movement',
      description: 'Practical strategies for achieving financial independence and retiring early through frugality, investing, and passive income.',
      pillar: 'Finance',
      tags: 'fire, financial-independence, investing, passive-income, retirement',
      author: 'Liberture Team',
      readTime: 8,
      url: 'https://www.mrmoneymustache.com/2012/01/13/the-shockingly-simple-math-behind-early-retirement/',
      slug: 'fire-movement-financial-independence',
    },
    {
      id: generateId(),
      title: 'Intermittent Fasting: Protocols and Science',
      description: 'Evidence-based guide to time-restricted eating, autophagy, metabolic benefits, and how to choose the right fasting protocol.',
      pillar: 'Fueling',
      tags: 'fasting, intermittent-fasting, autophagy, metabolism, nutrition',
      author: 'Liberture Team',
      readTime: 7,
      url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6314618/',
      slug: 'intermittent-fasting-protocols-science',
    }
  ];

  for (const article of articles) {
    await prisma.knowledgeArticle.create({
      data: {
        ...article,
        publishedAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`✅ Added: ${article.title}`);
  }

  console.log(`\n✅ Added ${articles.length} new knowledge articles`);
}

addArticles()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
