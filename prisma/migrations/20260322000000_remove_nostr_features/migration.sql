-- Remove Nostr collaboration system tables
DROP TABLE IF EXISTS "Collaborator";
DROP TABLE IF EXISTS "CollaborationRequest";
DROP TABLE IF EXISTS "NostrAccount";

-- Remove Nostr fields from Book
ALTER TABLE "Book" DROP COLUMN IF EXISTS "authorPubkey";
ALTER TABLE "Book" DROP COLUMN IF EXISTS "nostrEventId";
ALTER TABLE "Book" DROP COLUMN IF EXISTS "nostrDTag";
ALTER TABLE "Book" DROP COLUMN IF EXISTS "wotScore";

-- Remove Nostr fields from KnowledgeArticle
ALTER TABLE "KnowledgeArticle" DROP COLUMN IF EXISTS "authorPubkey";
ALTER TABLE "KnowledgeArticle" DROP COLUMN IF EXISTS "nostrEventId";
ALTER TABLE "KnowledgeArticle" DROP COLUMN IF EXISTS "nostrDTag";
ALTER TABLE "KnowledgeArticle" DROP COLUMN IF EXISTS "wotScore";

-- Remove Nostr fields from Organization
ALTER TABLE "Organization" DROP COLUMN IF EXISTS "authorPubkey";
ALTER TABLE "Organization" DROP COLUMN IF EXISTS "nostrEventId";
ALTER TABLE "Organization" DROP COLUMN IF EXISTS "nostrDTag";
ALTER TABLE "Organization" DROP COLUMN IF EXISTS "wotScore";

-- Remove Nostr fields from Protocol
ALTER TABLE "Protocol" DROP COLUMN IF EXISTS "authorPubkey";
ALTER TABLE "Protocol" DROP COLUMN IF EXISTS "nostrEventId";
ALTER TABLE "Protocol" DROP COLUMN IF EXISTS "nostrDTag";
ALTER TABLE "Protocol" DROP COLUMN IF EXISTS "wotScore";
