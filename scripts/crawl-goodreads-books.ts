/**
 * Crawl Goodreads book lists for biohacking books
 * 
 * URLs to crawl:
 * - https://www.goodreads.com/shelf/show/biohacking
 * - https://www.goodreads.com/list/tag/biohacking
 * - https://www.goodreads.com/list/show/136599.Books_on_Biohacking_
 * - https://www.goodreads.com/genres/biohacking
 * - https://www.goodreads.com/author/list/16090265.Olli_Sovij_rvi
 * 
 * Usage:
 *   npx tsx scripts/crawl-goodreads-books.ts
 */

import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import * as cheerio from 'cheerio'

const prisma = new PrismaClient()

interface BookData {
  title: string
  author: string
  isbn?: string
  isbn13?: string
  year?: number
  pages?: number
  rating?: number
  imageUrl?: string
  description?: string
  amazonUrl?: string
  goodreadsUrl?: string
}

// Helper to create slug from title
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Helper to delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function fetchPage(url: string): Promise<string> {
  try {
    console.log(`📥 Fetching: ${url}`)
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })
    await delay(2000) // Be nice to Goodreads servers
    return response.data
  } catch (error) {
    console.error(`❌ Failed to fetch ${url}:`, error)
    return ''
  }
}

async function scrapeBookShelf(url: string): Promise<BookData[]> {
  const html = await fetchPage(url)
  if (!html) return []

  const $ = cheerio.load(html)
  const books: BookData[] = []

  $('.bookalike').each((_, element) => {
    const $el = $(element)
    
    const title = $el.find('.bookTitle').text().trim()
    const author = $el.find('.authorName').text().trim()
    const imageUrl = $el.find('img.bookImage').attr('src')
    const goodreadsUrl = $el.find('.bookTitle').attr('href')
    const rating = parseFloat($el.find('.minirating').text().match(/(\d+\.\d+)/)?.[1] || '0')

    if (title && author) {
      books.push({
        title,
        author,
        rating: rating || undefined,
        imageUrl,
        goodreadsUrl: goodreadsUrl ? `https://www.goodreads.com${goodreadsUrl}` : undefined,
      })
    }
  })

  console.log(`  ✅ Found ${books.length} books`)
  return books
}

async function scrapeBookList(url: string): Promise<BookData[]> {
  const html = await fetchPage(url)
  if (!html) return []

  const $ = cheerio.load(html)
  const books: BookData[] = []

  $('.bookTitle').each((_, element) => {
    const $row = $(element).closest('tr')
    
    const title = $(element).text().trim()
    const author = $row.find('.authorName').text().trim()
    const imageUrl = $row.find('img').attr('src')
    const goodreadsUrl = $(element).attr('href')
    const ratingText = $row.find('.minirating').text()
    const rating = parseFloat(ratingText.match(/(\d+\.\d+)/)?.[1] || '0')

    if (title && author) {
      books.push({
        title,
        author,
        rating: rating || undefined,
        imageUrl,
        goodreadsUrl: goodreadsUrl ? `https://www.goodreads.com${goodreadsUrl}` : undefined,
      })
    }
  })

  console.log(`  ✅ Found ${books.length} books`)
  return books
}

async function scrapeGenrePage(url: string): Promise<BookData[]> {
  const html = await fetchPage(url)
  if (!html) return []

  const $ = cheerio.load(html)
  const books: BookData[] = []

  $('.bookBox').each((_, element) => {
    const $el = $(element)
    
    const title = $el.find('.bookTitle').text().trim()
    const author = $el.find('.authorName').text().trim()
    const imageUrl = $el.find('img').attr('src')
    const goodreadsUrl = $el.find('.bookTitle').attr('href')
    const rating = parseFloat($el.find('.minirating').text().match(/(\d+\.\d+)/)?.[1] || '0')

    if (title && author) {
      books.push({
        title,
        author,
        rating: rating || undefined,
        imageUrl,
        goodreadsUrl: goodreadsUrl ? `https://www.goodreads.com${goodreadsUrl}` : undefined,
      })
    }
  })

  console.log(`  ✅ Found ${books.length} books`)
  return books
}

async function getOrCreateAuthor(authorName: string): Promise<string> {
  const slug = slugify(authorName)
  
  // Check if author exists
  let author = await prisma.person.findUnique({
    where: { slug },
  })

  if (!author) {
    // Create new author with minimal data
    author = await prisma.person.create({
      data: {
        slug,
        name: authorName,
        title: 'Author',
        bio: `Author of biohacking literature.`,
        pillars: 'cognition,recovery,fueling,mental,physicality', // Default pillars for biohacking authors
        expertise: 'Writing, Research',
      },
    })
    console.log(`  ✨ Created author: ${authorName}`)
  }

  return author.id
}

async function saveBook(bookData: BookData) {
  const slug = slugify(bookData.title)

  // Check if book already exists
  const existing = await prisma.book.findUnique({
    where: { slug },
  })

  if (existing) {
    console.log(`  ⏭️  Book already exists: ${bookData.title}`)
    return
  }

  // Get or create author
  const authorId = await getOrCreateAuthor(bookData.author)

  // Create book
  await prisma.book.create({
    data: {
      slug,
      title: bookData.title,
      author: bookData.author,
      description: bookData.description || `A book on biohacking and human optimization.`,
      pillars: 'cognition,recovery,fueling,mental,physicality', // Default pillars
      year: bookData.year,
      pages: bookData.pages,
      isbn: bookData.isbn,
      amazonUrl: bookData.amazonUrl,
      rating: bookData.rating,
      imageUrl: bookData.imageUrl,
      forWho: 'Anyone interested in biohacking and optimizing human performance',
      featured: false,
    },
  })

  console.log(`  ✅ Saved book: ${bookData.title}`)
}

async function main() {
  console.log('🚀 Starting Goodreads biohacking book crawl...\n')

  const urls = [
    'https://www.goodreads.com/shelf/show/biohacking',
    'https://www.goodreads.com/list/tag/biohacking',
    'https://www.goodreads.com/list/show/136599.Books_on_Biohacking_',
    'https://www.goodreads.com/genres/biohacking',
    'https://www.goodreads.com/author/list/16090265.Olli_Sovij_rvi',
  ]

  let allBooks: BookData[] = []

  for (const url of urls) {
    console.log(`\n📚 Crawling: ${url}`)
    
    let books: BookData[] = []
    
    if (url.includes('/shelf/show/')) {
      books = await scrapeBookShelf(url)
    } else if (url.includes('/list/') || url.includes('/author/list/')) {
      books = await scrapeBookList(url)
    } else if (url.includes('/genres/')) {
      books = await scrapeGenrePage(url)
    }

    allBooks = [...allBooks, ...books]
  }

  // Deduplicate by title
  const uniqueBooks = Array.from(
    new Map(allBooks.map(book => [book.title.toLowerCase(), book])).values()
  )

  console.log(`\n📊 Total unique books found: ${uniqueBooks.length}`)
  console.log(`\n💾 Saving books to database...`)

  for (const book of uniqueBooks) {
    try {
      await saveBook(book)
    } catch (error) {
      console.error(`❌ Failed to save "${book.title}":`, error)
    }
  }

  console.log('\n✅ Crawl completed!')
  
  // Summary
  const bookCount = await prisma.book.count()
  const authorCount = await prisma.person.count({ where: { title: 'Author' } })
  
  console.log(`\n📊 Database Summary:`)
  console.log(`  Books: ${bookCount}`)
  console.log(`  Authors: ${authorCount}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
