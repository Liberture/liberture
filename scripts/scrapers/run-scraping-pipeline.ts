#!/usr/bin/env tsx
/**
 * Master scraping + AI enrichment + publishing pipeline
 * 
 * Usage:
 *   npm run scrape         # Scrape new content
 *   npm run enrich         # AI paraphrase scraped content
 *   npm run publish        # Publish enriched content to DB
 *   npm run scrape-full    # Run all 3 steps
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runCommand(command: string, description: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 ${description}`);
  console.log(`${'='.repeat(60)}\n`);
  
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: '/root/liberture' });
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`✅ ${description} complete`);
  } catch (error: any) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'scrape';
  
  console.log('🦞 Liberture Content Scraping Pipeline');
  console.log(`Mode: ${mode}\n`);
  
  try {
    switch (mode) {
      case 'scrape':
        await runCommand(
          'npx tsx scripts/scrapers/biohacking-news-scraper.ts',
          'Step 1: Scraping Content'
        );
        break;
        
      case 'enrich':
        await runCommand(
          'npx tsx scripts/scrapers/ai-enrichment-pipeline.ts',
          'Step 2: AI Enrichment & Paraphrasing'
        );
        break;
        
      case 'publish':
        await runCommand(
          'npx tsx scripts/scrapers/publish-enriched-content.ts',
          'Step 3: Publishing to Knowledge Base'
        );
        break;
        
      case 'full':
        await runCommand(
          'npx tsx scripts/scrapers/biohacking-news-scraper.ts',
          'Step 1: Scraping Content'
        );
        await runCommand(
          'npx tsx scripts/scrapers/ai-enrichment-pipeline.ts',
          'Step 2: AI Enrichment & Paraphrasing'
        );
        await runCommand(
          'npx tsx scripts/scrapers/publish-enriched-content.ts',
          'Step 3: Publishing to Knowledge Base'
        );
        break;
        
      default:
        console.error('❌ Unknown mode. Use: scrape | enrich | publish | full');
        process.exit(1);
    }
    
    console.log('\n✅ Pipeline complete!');
    
  } catch (error) {
    console.error('\n❌ Pipeline failed');
    process.exit(1);
  }
}

main();
