import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Enrich Books with Goodreads URLs
 * 
 * Uses Perplexity API to find Goodreads URLs for all books
 */

async function findGoodreadsUrl(title: string, author: string): Promise<string | null> {
  const perplexityKey = process.env.PERPLEXITY_API_KEY;

  if (!perplexityKey) {
    console.error('PERPLEXITY_API_KEY not found');
    return null;
  }

  const prompt = `Find the exact Goodreads URL for the book "${title}" by ${author}.

Return ONLY the Goodreads URL in this format:
https://www.goodreads.com/book/show/[book_id]

If the book is not found on Goodreads, return "null".
Do not include any explanation, just the URL or null.`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{
          role: 'user',
          content: prompt,
        }],
        temperature: 0.1,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      console.error(`   ❌ Perplexity API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    // Extract URL from response
    const urlMatch = content.match(/https:\/\/www\.goodreads\.com\/book\/show\/[\d]+/);
    
    if (urlMatch) {
      return urlMatch[0];
    }

    return null;
  } catch (error) {
    console.error(`   ❌ Error:`, error);
    return null;
  }
}

async function enrichBooksWithGoodreads() {
  console.log('📚 Starting Goodreads enrichment for books...\n');

  const books = await prisma.book.findMany({
    where: { goodreadsUrl: null },
    select: { id: true, title: true, author: true },
  });

  console.log(`Found ${books.length} books without Goodreads URLs\n`);

  let found = 0;
  let notFound = 0;

  for (const book of books) {
    console.log(`📖 "${book.title}" by ${book.author}`);
    
    const goodreadsUrl = await findGoodreadsUrl(book.title, book.author);
    
    if (goodreadsUrl) {
      await prisma.book.update({
        where: { id: book.id },
        data: { goodreadsUrl },
      });
      console.log(`   ✅ Found: ${goodreadsUrl}\n`);
      found++;
    } else {
      console.log(`   ⚠️  Not found on Goodreads\n`);
      notFound++;
    }

    // Rate limit: 1 request per 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   Goodreads URLs found: ${found}`);
  console.log(`   Not found: ${notFound}`);
  console.log('='.repeat(50));

  await prisma.$disconnect();
}

enrichBooksWithGoodreads().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
