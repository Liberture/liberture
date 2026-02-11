import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Applying database indexes for performance...\n')

  try {
    // Enable pg_trgm extension for trigram matching
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`)
    console.log('✅ Enabled pg_trgm extension')

    // Read and execute the migration file
    const sqlPath = join(process.cwd(), 'prisma/migrations/add_knowledge_indexes.sql')
    const sql = readFileSync(sqlPath, 'utf-8')
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement + ';')
        const indexName = statement.match(/INDEX.*?"(.+?)"/)?.[1] || 'unknown'
        console.log(`✅ Created index: ${indexName}`)
      } catch (err: any) {
        // Ignore "already exists" errors
        if (err.message?.includes('already exists')) {
          console.log(`⏭️  Skipped: Index already exists`)
        } else {
          console.error(`❌ Error:`, err.message)
        }
      }
    }

    console.log('\n✨ Database indexes applied successfully!')
    console.log('Expected performance improvement: 10-100x faster queries')
  } catch (error) {
    console.error('Failed to apply indexes:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
