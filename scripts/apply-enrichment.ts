#!/usr/bin/env npx tsx
/**
 * Apply manual enrichment data to Liberture directory
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Applying directory enrichment...\n')
  
  // Read enrichment data
  const dataPath = path.join(__dirname, 'manual-enrichment-data.json')
  const enrichmentData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  
  // Enrich people
  console.log('👤 Enriching people...')
  for (const personData of enrichmentData.people) {
    const person = await prisma.person.findUnique({
      where: { slug: personData.slug }
    })
    
    if (!person) {
      console.log(`  ⚠️  Person not found: ${personData.slug}`)
      continue
    }
    
    await prisma.person.update({
      where: { slug: personData.slug },
      data: {
        wikipedia: personData.wikipedia,
        publications: JSON.stringify(personData.publications),
        speakingEvents: JSON.stringify(personData.speakingEvents),
        achievements: JSON.stringify(personData.achievements),
      }
    })
    
    console.log(`  ✅ ${person.name}`)
  }
  
  // Enrich books
  console.log('\n📚 Enriching books...')
  for (const bookData of enrichmentData.books) {
    const book = await prisma.book.findUnique({
      where: { slug: bookData.slug }
    })
    
    if (!book) {
      console.log(`  ⚠️  Book not found: ${bookData.slug}`)
      continue
    }
    
    await prisma.book.update({
      where: { slug: bookData.slug },
      data: {
        wikipedia: bookData.wikipedia,
        isbn: bookData.isbn,
        publications: JSON.stringify(bookData.publications),
        keyTakeaways: JSON.stringify(bookData.keyTakeaways),
      }
    })
    
    console.log(`  ✅ ${book.title}`)
  }
  
  console.log('\n✨ Enrichment complete!')
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
