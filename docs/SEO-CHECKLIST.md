# SEO Pre-Deployment Checklist

**Run this checklist BEFORE every deployment to ensure SEO best practices.**

---

## Automated Checks (Run These Scripts)

### 1. SEO Health Check
```bash
cd /root/liberture && npx tsx scripts/seo/seo-health-check.ts
```

**Must pass with 0 errors before deploying.**

### 2. Build Validation
```bash
cd /root/liberture && npm run build
```

**Must complete successfully. Check for:**
- [ ] Sitemap generated (`/sitemap.xml`)
- [ ] Robots.txt generated (`/robots.txt`)
- [ ] No build errors
- [ ] No TypeScript errors

---

## Manual Checks

### Every New Page

- [ ] **Unique `<title>` tag** (50-60 characters)
- [ ] **Meta description** (150-160 characters)
- [ ] **Heading hierarchy** (H1 → H2 → H3, no skipping)
- [ ] **Alt text on images**
- [ ] **Internal links** to 3-5 related pages
- [ ] **External links** open in new tab (`target="_blank" rel="noopener"`)
- [ ] **Schema.org markup** (if applicable: Article, Person, Organization)

### Every New Article

- [ ] **Unique slug** (no duplicates)
- [ ] **Primary keyword** in title
- [ ] **Primary keyword** in first 100 words
- [ ] **Read time** calculated correctly (words / 200 wpm)
- [ ] **3-5 tags** assigned
- [ ] **Pillar** assigned correctly
- [ ] **3-5 internal links** to related articles
- [ ] **3-5 external references** to authoritative sources
- [ ] **References section** at end with numbered citations

### Content Quality

- [ ] **No duplicate content** (run plagiarism check if needed)
- [ ] **Proper grammar/spelling** (use Grammarly or similar)
- [ ] **Formatted in markdown** (headings, lists, bold/italic)
- [ ] **Mobile-friendly** (no wide tables, responsive images)
- [ ] **Accessible** (proper headings, alt text, color contrast)

---

## Weekly Maintenance

### Monday Morning SEO Review

```bash
# 1. Run health check
cd /root/liberture && npx tsx scripts/seo/seo-health-check.ts

# 2. Check internal linking opportunities
cd /root/liberture && npx tsx scripts/seo/auto-internal-linking.ts

# 3. Verify sitemap is up to date
curl -s https://liberture.com/sitemap.xml | grep -c "<url>"
# Should equal total pages in database
```

### Check Rankings (Google Search Console)

