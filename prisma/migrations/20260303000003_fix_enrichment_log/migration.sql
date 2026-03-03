-- Create EnrichmentLog table if it doesn't exist
CREATE TABLE IF NOT EXISTS "EnrichmentLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "fieldsAdded" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "enrichedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrichmentLog_pkey" PRIMARY KEY ("id")
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "EnrichmentLog_createdAt_idx" ON "EnrichmentLog"("createdAt");
CREATE INDEX IF NOT EXISTS "EnrichmentLog_entityType_entityId_idx" ON "EnrichmentLog"("entityType", "entityId");
