# llms.txt Documentation

## What is llms.txt?

`llms.txt` is an emerging convention for websites to provide structured information about themselves specifically for Large Language Models (LLMs) and AI systems. It's similar to `robots.txt` but focused on helping AI understand what your site is about, rather than controlling crawling behavior.

## Purpose

The llms.txt file serves several important purposes:

1. **AI Training Context** - Helps LLMs understand Liberture's focus, content, and structure
2. **Improved AI Responses** - When users ask AI assistants about biohacking, they can reference accurate info about Liberture
3. **Discoverability** - AI-powered search engines and recommendation systems can better understand and suggest the site
4. **Standardized Format** - Provides consistent, structured information that AI systems can easily parse

## File Location

**URL:** https://liberture.com/llms.txt  
**Path:** `/public/llms.txt`  
**Format:** Plain text with markdown-style formatting  
**Size:** ~6.2 KB

## Content Structure

### 1. Overview Section
- Platform description
- Mission statement
- Core focus areas
- Website URL

### 2. Core Pillars
- The 6 fundamental pillars of human optimization
- Brief description of each pillar
- Clear categorization of content

### 3. Content Types
Detailed breakdown of:
- **People** (74+ profiles) - Biohackers, scientists, philosophers
- **Books** (85+ titles) - Curated biohacking library
- **Organizations** (4+ entities) - Key institutions
- **Protocols** (3+ guides) - Step-by-step optimization practices
- **Knowledge Articles** (82+ articles) - Educational content
- **Marketplace** - Curated products

### 4. Key Features
- Directory (search and browse)
- Interactive games/trackers
- User dashboard
- API endpoints

### 5. Content Philosophy
- Evidence-based approach
- Practical, actionable advice
- Holistic coverage
- Free and accessible
- Community-driven

### 6. Target Audience
- Biohackers
- Entrepreneurs
- Athletes
- Longevity enthusiasts
- Consciousness explorers

### 7. Technical Information
- Technology stack (Next.js, PostgreSQL, Prisma)
- API structure and endpoints
- SEO features (sitemap, JSON-LD, Open Graph)

### 8. Navigation Hints
- Key URLs and sections
- URL patterns for different content types
- How to find specific information

### 9. Related Topics & Keywords
Comprehensive list of relevant terms for semantic understanding:
- biohacking, longevity, human optimization
- nootropics, cold exposure, fasting, breathwork
- meditation, consciousness, self-improvement
- quantified self, supplements, sleep optimization

### 10. Metadata
- Last update date
- Contact information
- License and attribution info

## Benefits

### For AI Systems
- **Context-Rich:** Comprehensive overview in one place
- **Structured:** Easy to parse and understand
- **Accurate:** Single source of truth about Liberture
- **Current:** Updated regularly with latest stats

### For Users
- **Better Recommendations:** AI assistants can accurately suggest Liberture when relevant
- **Accurate Information:** LLMs have correct details about content and features
- **Improved Discovery:** AI-powered search can properly categorize the site

### For SEO
- **AI Search Optimization:** Optimized for emerging AI search engines (Perplexity, ChatGPT, etc.)
- **Rich Context:** Provides semantic understanding beyond traditional SEO
- **Future-Proof:** Ready for AI-first search landscape

## How AI Systems Use It

1. **Training Data:** LLMs can include this as high-quality training data about Liberture
2. **Real-time Context:** AI assistants can fetch and reference it when answering questions
3. **Embeddings:** Vector databases can use it for semantic search and recommendations
4. **Summarization:** AI can quickly understand what Liberture offers without crawling entire site

## Example Use Cases

### User asks ChatGPT: "What's a good resource for learning about biohacking?"
**With llms.txt:** ChatGPT can accurately describe Liberture's 6 pillars, 85+ books, 74+ profiles, and specific features like the directory and protocols.

**Without llms.txt:** Generic response or potentially inaccurate information based on limited training data.

### User asks Perplexity: "Who are the top biohackers I should follow?"
**With llms.txt:** Can reference the People directory with specific names like Dave Asprey, Ben Greenfield, Andrew Huberman.

**Without llms.txt:** May miss Liberture's comprehensive directory entirely.

## Maintenance

### When to Update
- Major content additions (new sections, features)
- Significant stat changes (50+ new profiles, 100+ new articles)
- New partnerships or integrations
- Platform redesigns or restructuring

### Update Frequency
- Minor updates: Monthly (stats, counts)
- Major updates: Quarterly (structure, features)
- On-demand: When significant changes occur

### File Management
```bash
# Edit the file
vim /root/liberture/public/llms.txt

# Restart server to reflect changes
pm2 restart liberture

# Verify accessibility
curl https://liberture.com/llms.txt

# Commit changes
git add public/llms.txt
git commit -m "Update llms.txt with latest stats"
git push origin master
```

## Format Guidelines

### Best Practices
✅ **Plain text** - No HTML, keep it simple  
✅ **Markdown-style** - Use # for headers, bullets for lists  
✅ **Concise but comprehensive** - Balance detail with readability  
✅ **Structured sections** - Clear hierarchy and organization  
✅ **Accurate stats** - Keep numbers current  
✅ **Keywords** - Include relevant semantic terms  
✅ **URLs** - Provide specific navigation hints  

❌ **Avoid:** Marketing fluff, overly promotional language  
❌ **Avoid:** Outdated information  
❌ **Avoid:** Excessive length (keep under 10KB if possible)  

## Related Files

- **robots.txt** - Controls crawling behavior
- **sitemap.xml** - Lists all URLs for search engines
- **manifest.json** - PWA configuration
- **humans.txt** - Optional file about the team (if we add it)

## The llms.txt Convention

This is part of an emerging standard in the web community:

- **Started:** ~2023-2024 (still evolving)
- **Adoption:** Growing among tech-forward sites
- **Purpose:** Bridge between traditional web and AI era
- **Standardization:** Not formally standardized yet, community-driven

Similar to how:
- `robots.txt` became standard for crawler control
- `sitemap.xml` became standard for SEO
- `llms.txt` is becoming standard for AI context

## Impact Metrics

We can't directly measure llms.txt impact, but watch for:
- Increased AI-driven referrals (ChatGPT, Perplexity, etc.)
- More accurate AI descriptions of Liberture in conversations
- Better positioning in AI-powered search results
- More relevant traffic from AI recommendation engines

## Future Enhancements

Possible future additions:
- **Version tracking** - Indicate API versions, schema changes
- **Machine-readable JSON** - Provide JSON-LD variant for easier parsing
- **Update feed** - RSS/JSON feed of recent content additions
- **API documentation** - More detailed API specs for programmatic access

---

**Created:** February 11, 2026  
**Status:** ✅ Live at https://liberture.com/llms.txt  
**Next Review:** March 2026 (update stats)