- [ ] Visit [Google Search Console](https://search.google.com/search-console)
- [ ] Check for crawl errors
- [ ] Review top performing pages
- [ ] Check average position for keywords
- [ ] Submit new pages manually if needed

### Backlink Monitoring (Monthly)

- [ ] Check [Ahrefs Free Backlink Checker](https://ahrefs.com/backlink-checker)
- [ ] Log new backlinks in `docs/SEO-BACKLINKS.md`
- [ ] Reach out to new link opportunities

---

## Content Creation Workflow

### Before Writing

1. **Keyword research**
   - Use Google Trends, Answer The Public
   - Check what competitors rank for
   - Choose primary + 3-5 secondary keywords

2. **Outline structure**
   - H1: Article title (with primary keyword)
   - H2-H3: Sections (with secondary keywords)
   - Plan internal links (3-5 related articles)
   - Plan external references (3-5 authoritative sources)

### During Writing

1. **Write naturally first** (don't keyword-stuff)
2. **Include primary keyword**:
   - In title
   - In first 100 words
   - In at least one H2
   - In conclusion
3. **Add internal links** as you mention topics
4. **Add external references** for scientific claims
5. **Use formatting**: bold, italic, lists, quotes

### After Writing

1. **Run through checklist above** (Every New Article)
2. **Preview on mobile** (responsive check)
3. **Check read time** (realistic?)
4. **Add to sitemap** (automatic on deploy)
5. **Share on social** (Twitter, LinkedIn) after publish

---

## Deployment Process

### Pre-Deploy

```bash
# 1. Run SEO health check
npx tsx scripts/seo/seo-health-check.ts

# 2. Build and verify
npm run build

# 3. Check for errors
# (should exit with code 0)
```

### Deploy

```bash
# 1. Commit changes
git add -A
git commit -m "Add: [description] - SEO optimized"

# 2. Push
git push origin master

# 3. Restart app
pm2 restart liberture
```

### Post-Deploy

```bash
# 1. Verify sitemap updated
curl -s https://liberture.com/sitemap.xml | head -30

# 2. Test new pages
curl -I https://liberture.com/knowledge/[new-slug]
# Should return 200 OK

# 3. Submit to Google (first time only)
# Visit Google Search Console → Sitemaps → Submit
# https://liberture.com/sitemap.xml
```

---

## Common Mistakes to Avoid

### ❌ Don't Do This

- **Duplicate titles** across multiple pages
- **Missing meta descriptions**
- **Keyword stuffing** (unnatural repetition)
- **Broken internal links** (to non-existent pages)
- **No external references** (looks thin, untrustworthy)
- **Ignoring mobile users** (wide tables, small text)
- **Forgetting alt text** (accessibility + SEO)
- **Publishing without proofreading** (typos hurt credibility)

### ✅ Always Do This

- **Unique, descriptive titles** for every page
- **Natural keyword usage** (write for humans first)
- **3-5 internal links** per article minimum
- **3-5 external references** to authoritative sources
- **Test on mobile** before publishing
- **Add alt text** to every image
- **Proofread** or run spell check
- **Update sitemap** (automatic, but verify)

---

## Tools & Resources

### Free Tools

- **Google Search Console** - Track rankings, crawl errors
- **Google Analytics** - Traffic, user behavior
- **Ahrefs Backlink Checker** - Free tier (100 checks/month)
- **Answer The Public** - Keyword ideas
- **Hemingway Editor** - Readability check
- **Grammarly Free** - Grammar/spelling

### Paid Tools (Optional)

- **Ahrefs** ($99/mo) - Full SEO suite
- **SEMrush** ($119/mo) - Competitor analysis
- **Surfer SEO** ($89/mo) - Content optimization
- **Clearscope** ($170/mo) - AI content brief

---

## Emergency Fixes

### Sitemap Not Updating

```bash
# 1. Check sitemap.ts exists
ls -la /root/liberture/app/sitemap.ts

# 2. Rebuild
cd /root/liberture && npm run build

# 3. Restart
pm2 restart liberture

# 4. Verify
curl -s https://liberture.com/sitemap.xml | head -30
```

### Duplicate Content Detected

1. Find duplicate via Google Search Console
2. Choose canonical version (keep best URL)
3. Add redirect from duplicate to canonical
4. Or add `<link rel="canonical">` to duplicate page

### Ranking Dropped

1. Check Google Search Console for manual actions
2. Check for broken links (run health check)
3. Check if competitor updated their content
4. Update your content (fresher = better)
5. Add more backlinks

---

## Automation Schedule

### Daily (Heartbeat)

```bash
# Run 1x per day during heartbeat
npx tsx scripts/seo/seo-health-check.ts
```

Add to `HEARTBEAT.md`:

```markdown
## SEO Health Check (1x daily)

Run automated SEO health check:
```
cd /root/liberture && npx tsx scripts/seo/seo-health-check.ts
```

Track in heartbeat-state.json under "lastSEOCheck"
```

### Weekly (Monday)

- Run internal linking analysis
- Check Google Search Console
- Review top performing content
- Plan new content based on keyword gaps

### Monthly

- Check Domain Authority score
- Review backlink profile
- Update old content (freshness)
- Create new pillar page or update existing

---

## Success Metrics

### Track These Monthly

- **Domain Authority** (DA) - Target: 0 → 30+ in 6 months
- **Organic Traffic** - From Google Analytics
- **Backlinks** - Total number + quality
- **Ranking Keywords** - How many keywords in top 10/20/50
- **Click-Through Rate** (CTR) - From Google Search Console
- **Average Position** - For target keywords

### Goals

**Month 1-2:**
- DA: 5-10
- Organic traffic: 50-100/month
- Backlinks: 5-10

**Month 3-4:**
- DA: 10-20
- Organic traffic: 200-500/month
- Backlinks: 20-30

**Month 6:**
- DA: 20-30
- Organic traffic: 500-1,000/month
- Backlinks: 50+

**Month 12:**
- DA: 30-40
- Organic traffic: 2,000-5,000/month
- Backlinks: 100+

---

**Last Updated:** 2026-02-12  
**Next Review:** Every deployment + weekly Monday morning
