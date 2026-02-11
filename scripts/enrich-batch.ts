import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EnrichmentResult {
  wikipedia?: string | null;
  achievements?: string[];
  publications?: string[];
  speakingEvents?: string[];
}

async function verifyWikipediaUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

async function enrichPerson(person: any): Promise<EnrichmentResult | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.error('❌ PERPLEXITY_API_KEY not set');
    return null;
  }

  const prompt = `Research ${person.name} in the context of biohacking, health optimization, longevity, and wellness.

Provide:
1. Wikipedia URL (verify it exists and is correct)
2. Notable achievements (5-8 items, be specific)
3. Major publications (books, research papers)
4. Speaking events/podcast appearances (notable ones)

Return in JSON format:
{
  "wikipedia": "https://en.wikipedia.org/wiki/...",
  "achievements": ["achievement 1", "achievement 2"],
  "publications": ["publication 1"],
  "speakingEvents": ["event 1"]
}

Be factual and specific. Only include verified information.`;

  try {
    console.log(`  🔍 Researching ${person.name}...`);
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error(`  ❌ Perplexity API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Extract JSON from markdown code blocks or raw response
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || content.match(/(\{[\s\S]*\})/);
    
    if (!jsonMatch) {
      console.error(`  ❌ No JSON found in response`);
      return null;
    }

    const result = JSON.parse(jsonMatch[1]);
    
    // Verify Wikipedia URL
    if (result.wikipedia) {
      const isValid = await verifyWikipediaUrl(result.wikipedia);
      if (!isValid) {
        console.warn(`  ⚠️  Wikipedia URL invalid, removing: ${result.wikipedia}`);
        result.wikipedia = null;
      }
    }

    return {
      wikipedia: result.wikipedia || null,
      achievements: Array.isArray(result.achievements) ? result.achievements : [],
      publications: Array.isArray(result.publications) ? result.publications : [],
      speakingEvents: Array.isArray(result.speakingEvents) ? result.speakingEvents : [],
    };
  } catch (error) {
    console.error(`  ❌ Error enriching ${person.name}:`, error);
    return null;
  }
}

async function main() {
  console.log('🔄 Starting batch enrichment...\n');

  // Fetch people with missing Wikipedia
  const people = await prisma.person.findMany({
    where: { wikipedia: null },
    select: { id: true, name: true, slug: true, achievements: true },
  });

  console.log(`📋 Found ${people.length} people to enrich\n`);

  let enriched = 0;
  let failed = 0;

  // Process in batches of 5 with delays to avoid rate limits
  const batchSize = 5;
  
  for (let i = 0; i < people.length; i += batchSize) {
    const batch = people.slice(i, i + batchSize);
    console.log(`\n🔬 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(people.length / batchSize)}`);
    
    for (const person of batch) {
      const result = await enrichPerson(person);
      
      if (result) {
        // Update database
        await prisma.person.update({
          where: { id: person.id },
          data: {
            wikipedia: result.wikipedia,
            achievements: result.achievements.length > 0 
              ? JSON.stringify(result.achievements) 
              : person.achievements, // Keep existing if no new ones
            publications: result.publications.length > 0 
              ? JSON.stringify(result.publications) 
              : undefined,
            speakingEvents: result.speakingEvents.length > 0 
              ? JSON.stringify(result.speakingEvents) 
              : undefined,
          },
        });

        // Log enrichment
        await prisma.enrichmentLog.create({
          data: {
            id: `enrich_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            entityType: 'person',
            entityId: person.id,
            entityName: person.name,
            fieldsAdded: JSON.stringify({
              wikipedia: !!result.wikipedia,
              achievements: result.achievements.length,
              publications: result.publications.length,
              speakingEvents: result.speakingEvents.length,
            }),
            source: 'perplexity',
            enrichedBy: 'robert-claw',
          },
        });

        console.log(`  ✅ ${person.name} - ${result.wikipedia ? 'Wikipedia' : 'No Wikipedia'}, ${result.achievements.length} achievements`);
        enriched++;
      } else {
        console.log(`  ❌ ${person.name} - Failed`);
        failed++;
      }

      // Small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Longer delay between batches
    if (i + batchSize < people.length) {
      console.log('\n⏳ Waiting 10s before next batch...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  console.log(`\n✨ Enrichment complete!`);
  console.log(`   ✅ Enriched: ${enriched}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
