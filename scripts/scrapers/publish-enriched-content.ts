import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env.local manually
const envPath = join(__dirname, '../../.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      // Strip surrounding quotes if present
      let cleanValue = value.trim();
      if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
          (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
        cleanValue = cleanValue.slice(1, -1);
      }
      process.env[key.trim()] = cleanValue;
    }
  });
} catch (e) {
  console.warn('Could not load .env.local');
}

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function publishEnrichedContent() {
  console.log('📤 Publishing enriched content to knowledge base...');
  
  // Get completed, unpublished content
  const ready = await prisma.scrapedContent.findMany({
    where: {
      enrichmentStatus: 'completed',
      publishedToDb: false,
      paraphrasedContent: { not: null }
    },
    take: 10 // Publish 10 at a time
  });
  
  console.log(`📋 Found ${ready.length} articles ready to publish`);
  
  if (ready.length === 0) {
    console.log('✅ No articles ready to publish');
    await prisma.$disconnect();
    return;
  }
  
  let published = 0;
  
  for (const item of ready) {
    try {
      const extracted = item.extractedData as any;
      const title = extracted?.title || 'Untitled Article';
      const pillar = extracted?.pillar || 'Cognition';
      const slug = slugify(title);
      
      // Check if slug already exists
      const existing = await prisma.knowledgeArticle.findUnique({
        where: { slug }
      });
      
      if (existing) {
        console.log(`⚠️  Slug "${slug}" already exists, skipping`);
        continue;
      }
      
      // Estimate read time (words / 200 wpm)
      const wordCount = item.paraphrasedContent!.split(/\s+/).length;
      const readTime = Math.max(1, Math.round(wordCount / 200));
      
      // Create knowledge article
      const article = await prisma.knowledgeArticle.create({
        data: {
          id: Math.random().toString(36).substring(2, 15),
          title,
          description: item.paraphrasedContent!.substring(0, 200) + '...',
          pillar,
          tags: `${pillar.toLowerCase()}, biohacking, health, ${item.source}`,
          author: 'Liberture Team',
          readTime,
          url: item.sourceUrl,
          publishedAt: new Date(),
          slug,
          updatedAt: new Date()
        }
      });
      
      // Mark as published
      await prisma.scrapedContent.update({
        where: { id: item.id },
        data: {
          publishedToDb: true,
          publishedEntityId: article.id,
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Published: ${title}`);
      published++;
      
    } catch (error) {
      console.error(`❌ Error publishing ${item.id}:`, error);
    }
  }
  
  console.log(`\n✅ Published ${published} articles to knowledge base`);
  await prisma.$disconnect();
}

publishEnrichedContent();
