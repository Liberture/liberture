# SEO Automation System

Automated scripts to ensure Liberture follows SEO best practices at all times.

---

## Quick Start

### Daily Automated Check

```bash
# Run SEO health check (daily via heartbeat)
cd /root/liberture && npx tsx scripts/seo/seo-health-check.ts
```

### After Adding New Content

```bash
# 1. Check SEO health
npx tsx scripts/seo/seo-health-check.ts

# 2. Find internal linking opportunities
npx tsx scripts/seo/auto-internal-linking.ts

# 3. Rebuild sitemap
npm run build && pm2 restart liberture

# 4. Ping search engines
npx tsx scripts/seo/ping-search-engines.ts
```

---

## Scripts

### 1. `seo-health-check.ts`

**Purpose:** Comprehensive SEO audit

**Checks:**
- ✅ Sitemap accessible
- ✅ Robots.txt configured
- ✅ Unique titles/descriptions
- ✅ No duplicate slugs
- ✅ Proper content quality (tags, read times)
- ✅ Internal linking structure

**Usage:**
```bash
npx tsx scripts/seo/seo-health-check.ts
```

**Output:**
- Score: 0-100
- Errors (critical, must fix)
- Warnings (should fix)
- Info (nice to have)

**Exit codes:**
- `0` - All checks passed
- `1` - Critical errors found

**Integration:**
- Daily heartbeat
- Pre-commit hook
- GitHub Actions CI/CD

---

### 2. `auto-internal-linking.ts`

**Purpose:** Find internal linking opportunities

**How it works:**
1. Analyzes all knowledge articles
2. Finds related articles by keywords/tags/pillar
3. Suggests 3-5 links per article
4. Outputs recommendations

**Usage:**
```bash
npx tsx scripts/seo/auto-internal-linking.ts
```

**Output:**
```
📋 Sample opportunities:
1. "Cold Showers and Dopamine"
   → Link to: "Zone 2 Training" (/knowledge/zone-2-training)

2. "Adaptogens for Stress"
   → Link to: "Magnesium Benefits" (/knowledge/magnesium-benefits)
```

**Next steps:**
- Review suggestions
- Add links manually to article content
- Or implement auto-injection (future)

---

### 3. `ping-search-engines.ts`

**Purpose:** Notify Google/Bing of sitemap updates

**When to run:**
- After publishing new content
- After major sitemap changes
- Weekly (for freshness signal)

**Usage:**
```bash
npx tsx scripts/seo/ping-search-engines.ts
```

**What it does:**
1. Pings Google with sitemap URL
2. Pings Bing with sitemap URL
3. (Future) IndexNow API for instant indexing

**Note:** Google/Bing will still crawl on their schedule, but this can speed up discovery.

---

### 4. `install-git-hooks.sh`

**Purpose:** Automate SEO checks in Git workflow

**What it installs:**
- **Pre-commit hook** - Runs SEO health check before commit
- **Post-commit hook** - Reminds to rebuild if content changed

**Usage:**
```bash
cd /root/liberture
bash scripts/seo/install-git-hooks.sh
```

**Bypass (not recommended):**
```bash
git commit --no-verify
```

---

## Automation Schedule

### Daily (via Heartbeat)

**Time:** Every heartbeat poll (~30min intervals)

**Script:** `seo-health-check.ts`

**Added to:** `/root/.openclaw/workspace/HEARTBEAT.md`

**Tracking:** `heartbeat-state.json` → `lastSEOCheck`

---

### Weekly (Monday Morning)

**Time:** Monday 9 AM (manual or cron)

**Tasks:**
1. Run `seo-health-check.ts`
2. Run `auto-internal-linking.ts`
3. Check Google Search Console
4. Review top performing content
5. Plan content for the week

**Cron job (optional):**
```bash
# Add to crontab
0 9 * * 1 cd /root/liberture && npx tsx scripts/seo/seo-health-check.ts && npx tsx scripts/seo/auto-internal-linking.ts
```

---

### Monthly

**Tasks:**
1. Check Domain Authority (Ahrefs/Moz)
2. Review backlink profile
3. Update old content (freshness)
4. Submit new guest posts

---

## Guidelines

### Pre-Deployment Checklist

