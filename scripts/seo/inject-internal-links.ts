#!/usr/bin/env tsx
/**
 * Automatic Internal Link Injection
 * 
 * Finds related articles and automatically injects markdown links
 * into article content for SEO and user navigation.
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

interface LinkInjection {
  articleId: string;
  articleTitle: string;
  targetSlug: string;
  targetTitle: string;
  linksAdded: number;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function injectLink(content: string, keyword: string, url: string, title: string): { content: string; injected: boolean } {
  // Don't inject if link already exists
  if (content.includes(`](/knowledge/${url})`)) {
    return { content, injected: false };
  }
  
  // Don't inject if keyword is already part of a link
  const linkPattern = /\[([^\]]+)\]\([^\)]+\)/g;
  const existingLinks = content.match(linkPattern) || [];
  for (const link of existingLinks) {
    if (link.toLowerCase().includes(keyword.toLowerCase())) {
      return { content, injected: false };
    }
  }
  
  // Find first occurrence of keyword (case-insensitive, whole word)
  const regex = new RegExp(`\\b(${escapeRegex(keyword)})\\b`, 'i');
  const match = content.match(regex);
  
  if (!match) {
    return { content, injected: false };
  }
  
  // Replace with markdown link
  const replacement = `[${match[1]}](/knowledge/${url} "${title}")`;
  const updatedContent = content.replace(regex, replacement);
  
  return { content: updatedContent, injected: true };
}

async function injectInternalLinks() {
  console.log('🔗 Injecting internal links into articles...\n');
  
  // Get all articles with content
  const articles = await prisma.knowledgeArticle.findMany({
    where: {
      content: { not: null }
    },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      pillar: true,
      tags: true
    }
  });
  
  console.log(`📚 Processing ${articles.length} articles with content\n`);
  
  // Get all possible link targets
  const allArticles = await prisma.knowledgeArticle.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      pillar: true,
      tags: true
    }
  });
  
  const results: LinkInjection[] = [];
  
  for (const article of articles) {
    if (!article.content) continue;
    
    let updatedContent = article.content;
    let linksAdded = 0;
    
    // Find related articles (same pillar or overlapping tags)
    const keywords = article.tags.toLowerCase().split(',').map(t => t.trim());
    
    const relatedArticles = allArticles
      .filter(target => {
        if (target.id === article.id) return false;
        
        // Check if same pillar or overlapping tags
        if (target.pillar === article.pillar) return true;
        
        const targetTags = target.tags.toLowerCase().split(',').map(t => t.trim());
        return keywords.some(kw => targetTags.some(tt => tt.includes(kw) || kw.includes(tt)));
      })
      .slice(0, 5); // Max 5 links per article
    
    // Try to inject links for related articles
    for (const target of relatedArticles) {
      // Try linking with article title keywords
      const titleWords = target.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 4); // Only words > 4 chars
      
      for (const word of titleWords) {
        const result = injectLink(updatedContent, word, target.slug, target.title);
        if (result.injected) {
          updatedContent = result.content;
          linksAdded++;
          break; // Only one link per target article
        }
      }
      
      if (linksAdded >= 5) break; // Max 5 links
    }
    
    // Update article if links were added
    if (linksAdded > 0) {
      await prisma.knowledgeArticle.update({
        where: { id: article.id },
        data: {
          content: updatedContent,
          updatedAt: new Date()
        }
      });
      
      results.push({
        articleId: article.id,
        articleTitle: article.title,
        targetSlug: article.slug,
        targetTitle: article.title,
        linksAdded
      });
      
      console.log(`✅ ${article.title}`);
      console.log(`   Added ${linksAdded} internal links\n`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Injection complete!`);
  console.log(`   Articles processed: ${articles.length}`);
  console.log(`   Articles updated: ${results.length}`);
  console.log(`   Total links added: ${results.reduce((sum, r) => sum + r.linksAdded, 0)}`);
  console.log('='.repeat(60));
  
  await prisma.$disconnect();
}

injectInternalLinks();
