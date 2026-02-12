-- Add ScrapedContent table for scraping + AI enrichment pipeline
CREATE TABLE "ScrapedContent" (
  "id" TEXT PRIMARY KEY,
  "source" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "rawContent" TEXT NOT NULL,
  "contentType" TEXT NOT NULL, -- 'article', 'person_bio', 'protocol', 'book_summary', etc.
  "targetEntity" TEXT, -- Which entity this should become (person/book/protocol/article)
  "extractedData" JSONB, -- Structured data extracted from scraping
  "needsParaphrasing" BOOLEAN DEFAULT true,
  "paraphrasedContent" TEXT,
  "enrichmentStatus" TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  "enrichedBy" TEXT, -- AI model used for enrichment
  "enrichedAt" TIMESTAMP,
  "publishedToDb" BOOLEAN DEFAULT false,
  "publishedEntityId" TEXT,
  "scrapedAt" TIMESTAMP DEFAULT NOW(),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "ScrapedContent_source_idx" ON "ScrapedContent"("source");
CREATE INDEX "ScrapedContent_enrichmentStatus_idx" ON "ScrapedContent"("enrichmentStatus");
CREATE INDEX "ScrapedContent_needsParaphrasing_idx" ON "ScrapedContent"("needsParaphrasing");
CREATE INDEX "ScrapedContent_contentType_idx" ON "ScrapedContent"("contentType");
