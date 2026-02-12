#!/usr/bin/env tsx
/**
 * Reddit r/Biohacking Scraper
 * 
 * Scrapes top posts from r/Biohacking for content ideas and discussions
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

interface RedditPost {
  title: string;
  url: string;
  selftext: string;
  score: number;
  created: number;
}

async function scrapeReddit() {
  console.log('🔍 Scraping r/Biohacking...');
  
  try {
    // Reddit JSON API (no auth needed for public data)
    const response = await fetch('https://www.reddit.com/r/Biohacking/top.json?t=week&limit=25', {
      headers: {
        'User-Agent': 'Liberture Content Scraper/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Reddit API returned ${response.status}`);
    }
    
    const data = await response.json();
    const posts: RedditPost[] = data.data.children.map((child: any) => child.data);
    
    console.log(`📄 Found ${posts.length} top posts from this week`);
    
    const articles: any[] = [];
    
    for (const post of posts) {
      // Skip if no text content
      if (!post.selftext || post.selftext.length < 100) continue;
      
      // Skip if already scraped
      const existing = await prisma.scrapedContent.findFirst({
        where: { sourceUrl: post.url }
      });
      
      if (existing) continue;
      
      // Determine pillar from title + content
      const text = (post.title + ' ' + post.selftext).toLowerCase();
      let pillar = 'Cognition'; // Default
      
      if (text.includes('sleep') || text.includes('recovery') || text.includes('rest')) {
        pillar = 'Recovery';
      } else if (text.includes('food') || text.includes('nutrition') || text.includes('supplement') || text.includes('diet')) {
        pillar = 'Fueling';
      } else if (text.includes('mental') || text.includes('stress') || text.includes('anxiety') || text.includes('meditation')) {
        pillar = 'Mental';
      } else if (text.includes('exercise') || text.includes('training') || text.includes('workout') || text.includes('strength')) {
        pillar = 'Physicality';
      } else if (text.includes('money') || text.includes('financial') || text.includes('invest')) {
        pillar = 'Finance';
      }
      
      articles.push({
        title: post.title,
        url: post.url,
        content: post.selftext.substring(0, 500), // First 500 chars
        pillar,
        score: post.score
      });
    }
    
    console.log(`\n✅ Found ${articles.length} new posts to enrich`);
    
    // Save to database
    let saved = 0;
    for (const article of articles.slice(0, 10)) { // Max 10 per run
      await prisma.scrapedContent.create({
        data: {
          id: Math.random().toString(36).substring(2, 15),
          source: 'reddit.com/r/Biohacking',
          sourceUrl: article.url,
          rawContent: article.content,
          contentType: 'article',
          targetEntity: 'knowledge_article',
          extractedData: {
            title: article.title,
            pillar: article.pillar,
            score: article.score
          },
          needsParaphrasing: true,
          enrichmentStatus: 'pending',
          scrapedAt: new Date(),
          updatedAt: new Date()
        }
      });
      saved++;
    }
    
    console.log(`✅ Saved ${saved} posts for AI enrichment`);
    
  } catch (error) {
    console.error('❌ Scraping error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

scrapeReddit();
