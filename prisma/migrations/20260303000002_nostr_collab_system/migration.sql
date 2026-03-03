-- Nostr Collaboration System Migration
-- Adds models for Nostr account management, collaboration requests, and collaborators
-- Also adds Nostr fields to existing content models

-- Add Nostr fields to Protocol
ALTER TABLE "Protocol" ADD COLUMN "authorPubkey" TEXT;
ALTER TABLE "Protocol" ADD COLUMN "nostrEventId" TEXT;
ALTER TABLE "Protocol" ADD COLUMN "nostrDTag" TEXT;
ALTER TABLE "Protocol" ADD COLUMN "wotScore" DOUBLE PRECISION;

-- Add Nostr fields to KnowledgeArticle
ALTER TABLE "KnowledgeArticle" ADD COLUMN "authorPubkey" TEXT;
ALTER TABLE "KnowledgeArticle" ADD COLUMN "nostrEventId" TEXT;
ALTER TABLE "KnowledgeArticle" ADD COLUMN "nostrDTag" TEXT;
ALTER TABLE "KnowledgeArticle" ADD COLUMN "wotScore" DOUBLE PRECISION;

-- Add Nostr fields to Book
ALTER TABLE "Book" ADD COLUMN "authorPubkey" TEXT;
ALTER TABLE "Book" ADD COLUMN "nostrEventId" TEXT;
ALTER TABLE "Book" ADD COLUMN "nostrDTag" TEXT;
ALTER TABLE "Book" ADD COLUMN "wotScore" DOUBLE PRECISION;

-- Add Nostr fields to Organization
ALTER TABLE "Organization" ADD COLUMN "authorPubkey" TEXT;
ALTER TABLE "Organization" ADD COLUMN "nostrEventId" TEXT;
ALTER TABLE "Organization" ADD COLUMN "nostrDTag" TEXT;
ALTER TABLE "Organization" ADD COLUMN "wotScore" DOUBLE PRECISION;

-- Create NostrAccount table
CREATE TABLE "NostrAccount" (
    "id" TEXT NOT NULL,
    "npub" TEXT NOT NULL,
    "pubkeyHex" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'liberture',
    "nbunkerUrl" TEXT,
    "nbunkerSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NostrAccount_pkey" PRIMARY KEY ("id")
);

-- Create CollaborationRequest table
CREATE TABLE "CollaborationRequest" (
    "id" TEXT NOT NULL,
    "npub" TEXT NOT NULL,
    "pubkeyHex" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaborationRequest_pkey" PRIMARY KEY ("id")
);

-- Create Collaborator table
CREATE TABLE "Collaborator" (
    "id" TEXT NOT NULL,
    "npub" TEXT NOT NULL,
    "pubkeyHex" TEXT NOT NULL,
    "displayName" TEXT,
    "about" TEXT,
    "picture" TEXT,
    "nostrProfile" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "wotScore" DOUBLE PRECISION,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,

    CONSTRAINT "Collaborator_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "NostrAccount_npub_key" ON "NostrAccount"("npub");
CREATE UNIQUE INDEX "NostrAccount_pubkeyHex_key" ON "NostrAccount"("pubkeyHex");
CREATE UNIQUE INDEX "CollaborationRequest_npub_key" ON "CollaborationRequest"("npub");
CREATE UNIQUE INDEX "Collaborator_npub_key" ON "Collaborator"("npub");
CREATE UNIQUE INDEX "Collaborator_pubkeyHex_key" ON "Collaborator"("pubkeyHex");

-- Create index on Collaborator pubkeyHex for lookups
CREATE INDEX "Collaborator_pubkeyHex_idx" ON "Collaborator"("pubkeyHex");
