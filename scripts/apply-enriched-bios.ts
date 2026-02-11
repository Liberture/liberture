import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as readline from 'readline';

const prisma = new PrismaClient();

async function applyEnrichedBios() {
  console.log('📝 Applying enriched bios from review file...\n');

  const reviewFile = '/root/liberture/scripts/bio-enrichment-review.jsonl';

  if (!fs.existsSync(reviewFile)) {
    console.error('❌ Review file not found: ' + reviewFile);
    console.log('Run enrich-bios-ai.ts first to generate enriched bios');
    return;
  }

  const fileStream = fs.createReadStream(reviewFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let applied = 0;
  let skipped = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    const entry = JSON.parse(line);
    
    console.log(`\n📖 ${entry.name}`);
    console.log(`   Slug: ${entry.slug}`);
    console.log(`   Original: ${entry.originalLength} chars`);
    console.log(`   Enriched: ${entry.enrichedLength} chars`);

    try {
      await prisma.person.update({
        where: { slug: entry.slug },
        data: {
          bio: entry.enrichedBio,
          updatedAt: new Date(),
        },
      });

      console.log(`   ✅ Applied`);
      applied++;
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      skipped++;
    }
  }

  console.log(`\n\n📊 Summary:`);
  console.log(`   ✅ Applied: ${applied}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);

  await prisma.$disconnect();
}

applyEnrichedBios();
