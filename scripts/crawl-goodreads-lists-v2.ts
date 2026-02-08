import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

/**
 * Goodreads Crawler V2 - Improved selector support
 * 
 * Handles multiple Goodreads page formats:
 * - Shelves (shelf/show/*)
 * - Lists (list/show/*)
 * - List tags (list/tag/*)
 * - Genres (genres/*)
 * - Author pages (author/list/*)
 */

const GOODREADS_LISTS = [
  'https://www.goodreads.com/shelf/show/biohacking',
  'https://www.goodreads.com/list/tag/biohacking',
  'https://www.goodreads.com/list/show/136599.Books_on_Biohacking_',
  'https://www.goodreads.com/genres/biohacking',
  'https://www.goodreads.com/author/list/16090265.Olli_Sovij_rvi',
];

interface BookData {
  title: string;
  author: string;
  isbn?: string;
  rating?: number;
  description?: string;
  coverUrl?: string;
  goodreadsUrl?: string;
  year?: number;
  pages?: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  
  return response.text();
}

function extractBookData($: cheerio.CheerioAPI, $book: cheerio.Cheerio<any>): BookData | null {
  try {
    // Try multiple selector patterns
    let title = cleanText(
      $book.find('.bookTitle, a.bookTitle, .gr-h3__title, h3.gr-h3 a, .Text__title1').text() ||
      $book.find('a[href*="/book/show/"]').first().text()
    );
    
    let author = cleanText(
      $book.find('.authorName, a.authorName, .gr-metaText, span[itemprop="author"]').text() ||
      $book.find('a[href*="/author/show/"]').first().text()
    );
    
    let ratingText = $book.find('.minirating, .greyText').text();
    let rating = parseFloat(ratingText.match(/[\d.]+/)?.[0] || '0');
    
    let coverUrl = $book.find('img.bookCover, img[src*="images-na.ssl-images-amazon"]').attr('src');
    
    let bookUrl = $book.find('a.bookTitle, a[href*="/book/show/"]').attr('href');
    let goodreadsUrl = bookUrl ? `https://www.goodreads.com${bookUrl}` : undefined;
    
    // If title or author is missing, skip
    if (!title || !author || title.length < 3) {
      return null;
    }
    
    return { title, author, rating, coverUrl, goodreadsUrl };
  } catch (error) {
    return null;
  }
}

async function crawlGoodreadsList(url: string): Promise<BookData[]> {
  console.log(`\n📖 Crawling: ${url}`);
  
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const books: BookData[] = [];
    
    // Try multiple container selectors
    const bookContainers = [
      '.elementList',           // Shelf pages
      '.bookalike',              // Shelf pages
      '.bookBox',                // List pages
      'tr[itemtype*="Book"]',    // List pages (table rows)
      '.tableList tr',           // List pages (table)
      '.gr-bookDisplay',         // Genre pages
      '.leftContainer .bookBox', // Author pages
    ];
    
    let foundBooks = false;
    
    for (const selector of bookContainers) {
      const $elements = $(selector);
      
      if ($elements.length > 0) {
        $elements.each((_, element) => {
          const $book = $(element);
          const book = extractBookData($, $book);
          
          if (book) {
            books.push(book);
            foundBooks = true;
          }
        });
        
        if (foundBooks) {
          break; // Found the right selector, stop trying others
        }
      }
    }
    
    console.log(`   ✅ Found ${books.length} books`);
    return books;
  } catch (error) {
    console.error(`   ❌ Error crawling ${url}:`, error);
    return [];
  }
}

async function getOrCreateAuthor(authorName: string): Promise<string> {
  // Clean author name
  authorName = authorName.replace(/\(.*?\)/g, '').trim();
  
  // Try to find existing author
  let author = await prisma.person.findFirst({
    where: {
      name: {
        equals: authorName,
        mode: 'insensitive',
      },
    },
  });
  
  if (author) {
    return author.id;
  }
  
  // Create new author
  const slug = slugify(authorName);
  let finalSlug = slug;
  let counter = 1;
  
  while (await prisma.person.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }
  
  author = await prisma.person.create({
    data: {
      name: authorName,
      slug: finalSlug,
      title: 'Author',
      category: 'author',
      bio: `Author of biohacking and health optimization books.`,
      pillars: 'cognition,recovery,fueling',
      expertise: 'Writing, Research',
    },
  });
  
  console.log(`   📝 Created author: ${authorName}`);
  return author.id;
}

async function importBook(bookData: BookData): Promise<void> {
  try {
    // Check if book already exists
    const existing = await prisma.book.findFirst({
      where: {
        OR: [
          { title: { equals: bookData.title, mode: 'insensitive' } },
          { goodreadsUrl: bookData.goodreadsUrl },
        ],
      },
    });
    
    if (existing) {
      console.log(`   ⏭️  Skipping "${bookData.title}" (already exists)`);
      return;
    }
    
    // Get or create author
    const authorId = await getOrCreateAuthor(bookData.author);
    
    // Create book
    const slug = slugify(bookData.title);
    let finalSlug = slug;
    let counter = 1;
    
    while (await prisma.book.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
    
    await prisma.book.create({
      data: {
        title: bookData.title,
        slug: finalSlug,
        author: bookData.author,
        authorId,
        description: bookData.description || `A book about biohacking and health optimization by ${bookData.author}.`,
        pillars: 'cognition,recovery,fueling',
        isbn: bookData.isbn,
        rating: bookData.rating,
        goodreadsUrl: bookData.goodreadsUrl,
        imageUrl: bookData.coverUrl,
        year: bookData.year,
        pages: bookData.pages,
      },
    });
    
    console.log(`   ✅ Added: "${bookData.title}" by ${bookData.author}`);
  } catch (error) {
    console.error(`   ❌ Error importing "${bookData.title}":`, error);
  }
}

async function main() {
  console.log('🚀 Starting Goodreads crawler V2 for biohacking books\n');
  console.log('='.repeat(60));
  
  const allBooks: BookData[] = [];
  
  // Crawl all lists
  for (const url of GOODREADS_LISTS) {
    const books = await crawlGoodreadsList(url);
    allBooks.push(...books);
    
    // Rate limit between lists
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Total books found: ${allBooks.length}`);
  console.log('='.repeat(60));
  
  // Deduplicate by title + author
  const uniqueBooks = Array.from(
    new Map(allBooks.map(book => [`${book.title}|${book.author}`, book])).values()
  );
  
  console.log(`📊 Unique books: ${uniqueBooks.length}`);
  console.log('='.repeat(60));
  
  // Import books
  console.log('\n🔄 Importing books to database...\n');
  
  for (const book of uniqueBooks) {
    await importBook(book);
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Crawl complete!');
  console.log('='.repeat(60));
  
  // Summary
  const totalBooks = await prisma.book.count();
  const totalAuthors = await prisma.person.count({ where: { category: { contains: 'author' } } });
  
  console.log(`\n📚 Total books in database: ${totalBooks}`);
  console.log(`👤 Total authors in database: ${totalAuthors}`);
  
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
