#!/usr/bin/env tsx
/**
 * Migrate content from ScrapedContent to KnowledgeArticle
 * 
 * Copies the paraphrasedContent from scraped articles into the 
 * knowledge article content field so we can inject internal links.
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment
const envPath = join(__dirname, '../../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const [, key, value] = match;
    let cleanValue = value.trim();
    if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
        (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
      cleanValue = cleanValue.slice(1, -1);
    }
    process.env[key.trim()] = cleanValue;
  }
});

const prisma = new PrismaClient();

async function migrateContent() {
  console.log('🔄 Migrating scraped content to knowledge articles...\n');
  
  // Get all published scraped content
  const scrapedArticles = await prisma.scrapedContent.findMany({
    where: {
      publishedToDb: true,
      paraphrasedContent: { not: null }
    },
    select: {
      publishedEntityId: true,
      paraphrasedContent: true,
      extractedData: true
    }
  });
  
  console.log(`📚 Found ${scrapedArticles.length} scraped articles with content\n`);
  
  let migrated = 0;
  
  for (const scraped of scrapedArticles) {
    if (!scraped.publishedEntityId || !scraped.paraphrasedContent) continue;
    
    try {
      // Update the knowledge article with content
      await prisma.knowledgeArticle.update({
        where: { id: scraped.publishedEntityId },
        data: {
          content: scraped.paraphrasedContent,
          updatedAt: new Date()
        }
      });
      
      const title = (scraped.extractedData as any)?.title || 'Unknown';
      console.log(`✅ Migrated: ${title}`);
      migrated++;
      
    } catch (error) {
      console.error(`❌ Failed to migrate ${scraped.publishedEntityId}:`, error);
    }
  }
  
  console.log(`\n✅ Migration complete! ${migrated} articles now have content`);
  
  await prisma.$disconnect();
}

migrateContent();
