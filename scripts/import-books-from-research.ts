import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Simple cuid-like ID generator
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(12).toString('base64').replace(/[+/=]/g, '').slice(0, 16);
  return `cml${timestamp}${random}`.toLowerCase();
}

interface BookData {
  title: string;
  author: string;
  isbn?: string;
  isbn13?: string;
  description?: string;
  coverUrl?: string;
  openLibraryUrl?: string;
  publishDate?: string;
  pages?: number;
}

async function importBooks() {
  console.log('📚 Importing Books into Liberture Database\n');
  
  // Read the book data
  const data = JSON.parse(
    await fs.readFile('/tmp/openlibrary-books-with-isbn.json', 'utf-8')
  );
  
  const books: BookData[] = data.books.filter((b: BookData) => 
    b.isbn13 && !b.title.toLowerCase().includes('summary')
  );
  
  console.log(`Found ${books.length} books with ISBNs to import\n`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const bookData of books) {
    try {
      console.log(`Processing: ${bookData.title} by ${bookData.author}`);
      
      // Check if book already exists
      const existing = await prisma.book.findFirst({
        where: {
          OR: [
            { title: bookData.title },
            { isbn: bookData.isbn13 }
          ]
        }
      });
      
      if (existing) {
        console.log(`  ⏭️  Already exists (id: ${existing.id})`);
        skipped++;
        continue;
      }
      
      // Find or create author
      let author = await prisma.person.findFirst({
        where: {
          name: {
            contains: bookData.author.split(' ').pop() || bookData.author,
            mode: 'insensitive'
          },
          category: 'author'
        }
      });
      
      if (!author) {
        console.log(`  📝 Creating author: ${bookData.author}`);
        const slug = bookData.author.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        author = await prisma.person.create({
          data: {
            id: generateId(),
            slug,
            name: bookData.author,
            title: 'Author',
            category: 'author',
            bio: `Author of ${bookData.title}`,
            pillars: 'general',
            expertise: 'Writing',
            featured: true,
            updatedAt: new Date()
          }
        });
      }
      
      // Create book
      const slug = bookData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const book = await prisma.book.create({
        data: {
          id: generateId(),
          slug,
          title: bookData.title,
          author: bookData.author,
          authorId: author.id,
          isbn: bookData.isbn13,
          description: bookData.description || `A comprehensive guide by ${bookData.author}.`,
          imageUrl: bookData.coverUrl,
          year: bookData.publishDate ? parseInt(bookData.publishDate) : null,
          pages: bookData.pages,
          wikipedia: bookData.openLibraryUrl,
          featured: true,
          pillars: 'general',
          updatedAt: new Date()
        }
      });
      
      console.log(`  ✅ Imported (id: ${book.id})`);
      imported++;
      
    } catch (error) {
      console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      errors++;
    }
  }
  
  console.log('\n================================');
  console.log(`✅ Imported: ${imported}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📊 Total: ${books.length}`);
  
  await prisma.$disconnect();
}

importBooks().catch(console.error);
