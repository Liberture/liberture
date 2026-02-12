# Scraping + AI Enrichment System

## Overview

Automated content pipeline for Liberture that:
1. **Scrapes** biohacking content from top platforms
2. **Paraphrases** using AI (Perplexity) to avoid plagiarism
3. **Enriches** with additional context and scientific backing
4. **Publishes** to the knowledge base

## Database Schema

New `ScrapedContent` table tracks the pipeline:

```typescript
{
  id: string
  source: string              // 'biohackingnews.org', 'examine.com', etc.
  sourceUrl: string           // Original article URL
  rawContent: string          // Scraped excerpt/content
  contentType: string         // 'article', 'person_bio', 'protocol', etc.
  targetEntity: string?       // 'knowledge_article', 'person', 'book', etc.
  extractedData: json         // Structured data (title, pillar, dates)
  needsParaphrasing: boolean  // Flag for AI rewriting
  paraphrasedContent: string? // AI-enriched version
  enrichmentStatus: string    // 'pending', 'processing', 'completed', 'failed'
  enrichedBy: string?         // 'perplexity-sonar'
  enrichedAt: datetime
  publishedToDb: boolean      // Published to knowledge base?
  publishedEntityId: string?  // ID of created knowledge article
  scrapedAt: datetime
}
```

## Architecture

### 1. Scrapers (`scripts/scrapers/`)

**BiohackingNews Scraper:**
- Scrapes articles from biohackingnews.org
- Extracts: title, URL, excerpt, pillar (auto-detected)
- Saves to `ScrapedContent` with `needsParaphrasing: true`
- Avoids duplicates (checks sourceUrl)

**Future Scrapers:**
- Examine.com (supplement guides)
- FoundMyFitness (protocols, research summaries)
- Huberman Lab (podcast transcripts)
- Reddit r/Biohacking (top posts)

### 2. AI Enrichment Pipeline

**Process:**
1. Fetch pending items (`enrichmentStatus: 'pending'`)
2. For each item, call Perplexity API with:
   - Model: `sonar` (research-backed responses)
   - Temperature: 0.3 (factual, less creative)
   - Prompt: Rewrite in original words, expand with context
3. Save paraphrased content
4. Mark as `enrichmentStatus: 'completed'`

**Cost:** ~$0.0005 per article (Perplexity sonar pricing)

**Rate Limits:** 2-second delay between requests

### 3. Publisher

**Process:**
1. Fetch completed items (`enrichmentStatus: 'completed'`, `publishedToDb: false`)
2. Create `KnowledgeArticle` entry
3. Generate slug from title
4. Calculate read time (words / 200 wpm)
5. Mark `ScrapedContent` as published

## Usage

### Manual Run

```bash
# Step 1: Scrape content
cd /root/liberture && npx tsx scripts/scrapers/biohacking-news-scraper.ts

# Step 2: AI enrich
cd /root/liberture && npx tsx scripts/scrapers/ai-enrichment-pipeline.ts

# Step 3: Publish to DB
cd /root/liberture && npx tsx scripts/scrapers/publish-enriched-content.ts
```

### Master Pipeline

```bash
# Run full pipeline (scrape → enrich → publish)
cd /root/liberture && npx tsx scripts/scrapers/run-scraping-pipeline.ts full

# Individual steps
npx tsx scripts/scrapers/run-scraping-pipeline.ts scrape
npx tsx scripts/scrapers/run-scraping-pipeline.ts enrich
npx tsx scripts/scrapers/run-scraping-pipeline.ts publish
```

### Add to Heartbeat

Add to `HEARTBEAT.md` (2-3x per week):

```bash
## Scraping Pipeline (2-3x per week)

Run full scraping pipeline:
```
cd /root/liberture && npx tsx scripts/scrapers/run-scraping-pipeline.ts full
```

Track in heartbeat-state.json under "lastScraping"
```

## Target Platforms

### Tier 1 (High Priority)
- ✅ **BiohackingNews.org** - Daily articles (implemented)
- 🔲 **Examine.com** - Supplement database
- 🔲 **FoundMyFitness** - Research summaries
- 🔲 **Huberman Lab** - Podcast transcripts

### Tier 2 (Medium Priority)
- 🔲 **Reddit r/Biohacking** - Community insights
- 🔲 **Lifespan.io** - Longevity research
- 🔲 **PubMed** - Scientific papers (abstracts)
- 🔲 **Ben Greenfield** - Protocol guides

### Tier 3 (Nice to Have)
- 🔲 **Dave Asprey** - Blog posts
- 🔲 **Tim Ferriss** - Blog experiments
- 🔲 **Peter Attia** - Newsletter archives

## Anti-Plagiarism Strategy

1. **Scrape only excerpts/summaries** (100-300 words)
2. **AI rewrites completely** (500-800 words, expanded)
3. **Link to original source** (attribution + SEO juice)
4. **Add original insights** (AI adds context, actionable tips)
5. **Manual review option** (flag questionable content)

## Quality Control

**Before Publishing:**
- [ ] Check for duplicate slugs
- [ ] Verify pillar assignment
- [ ] Ensure proper attribution
- [ ] Test links (sourceUrl should be valid)
- [ ] Read time should be reasonable (3-10 min)

**Metrics to Track:**
- Articles scraped per week
- Enrichment success rate
- Publishing rate
- Average read time
- Most popular pillars

## Next Steps

1. ✅ Add 5 manual articles (Red Light, Zone 2, Magnesium, FIRE, Fasting)
2. ⏳ Test BiohackingNews scraper
3. ⏳ Run AI enrichment on test batch
4. ⏳ Publish 3-5 enriched articles
5. 🔲 Add Examine.com scraper
6. 🔲 Add to weekly heartbeat routine
7. 🔲 Build admin dashboard to review scraped content

## Files

```
liberture/
├── prisma/
│   ├── schema.prisma (+ ScrapedContent model)
│   └── migrations/add_scraped_content.sql
├── scripts/
│   ├── add-more-knowledge.ts (manual articles)
│   └── scrapers/
│       ├── biohacking-news-scraper.ts
│       ├── ai-enrichment-pipeline.ts
│       ├── publish-enriched-content.ts
│       └── run-scraping-pipeline.ts (master)
└── docs/
    └── SCRAPING-SYSTEM.md (this file)
```

---

**Status:** ✅ System built, ready for testing  
**Last Updated:** 2026-02-12
