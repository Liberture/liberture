/**
 * Migrate directory data from SQLite to PostgreSQL
 * (People, Organizations, Protocols, Books - but NOT the Author entries from Goodreads)
 */

import { PrismaClient } from '@prisma/client'
import Database from 'better-sqlite3'

const sqliteDb = new Database('./prisma/prisma/liberture.db', { readonly: true })
const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Migrating directory data from SQLite to PostgreSQL...\n')

  try {
    // Migrate real People (not Authors from Goodreads)
    console.log('👥 Migrating People (non-authors)...')
    const people = sqliteDb.prepare(`
      SELECT * FROM Person 
      WHERE title != 'Author' AND title IS NOT NULL
    `).all() as any[]
    
    for (const person of people) {
      // Check if already exists
      const existing = await prisma.person.findUnique({
        where: { slug: person.slug },
      })
      
      if (!existing) {
        await prisma.person.create({
          data: {
            id: person.id,
            slug: person.slug,
            name: person.name,
            title: person.title,
            bio: person.bio,
            pillars: person.pillars,
            expertise: person.expertise,
            followers: person.followers,
            website: person.website,
            twitter: person.twitter,
            instagram: person.instagram,
            youtube: person.youtube,
            podcast: person.podcast,
            imageUrl: person.imageUrl,
            achievements: person.achievements,
            publications: person.publications,
            protocols: person.protocols,
            featured: person.featured === 1,
            createdAt: new Date(person.createdAt),
            updatedAt: new Date(person.updatedAt),
          },
        })
        console.log(`  ✅ Migrated: ${person.name}`)
      } else {
        console.log(`  ⏭️  Already exists: ${person.name}`)
      }
    }

    // Migrate Organizations
    console.log('\n🏢 Migrating Organizations...')
    const organizations = sqliteDb.prepare('SELECT * FROM Organization').all() as any[]
    
    for (const org of organizations) {
      const existing = await prisma.organization.findUnique({
        where: { slug: org.slug },
      })
      
      if (!existing) {
        await prisma.organization.create({
          data: {
            id: org.id,
            slug: org.slug,
            name: org.name,
            description: org.description,
            pillars: org.pillars,
            type: org.type,
            founded: org.founded,
            website: org.website,
            resources: org.resources,
            keyPeople: org.keyPeople,
            featured: org.featured === 1,
            imageUrl: org.imageUrl,
            createdAt: new Date(org.createdAt),
            updatedAt: new Date(org.updatedAt),
          },
        })
        console.log(`  ✅ Migrated: ${org.name}`)
      } else {
        console.log(`  ⏭️  Already exists: ${org.name}`)
      }
    }

    // Migrate Protocols
    console.log('\n📋 Migrating Protocols...')
    const protocols = sqliteDb.prepare('SELECT * FROM Protocol').all() as any[]
    
    for (const protocol of protocols) {
      const existing = await prisma.protocol.findUnique({
        where: { slug: protocol.slug },
      })
      
      if (!existing) {
        await prisma.protocol.create({
          data: {
            id: protocol.id,
            slug: protocol.slug,
            name: protocol.name,
            description: protocol.description,
            pillar: protocol.pillar,
            creator: protocol.creator,
            duration: protocol.duration,
            difficulty: protocol.difficulty,
            steps: protocol.steps,
            benefits: protocol.benefits,
            risks: protocol.risks,
            equipment: protocol.equipment,
            references: protocol.references,
            featured: protocol.featured === 1,
            createdAt: new Date(protocol.createdAt),
            updatedAt: new Date(protocol.updatedAt),
          },
        })
        console.log(`  ✅ Migrated: ${protocol.name}`)
      } else {
        console.log(`  ⏭️  Already exists: ${protocol.name}`)
      }
    }

    // Migrate Books (non-Goodreads - the handcrafted ones)
    console.log('\n📚 Migrating original Books...')
    const books = sqliteDb.prepare(`
      SELECT * FROM Book 
      WHERE keyTakeaways IS NOT NULL OR forWho IS NOT NULL
    `).all() as any[]
    
    for (const book of books) {
      const existing = await prisma.book.findUnique({
        where: { slug: book.slug },
      })
      
      if (!existing) {
        await prisma.book.create({
          data: {
            id: book.id,
            slug: book.slug,
            title: book.title,
            author: book.author,
            description: book.description,
            pillars: book.pillars,
            year: book.year,
            pages: book.pages,
            isbn: book.isbn,
            amazonUrl: book.amazonUrl,
            rating: book.rating,
            keyTakeaways: book.keyTakeaways,
            forWho: book.forWho,
            featured: book.featured === 1,
            imageUrl: book.imageUrl,
            createdAt: new Date(book.createdAt),
            updatedAt: new Date(book.updatedAt),
          },
        })
        console.log(`  ✅ Migrated: ${book.title}`)
      } else {
        console.log(`  ⏭️  Already exists: ${book.title}`)
      }
    }

    console.log('\n✅ Directory migration complete!')
    
    // Summary
    const [personCount, orgCount, protocolCount, bookCount] = await Promise.all([
      prisma.person.count({ where: { title: { not: 'Author' } } }),
      prisma.organization.count(),
      prisma.protocol.count(),
      prisma.book.count(),
    ])
    
    console.log(`\n📊 PostgreSQL Summary:`)
    console.log(`  People (non-authors): ${personCount}`)
    console.log(`  Organizations: ${orgCount}`)
    console.log(`  Protocols: ${protocolCount}`)
    console.log(`  Books: ${bookCount}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    sqliteDb.close()
  }
}

main()