See `/root/liberture/docs/SEO-CHECKLIST.md` for full checklist.

**Quick version:**
- [ ] Run `seo-health-check.ts` (0 errors)
- [ ] Build succeeds (`npm run build`)
- [ ] Unique titles/descriptions for new pages
- [ ] 3-5 internal links added
- [ ] 3-5 external references added

---

### Content Creation Guidelines

**Every New Article:**

1. **Before writing:**
   - Choose primary keyword
   - Plan 3-5 internal links
   - Plan 3-5 external references

2. **While writing:**
   - Use primary keyword in title
   - Use primary keyword in first 100 words
   - Add internal links naturally
   - Add external references for claims

3. **After writing:**
   - Unique slug (no duplicates)
   - Meta description (150-160 chars)
   - Read time calculated (words / 200)
   - 3-5 tags assigned
   - Pillar assigned correctly

4. **Before publishing:**
   - Run SEO health check
   - Preview on mobile
   - Proofread

5. **After publishing:**
   - Rebuild site (`npm run build && pm2 restart liberture`)
   - Ping search engines (`ping-search-engines.ts`)
   - Share on social media

---

## CI/CD Integration

### GitHub Actions

**File:** `.github/workflows/seo-check.yml`

**Triggers:**
- Pull requests to master/main
- Pushes to master/main
- Daily schedule (9 AM UTC)

**What it does:**
1. Builds application
2. Checks sitemap generated
3. Checks robots.txt generated
4. Runs SEO health check
5. Comments on PR with results

**Setup:**
1. Add `DATABASE_URL` to GitHub Secrets
2. Push workflow file
3. Checks run automatically

---

## Troubleshooting

### "Sitemap not accessible"

**Fix:**
```bash
# 1. Check sitemap.ts exists
ls -la /root/liberture/app/sitemap.ts

# 2. Rebuild
cd /root/liberture && npm run build

# 3. Restart
pm2 restart liberture

# 4. Test
curl -s https://liberture.com/sitemap.xml | head -20
```

### "Duplicate titles found"

**Fix:**
```bash
# Find duplicates
cd /root/liberture && npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const articles = await prisma.knowledgeArticle.findMany({ select: { title: true } });
const titles = articles.map(a => a.title);
const duplicates = titles.filter((t, i) => titles.indexOf(t) !== i);
console.log('Duplicates:', duplicates);
await prisma.\$disconnect();
"
```

Then update titles to be unique.

### "SEO health check failing on CI"

**Common causes:**
1. Missing `DATABASE_URL` in GitHub Secrets
2. Build errors (TypeScript, missing deps)
3. Sitemap not generated (check `app/sitemap.ts`)

**Debug:**
```bash
# Run locally with same environment
npm run build
npx tsx scripts/seo/seo-health-check.ts
```

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Dynamic sitemap
- ✅ Robots.txt
- ✅ SEO health check
- ✅ Internal linking suggestions
- ✅ Search engine pinging

### Phase 2 (Next)
- 🔲 Auto-inject internal links (modify article content)
- 🔲 Schema.org markup generator
- 🔲 Pillar page creator
- 🔲 Keyword rank tracking
- 🔲 Google Search Console API integration

### Phase 3 (Future)
- 🔲 AI-powered content gap analysis
- 🔲 Automatic meta description generator
- 🔲 Image alt text generator
- 🔲 Competitor content analysis
- 🔲 Backlink opportunity finder

---

## Files

```
liberture/
├── app/
│   ├── sitemap.ts          # Dynamic XML sitemap
│   └── robots.ts           # Robots.txt
├── scripts/seo/
│   ├── README.md           # This file
│   ├── seo-health-check.ts # Automated SEO audit
│   ├── auto-internal-linking.ts # Find link opportunities
│   ├── ping-search-engines.ts # Notify Google/Bing
│   └── install-git-hooks.sh # Git automation
├── .github/workflows/
│   └── seo-check.yml       # GitHub Actions CI
└── docs/
    ├── SEO-STRATEGY.md     # Overall SEO strategy
    └── SEO-CHECKLIST.md    # Pre-deployment checklist
```

---

**Last Updated:** 2026-02-12  
**Maintainer:** Robert Claw (AI)  
**Support:** Check docs/ or ask Leon
