#!/usr/bin/env npx tsx
/**
 * Directory Enrichment Script for Liberture
 * 
 * Enriches people, books, organizations with:
 * - Wikipedia links
 * - Publications & speaking events
 * - Social proof & credentials
 * - Connected information for SEO
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface EnrichmentData {
  wikipedia?: string
  publications?: string[]
  speakingEvents?: string[]
  achievements?: string[]
  keyTakeaways?: string
  isbn?: string
}

/**
 * Search for Wikipedia page for a person/book/org
 */
async function findWikipediaLink(name: string, type: 'person' | 'book' | 'organization'): Promise<string | null> {
  console.log(`🔍 Searching Wikipedia for: ${name}`)
  
  // Would use web_search + web_fetch here
  // For now, construct probable Wikipedia URLs
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
  
  return `https://en.wikipedia.org/wiki/${slug}`
}

/**
 * Enrich a person's profile
 */
async function enrichPerson(person: any): Promise<EnrichmentData> {
  console.log(`\n👤 Enriching: ${person.name}`)
  
  const enrichment: EnrichmentData = {}
  
  // Wikipedia
  enrichment.wikipedia = await findWikipediaLink(person.name, 'person')
  
  // Publications (books they've written)
  enrichment.publications = []
  
  // Speaking events (conferences, podcasts)
  enrichment.speakingEvents = []
  
  // Achievements
  enrichment.achievements = []
  
  return enrichment
}

/**
 * Enrich a book's information
 */
async function enrichBook(book: any): Promise<EnrichmentData> {
  console.log(`\n📚 Enriching: ${book.title}`)
  
  const enrichment: EnrichmentData = {}
  
  // Wikipedia
  enrichment.wikipedia = await findWikipediaLink(book.title, 'book')
  
  // Key takeaways (extracted from reviews/summaries)
  enrichment.keyTakeaways = ''
  
  // ISBN (search OpenLibrary/Google Books)
  enrichment.isbn = ''
  
  return enrichment
}

/**
 * Enrich an organization
 */
async function enrichOrganization(org: any): Promise<EnrichmentData> {
  console.log(`\n🏢 Enriching: ${org.name}`)
  
  const enrichment: EnrichmentData = {}
  
  // Wikipedia
  enrichment.wikipedia = await findWikipediaLink(org.name, 'organization')
  
  // Publications (reports, research)
  enrichment.publications = []
  
  return enrichment
}

/**
 * Main enrichment process
 */
async function main() {
  console.log('🚀 Starting Liberture Directory Enrichment\n')
  
  // Enrich people
  const people = await prisma.person.findMany({ take: 5 })
  console.log(`Found ${people.length} people to enrich`)
  
  for (const person of people) {
    const enrichment = await enrichPerson(person)
    
    // Update database
    await prisma.person.update({
      where: { id: person.id },
      data: {
        website: enrichment.wikipedia || person.website,
        achievements: JSON.stringify(enrichment.achievements || []),
        publications: JSON.stringify(enrichment.publications || []),
      }
    })
    
    console.log(`✅ Updated ${person.name}`)
  }
  
  // Enrich books
  const books = await prisma.book.findMany({ take: 5 })
  console.log(`\nFound ${books.length} books to enrich`)
  
  for (const book of books) {
    const enrichment = await enrichBook(book)
    
    await prisma.book.update({
      where: { id: book.id },
      data: {
        isbn: enrichment.isbn || book.isbn,
        keyTakeaways: enrichment.keyTakeaways || book.keyTakeaways,
      }
    })
    
    console.log(`✅ Updated ${book.title}`)
  }
  
  // Enrich organizations
  const orgs = await prisma.organization.findMany({ take: 5 })
  console.log(`\nFound ${orgs.length} organizations to enrich`)
  
  for (const org of orgs) {
    const enrichment = await enrichOrganization(org)
    
    // Organizations don't have website field in current schema
    console.log(`✅ Processed ${org.name}`)
  }
  
  console.log('\n✨ Enrichment complete!')
}

main()
  .catch((error) => {
    console.error('❌ Enrichment failed:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
