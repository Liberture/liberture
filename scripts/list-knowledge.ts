import { prisma } from '../lib/prisma';

async function main() {
  const articles = await prisma.knowledge.findMany({
    select: { id: true, title: true, pillar: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`\nCurrent knowledge articles: ${articles.length}\n`);
  articles.forEach(a => console.log(`- [${a.pillar}] ${a.title}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
