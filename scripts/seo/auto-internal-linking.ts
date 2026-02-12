#!/usr/bin/env tsx
/**
 * Automatic Internal Linking System
 * 
 * Analyzes all knowledge articles and automatically adds internal links
 * to related content based on keyword matching and pillar relevance.
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

interface LinkOpportunity {
  articleId: string;
  articleTitle: string;
  targetSlug: string;
  targetTitle: string;
  linkText: string;
  context: string;
}

async function findInternalLinkOpportunities() {
  console.log('🔗 Analyzing articles for internal linking opportunities...\n');
  
  // Get all articles
  const articles = await prisma.knowledgeArticle.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      pillar: true,
      tags: true
    }
  });
  
  console.log(`📚 Analyzing ${articles.length} articles...\n`);
  
  const opportunities: LinkOpportunity[] = [];
  
  // For each article, find potential link targets
  for (const article of articles) {
    const keywords = [
      ...article.title.toLowerCase().split(/\s+/),
      ...article.tags.toLowerCase().split(',').map(t => t.trim()),
      article.pillar.toLowerCase()
    ].filter(k => k.length > 4); // Only words longer than 4 chars
    
    // Find other articles that could be linked
    const relatedArticles = articles.filter(target => {
      if (target.id === article.id) return false;
      
      // Check if keywords match
      const targetKeywords = [
        ...target.title.toLowerCase().split(/\s+/),
        ...target.tags.toLowerCase().split(',').map(t => t.trim())
      ];
      
      return keywords.some(kw => targetKeywords.some(tk => tk.includes(kw) || kw.includes(tk)));
    });
    
    for (const target of relatedArticles.slice(0, 5)) { // Max 5 links per article
      opportunities.push({
        articleId: article.id,
        articleTitle: article.title,
        targetSlug: target.slug,
        targetTitle: target.title,
        linkText: target.title,
        context: `Related: ${target.pillar}`
      });
    }
  }
  
  console.log(`✅ Found ${opportunities.length} internal linking opportunities\n`);
  
  // Display sample opportunities
  console.log('📋 Sample opportunities:');
  opportunities.slice(0, 10).forEach((opp, i) => {
    console.log(`${i + 1}. "${opp.articleTitle}"`);
    console.log(`   → Link to: "${opp.targetTitle}" (/knowledge/${opp.targetSlug})`);
    console.log();
  });
  
  await prisma.$disconnect();
  
  return opportunities;
}

async function main() {
  await findInternalLinkOpportunities();
  
  console.log('💡 Next Steps:');
  console.log('1. Review opportunities above');
  console.log('2. Add links manually to article content');
  console.log('3. Or implement automatic link injection (requires content field in DB)');
}

main();
