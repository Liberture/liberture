# Liberture SEO & Domain Authority Strategy

## Current Status
- New domain (liberture.com)
- 100 knowledge articles
- No sitemap yet
- No internal linking structure
- No backlink strategy

## Goals
1. Build Domain Authority (DA) from 0 → 30+ in 6 months
2. Rank for biohacking keywords
3. Get organic traffic from Google

---

## 1. Technical SEO (Priority 1)

### A. XML Sitemap
Generate dynamic sitemap with priority levels:

```xml
/knowledge/[article] - priority: 0.8, changefreq: weekly
/people/[person] - priority: 0.7, changefreq: monthly
/directory/* - priority: 0.9, changefreq: daily
/marketplace/* - priority: 0.6, changefreq: monthly
```

**Implementation needed:**
- `/app/sitemap.ts` - Next.js dynamic sitemap
- Submit to Google Search Console
- Submit to Bing Webmaster Tools

### B. robots.txt
```
User-agent: *
Allow: /
Sitemap: https://liberture.com/sitemap.xml

# Crawl delay for politeness
Crawl-delay: 1
```

### C. Metadata Optimization
Every page needs:
- Unique `<title>` (50-60 chars)
- Meta description (150-160 chars)
- Open Graph tags (for social sharing)
- Schema.org structured data (Article, Person, Organization)

---

## 2. Content Strategy for SEO

### A. Keyword Targeting
Each article should target:
- **Primary keyword** (e.g., "cold exposure benefits")
- **Secondary keywords** (e.g., "wim hof method", "cold therapy")
- **Long-tail keywords** (e.g., "how to start cold showers for beginners")

### B. Content Pillars (Hub & Spoke Model)
Create **pillar pages** for each of the 6 main topics:
1. `/knowledge/cognition` - Hub page linking to all cognition articles
2. `/knowledge/recovery` - Hub page for recovery
3. `/knowledge/fueling` - Hub page for nutrition
4. `/knowledge/mental` - Hub page for mental health
5. `/knowledge/physicality` - Hub page for exercise
6. `/knowledge/finance` - Hub page for financial independence

**Each hub page:**
- 2,000+ words of comprehensive content
- Links to all related articles (internal linking)
- Targets broad keyword (e.g., "biohacking cognition")

### C. Internal Linking
Every article should link to:
- 3-5 related articles within Liberture
- 1-2 pillar pages
- Relevant people/protocols/books in directory

**Benefits:**
- Distributes "link juice" across site
- Helps Google understand site structure
- Increases time on site (user engagement)

---

## 3. Backlink Strategy (Most Important for DA)

### A. Guest Posting
Write for:
- Medium publications (biohacking, health)
- dev.to (if tech-focused content)
- HackerNoon
- Indie Hackers

Include link back to Liberture in bio or article.

### B. Directory Submissions
Submit to:
- Product Hunt (if we have a "product" angle)
- BetaList
- Hacker News (Show HN: Liberture - Free Biohacking Directory)
- Reddit (r/Biohacking, r/Nootropics - be helpful, not spammy)

### C. Resource Pages
Reach out to sites with "biohacking resources" pages:
- Ask to be listed
- Provide value (our directory is free, comprehensive)

### D. Social Signals
- Twitter/X posts linking to articles
- LinkedIn shares
- Reddit discussions (genuine, helpful)

---

## 4. Sitemap Structure

### Priority Levels (0.0 - 1.0)

**Priority 1.0 (Most Important):**
- `/` - Homepage
- `/directory` - Main directory

**Priority 0.9 (Very Important):**
- `/knowledge` - Knowledge hub
- `/people` - People directory
- `/organizations` - Orgs directory
- `/protocols` - Protocols directory
- `/books` - Books directory

**Priority 0.8 (Important):**
- Individual knowledge articles
- Featured people/books/protocols

**Priority 0.7 (Medium):**
- Non-featured people/books/protocols

**Priority 0.6 (Lower):**
- Marketplace items
- Contact page
- About page

**Priority 0.5 (Lowest):**
- Admin pages
- Auth pages

### Change Frequency
- **Daily:** Homepage, directory pages
- **Weekly:** Knowledge articles (updated with new info)
- **Monthly:** People, books, protocols
- **Yearly:** Static pages (about, contact)

---

## 5. Implementation Checklist

### Phase 1: Technical Foundation (Week 1)
- [ ] Generate dynamic sitemap (`/app/sitemap.ts`)
- [ ] Add robots.txt
- [ ] Add meta tags to all pages
- [ ] Submit to Google Search Console
- [ ] Submit to Bing Webmaster Tools

### Phase 2: Content Optimization (Week 2-3)
- [ ] Create 6 pillar pages (one per pillar)
- [ ] Add internal links to all articles
- [ ] Optimize titles and descriptions
- [ ] Add schema.org markup

### Phase 3: Link Building (Ongoing)
- [ ] Guest post on Medium (2x/month)
- [ ] Share on social media (3x/week)
- [ ] Submit to directories
- [ ] Engage on Reddit/HN (helpful comments)

### Phase 4: Monitoring (Ongoing)
- [ ] Track rankings (Google Search Console)
- [ ] Monitor backlinks (Ahrefs free tier / Moz)
- [ ] Track DA growth (check monthly)
- [ ] Analyze traffic (Google Analytics)

---

## 6. Expected Timeline

**Month 1-2:** DA 0 → 5-10
- Technical SEO in place
- First backlinks from directories

**Month 3-4:** DA 10 → 15-20
- Guest posts published
- Social signals growing
- First organic traffic

**Month 6:** DA 20 → 30+
- 500+ organic visitors/month
- Ranking for long-tail keywords
- Backlinks from reputable sites

**Month 12:** DA 30 → 40+
- 2,000+ organic visitors/month
- Ranking for competitive keywords
- Authority in biohacking niche

---

## 7. Tools

**Free:**
- Google Search Console (track rankings, clicks)
- Google Analytics (track traffic)
- Bing Webmaster Tools
- Ahrefs free backlink checker (100 queries/month)

**Paid (Optional):**
- Ahrefs ($99/mo) - Backlink analysis, keyword research
- SEMrush ($119/mo) - Full SEO suite
- Moz Pro ($99/mo) - DA tracking

---

## Next Steps

1. I'll build the sitemap system now
2. Create pillar pages for each of the 6 pillars
3. Add internal linking to all articles
4. Submit to Google Search Console

Ready to implement?
