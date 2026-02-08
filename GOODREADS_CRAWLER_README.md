# Goodreads Book Crawler - Liberture

## Overview
Automated crawler to populate Liberture's book database with biohacking literature from Goodreads.

## Sources
The crawler targets these Goodreads URLs:
1. https://www.goodreads.com/shelf/show/biohacking
2. https://www.goodreads.com/list/tag/biohacking
3. https://www.goodreads.com/list/show/136599.Books_on_Biohacking_
4. https://www.goodreads.com/genres/biohacking
5. https://www.goodreads.com/author/list/16090265.Olli_Sovij_rvi

## What It Does

### 1. Scrapes Book Data
For each URL, extracts:
- Title
- Author name
- ISBN / ISBN-13 (when available)
- Publication year
- Page count
- Goodreads rating
- Book cover image URL
- Goodreads URL
- Description

### 2. Creates Authors Automatically
- Checks if author exists in database (by slug)
- If not, creates new `Person` entry with:
  - Name
  - Title: "Author"
  - Generic bio: "Author of biohacking literature"
  - Default pillars: cognition, recovery, fueling, mental, physicality

### 3. Saves Books to Database
Creates `Book` entries with:
- Unique slug (from title)
- Full metadata
- Links to author
- Default pillars for biohacking
- Featured: false (can be curated later)

### 4. Deduplicates
- Merges results from all sources
- Removes duplicate books (by title)
- Skips books already in database

## Usage

```bash
cd /root/liberture
npx tsx scripts/crawl-goodreads-books.ts
```

## Output Example

```
🚀 Starting Goodreads biohacking book crawl...

📚 Crawling: https://www.goodreads.com/shelf/show/biohacking
📥 Fetching: https://www.goodreads.com/shelf/show/biohacking
  ✅ Found 50 books

📚 Crawling: https://www.goodreads.com/list/tag/biohacking
📥 Fetching: https://www.goodreads.com/list/tag/biohacking
  ✅ Found 38 books

...

📊 Total unique books found: 127
💾 Saving books to database...
  ✨ Created author: Tim Ferriss
  ✅ Saved book: The 4-Hour Body
  ⏭️  Book already exists: Lifespan
  ✨ Created author: Wim Hof
  ✅ Saved book: The Wim Hof Method

✅ Crawl completed!

📊 Database Summary:
  Books: 127
  Authors: 45
```

## Features

### Respectful Crawling
- 2-second delay between requests
- User-Agent header set
- Handles errors gracefully
- Doesn't hammer Goodreads servers

### Smart Deduplication
- Case-insensitive title matching
- Skips existing books in database
- Only creates authors once

### Slug Generation
- Converts titles to URL-safe slugs
- Example: "The 4-Hour Body" → "the-4-hour-body"

### Error Handling
- Logs failed requests
- Continues on individual book errors
- Returns static sitemap if database fails

## Database Schema

### Book Model
```prisma
model Book {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  author      String
  description String
  pillars     String   // Comma-separated
  year        Int?
  pages       Int?
  isbn        String?
  amazonUrl   String?
  rating      Float?
  imageUrl    String?
  forWho      String?
  featured    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Person Model (Authors)
```prisma
model Person {
  id       String @id @default(cuid())
  slug     String @unique
  name     String
  title    String
  bio      String
  pillars  String
  expertise String
  ...
}
```

## Limitations

### Goodreads Access
- Goodreads removed their public API in 2020
- This scraper uses HTML parsing (cheerio)
- May break if Goodreads changes their HTML structure
- Rate limiting: 2 seconds per page

### ISBN Data
- Not all Goodreads pages expose ISBN
- Some books may be missing ISBN-13
- Consider enriching data with Open Library API later

### Author Data
- Authors created with minimal information
- Only name, generic title, and bio
- Can be manually enriched later via admin panel

## Improvements for Later

1. **Open Library API Integration**
   - Fetch ISBNs for books missing them
   - Get more detailed book metadata
   - API: `https://openlibrary.org/api/books?bibkeys=ISBN:xxx`

2. **Google Books API**
   - Alternative source for book metadata
   - Requires API key (free tier available)

3. **Author Enrichment**
   - Scrape author pages from Goodreads
   - Get bio, photo, social links
   - More accurate pillar assignments

4. **Scheduled Crawling**
   - Run weekly via cron
   - Keep book database updated with new releases

5. **Manual Curation**
   - Review and approve books via admin panel
   - Mark featured books
   - Assign specific pillars

## Files

- `scripts/crawl-goodreads-books.ts` - Main crawler script
- `app/sitemap.ts` - Dynamic sitemap generator (includes books)
- `prisma/schema.prisma` - Database schema (Book + Person models)

## Security Notes

- No authentication required (public Goodreads pages)
- No user data collected
- Respects Goodreads robots.txt (shelves/lists are allowed)
- Fair use: educational/research purpose

---

**Status:** Ready to run. Will populate database with 100+ biohacking books.
