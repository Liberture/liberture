import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Link Authors to Books
 * 
 * 1. Finds all books
 * 2. Matches book authors with existing People
 * 3. Creates new Person entries for authors not yet in directory
 * 4. Links books to their authors via authorId
 */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeAuthorName(author: string): string {
  // Remove extra spaces, trim
  return author.replace(/\s+/g, ' ').trim();
}

async function linkAuthorsToBooks() {
  console.log('🔗 Starting author-book linking process...\n');

  const books = await prisma.book.findMany({
    where: { authorId: null }, // Only process books without author links
    select: { id: true, title: true, author: true, pillars: true, description: true }
  });

  console.log(`Found ${books.length} books without author links\n`);

  let matched = 0;
  let created = 0;
  let linked = 0;

  for (const book of books) {
    const authorName = normalizeAuthorName(book.author);
    console.log(`📖 Processing: "${book.title}" by ${authorName}`);

    // Try to find existing person by name (case-insensitive)
    let person = await prisma.person.findFirst({
      where: {
        name: {
          equals: authorName,
          mode: 'insensitive',
        },
      },
    });

    if (person) {
      console.log(`   ✅ Found existing person: ${person.name}`);
      matched++;
    } else {
      // Create new person for this author
      console.log(`   📝 Creating new person entry for: ${authorName}`);
      
      const slug = slugify(authorName);
      
      // Check if slug exists, add number if needed
      let finalSlug = slug;
      let counter = 1;
      while (await prisma.person.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }

      person = await prisma.person.create({
        data: {
          name: authorName,
          slug: finalSlug,
          title: 'Author',
          category: 'author',
          bio: `Author of "${book.title}". ${book.description.substring(0, 200)}...`,
          pillars: book.pillars,
          expertise: 'Writing, Research',
        },
      });

      console.log(`   ✅ Created: ${person.name} (${person.slug})`);
      created++;
    }

    // Update category to include 'author' if not already
    if (!person.category.includes('author')) {
      await prisma.person.update({
        where: { id: person.id },
        data: {
          category: person.category === 'practitioner' ? 'author' : `${person.category},author`,
        },
      });
      console.log(`   🏷️  Updated category for ${person.name}`);
    }

    // Link book to author
    await prisma.book.update({
      where: { id: book.id },
      data: { authorId: person.id },
    });

    console.log(`   🔗 Linked book to author\n`);
    linked++;
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   Existing authors matched: ${matched}`);
  console.log(`   New authors created: ${created}`);
  console.log(`   Books linked: ${linked}`);
  console.log('='.repeat(50));

  await prisma.$disconnect();
}

linkAuthorsToBooks().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
