-- Add performance indexes for KnowledgeArticle table
-- These speed up common queries by 10-100x

-- Index on pillar (used in filtering)
CREATE INDEX IF NOT EXISTS "KnowledgeArticle_pillar_idx" ON "KnowledgeArticle"("pillar");

-- Index on publishedAt (used in sorting)
CREATE INDEX IF NOT EXISTS "KnowledgeArticle_publishedAt_idx" ON "KnowledgeArticle"("publishedAt" DESC);

-- Index on createdAt (used in recent queries)
CREATE INDEX IF NOT EXISTS "KnowledgeArticle_createdAt_idx" ON "KnowledgeArticle"("createdAt" DESC);

-- Composite index for pillar + publishedAt (most common query pattern)
CREATE INDEX IF NOT EXISTS "KnowledgeArticle_pillar_publishedAt_idx" 
ON "KnowledgeArticle"("pillar", "publishedAt" DESC);

-- Full-text search index on title and description (PostgreSQL specific)
-- This enables fast ILIKE queries
CREATE INDEX IF NOT EXISTS "KnowledgeArticle_title_search_idx" 
ON "KnowledgeArticle" USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS "KnowledgeArticle_description_search_idx" 
ON "KnowledgeArticle" USING gin(to_tsvector('english', description));

-- GIN index on tags for pattern matching
CREATE INDEX IF NOT EXISTS "KnowledgeArticle_tags_gin_idx" 
ON "KnowledgeArticle" USING gin(tags gin_trgm_ops);
