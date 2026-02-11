import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Load PERPLEXITY_API_KEY from .env.local
let PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

if (!PERPLEXITY_API_KEY) {
  try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/PERPLEXITY_API_KEY=(.+)/);
    if (match) {
      PERPLEXITY_API_KEY = match[1].trim();
    }
  } catch (e) {
    console.error('Could not read .env.local file');
  }
}

const prisma = new PrismaClient();

interface PersonToEnrich {
  id: string;
  name: string;
  slug: string;
  title: string;
  bio: string;
  pillars: string;
  expertise: string;
}

async function generateCompellingBio(person: PersonToEnrich): Promise<string | null> {
  if (!PERPLEXITY_API_KEY) {
    console.error('⚠️  PERPLEXITY_API_KEY not found in environment');
    return null;
  }

  const prompt = `You are a compelling biographer for Liberture, a biohacking and human optimization platform.

Rewrite this person's biography to be:
1. ENGAGING and story-driven (not dry Wikipedia style)
2. FOCUSED on why they matter for human optimization/biohacking/consciousness
3. HIGHLIGHT their breakthrough insights or revolutionary contributions
4. 200-400 words maximum
5. Written in present tense, active voice
6. Include specific achievements or key ideas
7. Connect their work to practical biohacking applications

Person: ${person.name}
Title: ${person.title}
Focus Areas: ${person.pillars}
Expertise: ${person.expertise}

Current Bio (Wikipedia extract):
${person.bio}

Write a compelling biography that makes someone excited to learn more about this person. Focus on:
- What makes them revolutionary?
- What's their key breakthrough insight?
- Why do they matter for someone optimizing their health, performance, or consciousness?
- What practical impact have they had?

Write ONLY the biography, no preamble or meta-commentary.`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are an expert biographer specializing in human optimization, biohacking, and consciousness. Write compelling, story-driven biographies that inspire readers.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error(`   ❌ Perplexity API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const enrichedBio = data.choices[0]?.message?.content;

    if (!enrichedBio) {
      console.error('   ❌ No bio generated');
      return null;
    }

    return enrichedBio.trim();
  } catch (error) {
    console.error('   ❌ Error calling Perplexity API:', error);
    return null;
  }
}

async function enrichBiosWithAI() {
  console.log('🎨 Enriching bios with AI-generated compelling versions...\n');

  try {
    // Get people with Wikipedia bios (they need enrichment)
    const people = await prisma.person.findMany({
      where: {
        wikipedia: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        title: true,
        bio: true,
        pillars: true,
        expertise: true,
      },
      orderBy: {
        featured: 'desc', // Process featured people first
      },
    });

    console.log(`Found ${people.length} people to enrich\n`);

    // Check for API key
    if (!PERPLEXITY_API_KEY) {
      console.error('❌ PERPLEXITY_API_KEY environment variable not set');
      console.log('Set it in .env.local:');
      console.log('PERPLEXITY_API_KEY=your_key_here');
      return;
    }

    let enriched = 0;
    let failed = 0;
    let skipped = 0;

    for (const person of people) {
      console.log(`\n📝 ${person.name}`);
      console.log(`   Title: ${person.title}`);
      console.log(`   Current bio length: ${person.bio.length} chars`);

      // Generate compelling bio
      const compellingBio = await generateCompellingBio(person);

      if (!compellingBio) {
        console.log('   ⏭️  Failed to generate, skipping');
        failed++;
        continue;
      }

      console.log(`   ✅ Generated compelling bio (${compellingBio.length} chars)`);
      console.log(`\n   Preview:`);
      console.log(`   ${compellingBio.substring(0, 200)}...`);

      // Save to review file
      const reviewFile = path.resolve(__dirname, 'bio-enrichment-review.jsonl');
      
      const entry = {
        slug: person.slug,
        name: person.name,
        title: person.title,
        originalBio: person.bio,
        enrichedBio: compellingBio,
        originalLength: person.bio.length,
        enrichedLength: compellingBio.length,
        timestamp: new Date().toISOString(),
      };
      
      fs.appendFileSync(reviewFile, JSON.stringify(entry) + '\n');
      
      enriched++;

      // Rate limiting - be nice to Perplexity API
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 seconds between requests
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   ✅ Enriched: ${enriched}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📝 Total: ${people.length}`);
    
    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Review the generated bios (check output above)`);
    console.log(`   2. Decide which ones to use`);
    console.log(`   3. Run update script to replace original bios`);

  } catch (error) {
    console.error('❌ Error during enrichment:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

enrichBiosWithAI();
