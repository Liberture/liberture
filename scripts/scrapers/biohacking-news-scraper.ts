import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

interface Article {
  title: string;
  url: string;
  content: string;
  pillar: string;
  publishedAt: Date;
}

async function scrapeBiohackingNews() {
  console.log('🔍 Scraping BiohackingNews.org...');
  
  const baseUrl = 'https://biohackingnews.org';
  
  try {
    // Fetch the homepage
    const response = await fetch(baseUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const articles: Article[] = [];
    
    // Parse article listings (adjust selectors based on actual site structure)
    $('article, .post, .entry').each((i, elem) => {
      const $elem = $(elem);
      const title = $elem.find('h2, h3, .title').first().text().trim();
      const link = $elem.find('a').first().attr('href');
      const excerpt = $elem.find('.excerpt, .summary, p').first().text().trim();
      
      if (title && link) {
        const fullUrl = link.startsWith('http') ? link : `${baseUrl}${link}`;
        
        // Determine pillar from content keywords
        let pillar = 'Cognition'; // Default
        const lowerContent = (title + ' ' + excerpt).toLowerCase();
        
        if (lowerContent.includes('sleep') || lowerContent.includes('recovery')) {
          pillar = 'Recovery';
        } else if (lowerContent.includes('nutrition') || lowerContent.includes('supplement') || lowerContent.includes('diet')) {
          pillar = 'Fueling';
        } else if (lowerContent.includes('mental') || lowerContent.includes('meditation') || lowerContent.includes('stress')) {
          pillar = 'Mental';
        } else if (lowerContent.includes('exercise') || lowerContent.includes('training') || lowerContent.includes('workout')) {
          pillar = 'Physicality';
        } else if (lowerContent.includes('finance') || lowerContent.includes('money') || lowerContent.includes('wealth')) {
          pillar = 'Finance';
        }
        
        articles.push({
          title,
          url: fullUrl,
          content: excerpt,
          pillar,
          publishedAt: new Date()
        });
      }
    });
    
    console.log(`📄 Found ${articles.length} articles`);
    
    // Save to database
    let saved = 0;
    for (const article of articles.slice(0, 10)) { // Limit to 10 per run
      // Check if already scraped
      const existing = await prisma.scrapedContent.findFirst({
        where: { sourceUrl: article.url }
      });
      
      if (!existing) {
        await prisma.scrapedContent.create({
          data: {
            id: Math.random().toString(36).substring(2, 15),
            source: 'biohackingnews.org',
            sourceUrl: article.url,
            rawContent: article.content,
            contentType: 'article',
            targetEntity: 'knowledge_article',
            extractedData: {
              title: article.title,
              pillar: article.pillar,
              publishedAt: article.publishedAt.toISOString()
            },
            needsParaphrasing: true,
            enrichmentStatus: 'pending',
            scrapedAt: new Date(),
            updatedAt: new Date()
          }
        });
        saved++;
      }
    }
    
    console.log(`✅ Saved ${saved} new articles for AI enrichment`);
    
  } catch (error) {
    console.error('❌ Scraping error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

scrapeBiohackingNews();
