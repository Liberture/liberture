#!/usr/bin/env tsx
/**
 * Migrate Knowledge JSON data into Directory DB tables
 *
 * 1. Influencers → Person rows (set influencerRank)
 * 2. Liberture 100 Books → Book rows (set libertureRank + influenceScore)
 * 3. Library Documents → Book or Article rows
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

// Load .env.local
const envPath = join(__dirname, '../.env.local')
try {
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const [, key, value] = match
      let cleanValue = value.trim()
      if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
          (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
        cleanValue = cleanValue.slice(1, -1)
      }
      process.env[key.trim()] = cleanValue
    }
  })
} catch {
  console.log('No .env.local found, using existing env vars')
}

const prisma = new PrismaClient()

// Map old knowledge "domains" to directory pillars
const DOMAIN_TO_PILLAR: Record<string, string> = {
  'cognition': 'work',
  'recovery': 'sleep',
  'fueling': 'nutrition',
  'mental': 'mind',
  'physicality': 'exercise',
  // These don't have direct pillar equivalents, map to closest
  'longevity': 'exercise',
  'supplements': 'nutrition',
  'mental-health': 'mind',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Load knowledge.json (must be restored from git if already deleted)
let knowledgeData: any
try {
  knowledgeData = JSON.parse(
    readFileSync(join(__dirname, '../data/knowledge.json'), 'utf-8')
  )
} catch {
  console.error('data/knowledge.json not found. Restore it from git first:')
  console.error('  git checkout HEAD~1 -- data/knowledge.json')
  process.exit(1)
}

async function migrateInfluencers() {
  console.log('\n--- Migrating Influencers → Person ---')
  const influencers = knowledgeData.influencers || []
  let created = 0, updated = 0, skipped = 0

  for (const inf of influencers) {
    const slug = slugify(inf.name)
    // Map domains to pillars
    const pillars = (inf.domains || [])
      .map((d: string) => DOMAIN_TO_PILLAR[d] || d)
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i) // unique
      .join(',')

    const existing = await prisma.person.findFirst({
      where: {
        OR: [
          { slug },
          { name: { equals: inf.name, mode: 'insensitive' } },
        ]
      }
    })

    if (existing) {
      // Update with influencer rank
      await prisma.person.update({
        where: { id: existing.id },
        data: {
          influencerRank: inf.id, // id is their rank in the JSON
          // Only fill in missing fields
          ...(existing.imageUrl ? {} : { imageUrl: inf.image || null }),
          ...(existing.followers ? {} : { followers: inf.followers || null }),
        },
      })
      updated++
    } else {
      // Create new person
      await prisma.person.create({
        data: {
          id: randomUUID(),
          slug,
          name: inf.name,
          title: inf.expertise || '',
          bio: `${inf.name} is a leading expert in ${inf.expertise || 'health optimization'}.`,
          pillars,
          expertise: inf.expertise || '',
          followers: inf.followers || null,
          imageUrl: inf.image || null,
          publications: inf.publications ? String(inf.publications) : null,
          influencerRank: inf.id,
          featured: true,
          updatedAt: new Date(),
        },
      })
      created++
    }
  }

  console.log(`  Influencers: ${created} created, ${updated} updated, ${skipped} skipped`)
}

async function migrateBooks() {
  console.log('\n--- Migrating Liberture 100 → Book ---')
  const books = knowledgeData.liberture100Books || []
  let created = 0, updated = 0

  for (const book of books) {
    const slug = slugify(book.title)

    const existing = await prisma.book.findFirst({
      where: {
        OR: [
          { slug },
          { title: { equals: book.title, mode: 'insensitive' } },
        ]
      }
    })

    if (existing) {
      await prisma.book.update({
        where: { id: existing.id },
        data: {
          libertureRank: book.rank,
          influenceScore: book.influenceScore,
        },
      })
      updated++
    } else {
      await prisma.book.create({
        data: {
          id: randomUUID(),
          slug,
          title: book.title,
          author: book.author,
          description: book.summary || '',
          pillars: book.pillar || '',
          rating: null,
          libertureRank: book.rank,
          influenceScore: book.influenceScore,
          featured: book.rank <= 10,
          updatedAt: new Date(),
        },
      })
      created++
    }
  }

  console.log(`  Liberture 100: ${created} created, ${updated} updated`)
}

async function migrateLibraryDocuments() {
  console.log('\n--- Migrating Library Documents → Book/Article ---')
  const docs = knowledgeData.libraryDocuments || []
  let booksCreated = 0, booksSkipped = 0
  let articlesCreated = 0, articlesSkipped = 0

  for (const doc of docs) {
    const slug = slugify(doc.title)

    if (doc.type === 'Book') {
      // Check if already in Book table
      const existing = await prisma.book.findFirst({
        where: {
          OR: [
            { slug },
            { title: { equals: doc.title, mode: 'insensitive' } },
          ]
        }
      })

      if (existing) {
        booksSkipped++
        continue
      }

      await prisma.book.create({
        data: {
          id: randomUUID(),
          slug,
          title: doc.title,
          author: doc.author,
          description: '',
          pillars: doc.pillar || '',
          rating: doc.rating || null,
          featured: false,
          updatedAt: new Date(),
        },
      })
      booksCreated++
    } else {
      // Non-book docs → Article
      const existing = await prisma.article.findFirst({
        where: {
          OR: [
            { slug },
            { title: { equals: doc.title, mode: 'insensitive' } },
          ]
        }
      })

      if (existing) {
        articlesSkipped++
        continue
      }

      // Map type names
      const typeMap: Record<string, string> = {
        'White Paper': 'white-paper',
        'Academic Article': 'academic-article',
        'Long-form Guide': 'guide',
        'E-Book': 'e-book',
        'Guide': 'guide',
      }

      await prisma.article.create({
        data: {
          id: randomUUID(),
          slug,
          title: doc.title,
          description: `${doc.type} by ${doc.author}`,
          pillar: doc.pillar || 'work',
          tags: Array.isArray(doc.tags) ? doc.tags.join(', ') : '',
          author: doc.author,
          readTime: 10, // default estimate
          url: '',
          publishedAt: new Date(),
          updatedAt: new Date(),
          type: typeMap[doc.type] || 'article',
          rating: doc.rating || null,
          external: doc.external || false,
        },
      })
      articlesCreated++
    }
  }

  console.log(`  Books: ${booksCreated} created, ${booksSkipped} already existed`)
  console.log(`  Articles: ${articlesCreated} created, ${articlesSkipped} already existed`)
}

async function verifyMigration() {
  console.log('\n--- Verification ---')

  const influencerCount = await prisma.person.count({ where: { influencerRank: { not: null } } })
  const libertureCount = await prisma.book.count({ where: { libertureRank: { not: null } } })
  const articleCount = await prisma.article.count()
  const totalPeople = await prisma.person.count()
  const totalBooks = await prisma.book.count()

  console.log(`  People with influencerRank: ${influencerCount}`)
  console.log(`  Books with libertureRank: ${libertureCount}`)
  console.log(`  Total articles: ${articleCount}`)
  console.log(`  Total people: ${totalPeople}`)
  console.log(`  Total books: ${totalBooks}`)
}

async function main() {
  console.log('=== Knowledge → Directory Migration ===')

  try {
    await migrateInfluencers()
    await migrateBooks()
    await migrateLibraryDocuments()
    await verifyMigration()
    console.log('\nMigration complete!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
