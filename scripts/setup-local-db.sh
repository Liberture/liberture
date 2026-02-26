#!/bin/bash
# Setup local SQLite database for development (no PostgreSQL server needed)
# Usage: ./scripts/setup-local-db.sh
#
# This temporarily patches schema.prisma to use SQLite, generates the client,
# creates the database, and runs seed scripts. The schema is restored to
# PostgreSQL after generation so git diffs stay clean.

set -e

SCHEMA="prisma/schema.prisma"

# Backup the production schema
cp "$SCHEMA" "${SCHEMA}.pg"

echo "📦 Patching schema to SQLite..."
sed -i '' 's/provider = "postgresql"/provider = "sqlite"/' "$SCHEMA"
sed -i '' 's/@db\.Text//' "$SCHEMA"
sed -i '' 's/Json?/String?/' "$SCHEMA"

echo "⚙️  Generating Prisma client..."
npx prisma generate

echo "🗄️  Pushing schema to SQLite database..."
npx prisma db push --accept-data-loss

echo "🔄 Restoring schema to PostgreSQL..."
mv "${SCHEMA}.pg" "$SCHEMA"

echo "🌱 Running seed scripts..."
npx tsx prisma/seed.ts || true
npx tsx prisma/seed-knowledge.ts || true
npx tsx prisma/seed-marketplace-extended.ts || true
npx tsx scripts/seed-directory.ts 2>/dev/null || npx tsx scripts/seed-directory-quick.ts 2>/dev/null || true

echo ""
echo "✅ Local SQLite database ready at prisma/dev.db"
echo "   Ensure DATABASE_URL=\"file:./dev.db\" is in .env"
echo "   Run: pnpm dev"
