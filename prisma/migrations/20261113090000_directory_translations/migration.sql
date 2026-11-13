ALTER TABLE "Person" ADD COLUMN IF NOT EXISTS "localized" jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS "Person_es_slug_key" ON "Person" ((localized->'es'->>'slug')) WHERE localized->'es'->>'slug' IS NOT NULL;
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "localized" jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS "Book_es_slug_key" ON "Book" ((localized->'es'->>'slug')) WHERE localized->'es'->>'slug' IS NOT NULL;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "localized" jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_es_slug_key" ON "Organization" ((localized->'es'->>'slug')) WHERE localized->'es'->>'slug' IS NOT NULL;
ALTER TABLE "Protocol" ADD COLUMN IF NOT EXISTS "localized" jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS "Protocol_es_slug_key" ON "Protocol" ((localized->'es'->>'slug')) WHERE localized->'es'->>'slug' IS NOT NULL;
ALTER TABLE "KnowledgeArticle" ADD COLUMN IF NOT EXISTS "localized" jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeArticle_es_slug_key" ON "KnowledgeArticle" ((localized->'es'->>'slug')) WHERE localized->'es'->>'slug' IS NOT NULL;
ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS "localized" jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS "Content_es_slug_key" ON "Content" ((localized->'es'->>'slug')) WHERE localized->'es'->>'slug' IS NOT NULL;
CREATE OR REPLACE TRIGGER liberture_directory_revision AFTER UPDATE ON "Content"
  FOR EACH ROW EXECUTE FUNCTION liberture_directory_revision_v1('content');
