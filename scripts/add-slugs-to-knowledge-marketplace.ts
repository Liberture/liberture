import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

async function addSlugs() {
  console.log('Adding slugs to KnowledgeArticles...');
  
  // Get all knowledge articles
  const articles = await prisma.$queryRaw<any[]>`
    SELECT id, title FROM "KnowledgeArticle"
  `;
  
  console.log(`Found ${articles.length} knowledge articles`);
  
  for (const article of articles) {
    let slug = createSlug(article.title);
    let counter = 1;
    
    // Check if slug exists
    while (true) {
      const existing = await prisma.$queryRaw<any[]>`
        SELECT id FROM "KnowledgeArticle" WHERE slug = ${slug}
      `;
      
      if (existing.length === 0) break;
      
      slug = `${createSlug(article.title)}-${counter}`;
      counter++;
    }
    
    await prisma.$executeRaw`
      UPDATE "KnowledgeArticle" 
      SET slug = ${slug} 
      WHERE id = ${article.id}
    `;
    
    console.log(`  ✓ ${article.title} -> ${slug}`);
  }
  
  console.log('\nAdding slugs to MarketplaceItems...');
  
  // Get all marketplace items
  const items = await prisma.$queryRaw<any[]>`
    SELECT id, title FROM "MarketplaceItem"
  `;
  
  console.log(`Found ${items.length} marketplace items`);
  
  for (const item of items) {
    let slug = createSlug(item.title);
    let counter = 1;
    
    // Check if slug exists
    while (true) {
      const existing = await prisma.$queryRaw<any[]>`
        SELECT id FROM "MarketplaceItem" WHERE slug = ${slug}
      `;
      
      if (existing.length === 0) break;
      
      slug = `${createSlug(item.title)}-${counter}`;
      counter++;
    }
    
    await prisma.$executeRaw`
      UPDATE "MarketplaceItem" 
      SET slug = ${slug} 
      WHERE id = ${item.id}
    `;
    
    console.log(`  ✓ ${item.title} -> ${slug}`);
  }
  
  console.log('\n✅ All slugs added!');
}

addSlugs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
