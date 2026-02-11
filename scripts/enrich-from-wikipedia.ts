import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WikipediaExtract {
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
  };
  pageimage?: string;
}

async function fetchWikipediaData(wikipediaUrl: string): Promise<WikipediaExtract | null> {
  try {
    // Extract page title from URL
    const urlParts = wikipediaUrl.split('/wiki/');
    if (urlParts.length < 2) {
      console.log(`  ⚠️  Invalid Wikipedia URL format: ${wikipediaUrl}`);
      return null;
    }
    
    const pageTitle = decodeURIComponent(urlParts[1]);
    
    // Fetch from Wikipedia API
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Liberture/1.0 (https://liberture.com; info@liberture.com)',
      },
    });

    if (!response.ok) {
      console.log(`  ⚠️  Wikipedia API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return {
      title: data.title,
      extract: data.extract,
      thumbnail: data.thumbnail,
      pageimage: data.pageimage,
    };
  } catch (error) {
    console.error(`  ❌ Error fetching Wikipedia data:`, error);
    return null;
  }
}

async function enrichFromWikipedia() {
  console.log('🔄 Enriching people profiles from Wikipedia...\n');

  try {
    // Get all people with Wikipedia URLs but potentially incomplete data
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
        bio: true,
        wikipedia: true,
        imageUrl: true,
      },
    });

    console.log(`Found ${people.length} people with Wikipedia links\n`);

    let enriched = 0;
    let skipped = 0;

    for (const person of people) {
      console.log(`\n📖 ${person.name}`);
      console.log(`   Wikipedia: ${person.wikipedia}`);

      // Fetch Wikipedia data
      const wikiData = await fetchWikipediaData(person.wikipedia!);

      if (!wikiData) {
        console.log(`   ⏭️  Skipped (could not fetch data)`);
        skipped++;
        continue;
      }

      const updates: any = {};

      // Enrich bio if it's short or generic
      if (!person.bio || person.bio.length < 100) {
        updates.bio = wikiData.extract;
        console.log(`   ✅ Updated bio (${wikiData.extract.length} chars)`);
      }

      // Add image if missing
      if (!person.imageUrl && wikiData.thumbnail) {
        updates.imageUrl = wikiData.thumbnail.source;
        console.log(`   ✅ Added image: ${wikiData.thumbnail.source}`);
      }

      // Update if we have changes
      if (Object.keys(updates).length > 0) {
        await prisma.person.update({
          where: { id: person.id },
          data: updates,
        });
        enriched++;
        console.log(`   ✨ Enriched`);
      } else {
        console.log(`   ⏭️  Skipped (already complete)`);
        skipped++;
      }

      // Be nice to Wikipedia API
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Enriched: ${enriched}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${people.length}`);
  } catch (error) {
    console.error('❌ Error during enrichment:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

enrichFromWikipedia();
