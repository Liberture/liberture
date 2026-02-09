-- Create analytics tracking table for knowledge articles
CREATE TABLE IF NOT EXISTS "ArticleView" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "articleId" TEXT NOT NULL,
  "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userAgent" TEXT,
  "referrer" TEXT,
  
  CONSTRAINT "ArticleView_articleId_fkey" 
    FOREIGN KEY ("articleId") 
    REFERENCES "KnowledgeArticle"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS "ArticleView_articleId_idx" ON "ArticleView"("articleId");
CREATE INDEX IF NOT EXISTS "ArticleView_viewedAt_idx" ON "ArticleView"("viewedAt" DESC);
CREATE INDEX IF NOT EXISTS "ArticleView_articleId_viewedAt_idx" ON "ArticleView"("articleId", "viewedAt" DESC);

-- Add view count to KnowledgeArticle (denormalized for performance)
ALTER TABLE "KnowledgeArticle" 
ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "KnowledgeArticle_viewCount_idx" ON "KnowledgeArticle"("viewCount" DESC);
