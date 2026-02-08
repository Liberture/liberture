-- Add tables for people and organizations in the directory

CREATE TABLE IF NOT EXISTS "Person" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "bio" TEXT NOT NULL,
  "title" TEXT,
  "website" TEXT,
  "twitter" TEXT,
  "linkedin" TEXT,
  "instagram" TEXT,
  "focus" TEXT NOT NULL, -- JSON array of focus areas
  "pillars" TEXT NOT NULL, -- JSON array of pillar IDs
  "achievements" TEXT, -- JSON array
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "imageUrl" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Organization" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- lab, company, nonprofit, community
  "website" TEXT,
  "twitter" TEXT,
  "linkedin" TEXT,
  "location" TEXT,
  "founded" INTEGER,
  "pillars" TEXT NOT NULL, -- JSON array of pillar IDs
  "focus" TEXT NOT NULL, -- JSON array of focus areas
  "size" TEXT, -- "1-10", "11-50", etc.
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "logoUrl" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Protocol" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "pillar" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL, -- beginner, intermediate, advanced
  "duration" TEXT NOT NULL, -- "Daily", "Weekly", "30 days", etc.
  "steps" TEXT NOT NULL, -- JSON array of steps
  "benefits" TEXT NOT NULL, -- JSON array
  "warnings" TEXT, -- JSON array
  "references" TEXT, -- JSON array of URLs
  "authorId" TEXT, -- Foreign key to Person
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Book" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "author" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "pillar" TEXT NOT NULL,
  "publicDomain" BOOLEAN NOT NULL DEFAULT true,
  "downloadUrl" TEXT,
  "readOnlineUrl" TEXT,
  "coverImageUrl" TEXT,
  "year" INTEGER,
  "pages" INTEGER,
  "language" TEXT NOT NULL DEFAULT 'en',
  "format" TEXT, -- pdf, epub, audiobook, etc.
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
