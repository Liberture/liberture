# Wikipedia Enrichment System

## Overview

Automated system to enrich people profiles using Wikipedia data. Fetches biographical information, images, and other metadata from Wikipedia API to enhance incomplete or short profiles.

## Features

✅ **Automatic Bio Enhancement**
- Fetches Wikipedia extract (summary paragraph)
- Only updates if existing bio is short (<100 chars) or missing
- Preserves manually-written detailed bios

✅ **Profile Images**
- Downloads thumbnail images from Wikipedia
- Only adds if profile has no existing image
- Uses highest quality available (usually 330px width)

✅ **Rate-Limited & Respectful**
- 1 request per second (to be kind to Wikipedia)
- Proper User-Agent header
- Handles errors gracefully

## Usage

### Run Enrichment

```bash
cd /root/liberture
npx tsx scripts/enrich-from-wikipedia.ts
```

### Expected Output

```
🔄 Enriching people profiles from Wikipedia...

Found 36 people with Wikipedia links

📖 Alan Watts
   Wikipedia: https://en.wikipedia.org/wiki/Alan_Watts
   ✅ Added image: https://upload.wikimedia.org/wikipedia/en/9/97/Alan_Watts.png
   ✨ Enriched

📖 Carl Jung
   Wikipedia: https://en.wikipedia.org/wiki/Carl_Jung
   ✅ Updated bio (213 chars)
   ✅ Added image: https://upload.wikimedia.org/wikipedia/commons/...
   ✨ Enriched

...

📊 Summary:
   Enriched: 28
   Skipped: 8
   Total: 36
```

## How It Works

1. **Fetches People with Wikipedia Links**
   ```sql
   SELECT * FROM Person WHERE wikipedia IS NOT NULL;
   ```

2. **Extracts Page Title from URL**
   - URL: `https://en.wikipedia.org/wiki/Alan_Watts`
   - Title: `Alan_Watts`

3. **Calls Wikipedia REST API**
   - Endpoint: `https://en.wikipedia.org/api/rest_v1/page/summary/{title}`
   - Returns: extract, thumbnail, metadata

4. **Updates Database**
   - Only if bio is short or image is missing
   - Preserves existing complete data

## Data Enriched

### From Wikipedia API Response:
- **extract**: First paragraph of Wikipedia article (bio)
- **thumbnail.source**: Profile image URL
- **pageimage**: Image filename (for verification)

### Database Fields Updated:
- `bio`: Biographical text (if <100 chars)
- `imageUrl`: Profile picture URL (if missing)

## Wikipedia API Details

### Endpoint
```
https://en.wikipedia.org/api/rest_v1/page/summary/{page_title}
```

### Rate Limits
- No official limit for summary endpoint
- We self-limit to 1 req/sec out of courtesy

### Response Format
```json
{
  "title": "Alan Watts",
  "extract": "Alan Wilson Watts was a British philosopher...",
  "thumbnail": {
    "source": "https://upload.wikimedia.org/.../Alan_Watts.png",
    "width": 330,
    "height": 422
  },
  "content_urls": {
    "desktop": {
      "page": "https://en.wikipedia.org/wiki/Alan_Watts"
    }
  }
}
```

## Adding People with Wikipedia Links

When creating new Person records, include the `wikipedia` field:

```typescript
await prisma.person.create({
  data: {
    name: 'Alan Watts',
    slug: 'alan-watts',
    title: 'Philosopher, Writer, Speaker',
    bio: 'Brief bio...', // Will be enriched
    wikipedia: 'https://en.wikipedia.org/wiki/Alan_Watts',
    // Other fields...
  },
});
```

Then run the enrichment script to fetch detailed bio and image.

## Philosopher Profiles Added

### Mental Health & Consciousness (8 profiles)

1. **Alan Watts** - Eastern philosophy, Zen Buddhism
2. **Jiddu Krishnamurti** - Psychological freedom, meditation
3. **Aldous Huxley** - Mysticism, psychedelics, consciousness
4. **Terence McKenna** - Ethnobotany, psychedelics, philosophy
5. **Carl Jung** - Analytical psychology, archetypes
6. **Ram Dass** - Spiritual teacher, meditation, service
7. **Eckhart Tolle** - Presence, mindfulness, awakening
8. **Stanislav Grof** - Consciousness research, holotropic breathwork

All profiles enriched with:
- ✅ Wikipedia-sourced biographical data
- ✅ Profile images from Wikipedia Commons
- ✅ Proper categorization (Mental pillar)
- ✅ Tagged as featured content

## Benefits

### For Users
- Rich, detailed profiles with proper context
- Professional-quality images
- Verified information from Wikipedia

### For Content Team
- Saves manual research time
- Consistent bio quality
- Easy to scale (add Wikipedia link → auto-enrich)

### For SEO
- More comprehensive content
- Better structured data
- Higher quality profiles = better rankings

## Maintenance

### Re-run Enrichment
If Wikipedia content improves or you want to refresh:
```bash
# Clear existing enriched data first (optional)
UPDATE "Person" SET bio = '' WHERE LENGTH(bio) < 500 AND wikipedia IS NOT NULL;

# Run enrichment
npx tsx scripts/enrich-from-wikipedia.ts
```

### Add More Philosophers/Thinkers
1. Add to `scripts/add-philosophers.ts`
2. Run: `npx tsx scripts/add-philosophers.ts`
3. Run: `npx tsx scripts/enrich-from-wikipedia.ts`

## Error Handling

- **404 Not Found**: Page doesn't exist on Wikipedia (URL may be wrong)
- **Network Errors**: Automatically logged, continues with next person
- **Invalid URLs**: Detected and skipped

## Future Enhancements

- [ ] Support for non-English Wikipedia (de.wikipedia.org, etc.)
- [ ] Fetch additional metadata (birth date, occupation, influences)
- [ ] Extract and link to related people (teachers, students)
- [ ] Pull book lists from Wikipedia
- [ ] Enrich Organization profiles similarly

## Technical Stack

- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **API**: Wikipedia REST API v1
- **Rate Limiting**: Manual (1 req/sec)

---

**Created**: February 11, 2026  
**Status**: ✅ Production-Ready  
**Enriched**: 36 profiles with Wikipedia data
