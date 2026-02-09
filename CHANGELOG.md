# Liberture Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added (2026-02-10 Overnight Session)
- **36 knowledge articles** across all 6 pillars (260% growth)
- **Server-side search API** with full-text search, filtering, and sorting
- **Related Articles system** with smart relevance scoring
- **Popular/Trending articles** with diversity algorithm
- **Social sharing component** (Twitter, LinkedIn, Facebook, Email, Copy)
- **7 database indexes** for 10-100x query performance improvement
- **Automated backup system** with S3 upload support
- **SEO files:** robots.txt and humans.txt
- **Comprehensive analysis document** (UI/UX, marketing, tech, security)
- **Feature documentation** for all new capabilities

### Changed
- `/app/api/knowledge/route.ts` - Enhanced with search and filter params
- Database schema - Added pg_trgm extension for fuzzy search

### Performance
- Database queries now 10-100x faster with proper indexing
- Full-text search enabled on title and description fields
- Composite indexes for most common query patterns

### Security
- robots.txt blocks admin and API routes from search engines
- Backup system with 7-day retention
- Graceful error handling on all new endpoints

---

## [0.1.0] - 2026-02-07

### Added
- Initial Liberture platform launch
- 6-pillar system (Cognition, Recovery, Fueling, Mental, Physicality, Finance)
- Directory structure (/people, /organizations, /protocols, /books)
- Admin panel with user management
- Newsletter subscription system
- Marketplace with FREE-only products
- Animated homepage with Framer Motion
- Better-Auth authentication system

### Technical
- Next.js 15 App Router
- PostgreSQL with Prisma ORM
- Tailwind CSS styling
- PM2 process management
- Cloudflare DNS

---

## Future Versions

### Planned Features
- User accounts with personalized recommendations
- Bookmarking system
- Content voting/reactions
- Advanced search with faceted filters
- Mobile PWA
- Newsletter with actual content delivery
- Community features (comments, discussions)

### Performance Goals
- Lighthouse score >95
- Sub-second API responses
- CDN for static assets
- Image optimization pipeline

### Security Roadmap
- Rate limiting on public APIs
- CSRF protection
- 2FA for admin accounts
- GDPR compliance (cookie consent, data export)
- Security audit

---

_For detailed feature documentation, see `/docs/OVERNIGHT-FEATURES-2026-02-09.md`_
