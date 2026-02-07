-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "readTime" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MarketplaceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "rating" REAL NOT NULL,
    "reviews" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "duration" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "iconColor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "influencerScore" INTEGER,
    "rating" REAL NOT NULL,
    "reviews" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "duration" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "outcomes" TEXT NOT NULL,
    "prerequisites" TEXT,
    "difficulty" TEXT NOT NULL,
    "bioScores" TEXT NOT NULL,
    "lessonCount" INTEGER,
    "contentUrl" TEXT,
    "socialLinks" TEXT,
    "updates" TEXT,
    "relatedContent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "author" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "timeAgo" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "likes" INTEGER NOT NULL,
    "comments" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PlatformComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "timeAgo" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "helpful" INTEGER NOT NULL,
    "replies" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
