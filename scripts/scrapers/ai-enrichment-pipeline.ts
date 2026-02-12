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

async function enrichScrapedContent() {
  console.log('🤖 Starting AI enrichment pipeline...');
  
  // Get pending content
  const pending = await prisma.scrapedContent.findMany({
    where: {
      enrichmentStatus: 'pending',
      needsParaphrasing: true,
      publishedToDb: false
    },
    take: 5 // Process 5 at a time
  });
  
  console.log(`📋 Found ${pending.length} items to enrich`);
  
  if (pending.length === 0) {
    console.log('✅ No pending enrichments');
    await prisma.$disconnect();
    return;
  }
  
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
  
  if (!PERPLEXITY_API_KEY) {
    console.error('❌ PERPLEXITY_API_KEY not found in environment');
    await prisma.$disconnect();
    return;
  }
  
  for (const item of pending) {
    console.log(`\n🔄 Enriching: ${(item.extractedData as any)?.title || item.id}`);
    
    try {
      // Mark as processing
      await prisma.scrapedContent.update({
        where: { id: item.id },
        data: { enrichmentStatus: 'processing' }
      });
      
      // Prepare prompt based on content type
      let prompt = '';
      const extracted = item.extractedData as any;
      
      if (item.contentType === 'article') {
        prompt = `You are a biohacking content writer. Rewrite and expand the following article excerpt into a comprehensive, original article (500-800 words) suitable for a biohacking knowledge base.

Original Title: ${extracted?.title || 'Untitled'}
Original Source: ${item.sourceUrl}
Excerpt: ${item.rawContent}

Requirements:
1. Completely rewrite in your own words (avoid plagiarism)
2. Expand with additional context and scientific backing
3. Make it engaging and educational
4. Include actionable takeaways
5. **Include 3-5 external links to authoritative sources** (PubMed studies, NIH, scientific journals, reputable health sites)
6. **Add inline markdown links** like [study name](URL) throughout the article
7. **Add a "References" section at the end** with numbered sources
8. Maintain accuracy
9. Format in clean markdown

Example link format:
- Inline: "Research shows [intermittent fasting increases autophagy](https://pubmed.ncbi.nlm.nih.gov/12345678/)"
- References section:
  1. [Study Title](https://pubmed.ncbi.nlm.nih.gov/12345678/) - Journal Name, Year
  2. [Resource Title](https://example.com) - Organization, Year

Return ONLY the rewritten article content with links, no explanations.`;
      }
      
      // Call Perplexity API
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are a biohacking expert and science writer. Rewrite content to be original, accurate, and engaging.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });
      
      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }
      
      const data = await response.json();
      const enrichedContent = data.choices[0].message.content;
      
      // Update with enriched content
      await prisma.scrapedContent.update({
        where: { id: item.id },
        data: {
          paraphrasedContent: enrichedContent,
          enrichmentStatus: 'completed',
          enrichedBy: 'perplexity-sonar',
          enrichedAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Enriched successfully`);
      
      // Wait 2 seconds between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error enriching ${item.id}:`, error);
      
      await prisma.scrapedContent.update({
        where: { id: item.id },
        data: {
          enrichmentStatus: 'failed',
          updatedAt: new Date()
        }
      });
    }
  }
  
  console.log('\n✅ Enrichment pipeline complete');
  await prisma.$disconnect();
}

enrichScrapedContent();
