# Liberture - Biological Operating System Platform

A comprehensive biohacking directory and knowledge platform for human optimization across 6 pillars.

## 6 Pillars

1. **Cognition** - Mental performance, focus, learning
2. **Recovery** - Sleep, rest, regeneration
3. **Fueling** - Nutrition, supplementation, metabolism
4. **Mental** - Emotional health, mindfulness, resilience
5. **Physicality** - Strength, endurance, movement
6. **Finance** - Wealth building, financial independence

## Features

### Directory
- **/people** - Biohackers, researchers, pioneers
- **/organizations** - Labs, companies, communities
- **/protocols** - Methods and systems for optimization
- **/books** - Free, royalty-free resources

### Knowledge Base
36+ curated articles across all 6 pillars:
- Cold exposure science
- Nootropics guides
- Sleep optimization
- Metabolic flexibility
- HRV training
- And more...

### Marketplace
Free protocols and resources (no monetization currently)

### Admin Panel
Full-featured admin system for managing:
- Users (ban/unban, roles, impersonation)
- Knowledge articles
- Marketplace items
- Content
- Social posts
- Platform comments

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database:** Prisma 5 + SQLite
- **Auth:** better-auth with Prisma adapter
- **Animations:** Framer Motion
- **Styling:** Tailwind CSS
- **UI:** Radix UI components
- **Deployment:** PM2 on Hetzner

## Development

```bash
pnpm install
pnpm dev              # Development server
pnpm build           # Production build
npx prisma db push   # Sync database schema
npx prisma studio    # Database GUI
```

## Database

Models:
- KnowledgeArticle
- MarketplaceItem
- Content
- SocialPost
- PlatformComment
- User
- Session
- Account
- Verification

## Authentication

Uses better-auth with admin plugin:
- Email/password login
- Session-based (7 day expiry)
- Admin impersonation support
- Role-based access (user/admin/moderator)
- Ban system with reasons

Admin login: https://liberture.com/admin-login

## Scripts

```bash
# Add knowledge articles
npx tsx scripts/add-knowledge-articles.ts
npx tsx scripts/add-more-articles.ts

# Add admin user
npx tsx scripts/create-admin.ts

# Sample data (when schema extended)
npx tsx scripts/add-sample-people.ts
```

## Deployment

Running on PM2 as `liberture`:
- Port: 3033
- Domain: https://liberture.com
- SSL: Let's Encrypt

```bash
pm2 restart liberture
pm2 logs liberture
```

## Project Structure

```
app/
├── (site)/           # Public pages
│   ├── (landing)/    # Homepage sections
│   ├── directory/    # Directory landing
│   ├── marketplace/  # Browse protocols
│   ├── knowledge/    # Browse articles
│   ├── people/       # Person profiles
│   ├── organizations/# Org profiles
│   ├── protocols/    # Protocol details
│   └── books/        # Book library
├── admin/            # Admin panel
│   ├── users-admin.tsx
│   ├── knowledge-admin.tsx
│   ├── marketplace-admin.tsx
│   └── ...
├── dashboard/        # User dashboard
└── api/              # API routes
    ├── auth/[...all]
    ├── admin/
    └── ...

components/
├── animations/       # Framer Motion wrappers
├── illustrations/    # SVG components
│   ├── backgrounds/
│   └── icons/
└── ui/               # Reusable UI components

lib/
├── animations.ts     # Animation variants
├── auth-better.ts    # Better-auth config
└── prisma.ts         # Prisma client

prisma/
├── schema.prisma     # Database schema
├── prisma/liberture.db
└── migrations/       # SQL migrations

scripts/
├── add-knowledge-articles.ts
├── add-more-articles.ts
├── add-sample-people.ts
└── create-admin.ts
```

## Content Focus

All content is:
- **Free** - No monetization, open access
- **Evidence-based** - Science-backed information
- **Royalty-free** - Public domain or properly licensed
- **Quality-first** - Curated, not aggregated

## Roadmap

- [ ] Extend schema with Person, Organization, Protocol, Book models
- [ ] Populate directory with real profiles
- [ ] User accounts and progress tracking
- [ ] Protocol templates and guides
- [ ] Community features
- [ ] Mobile app

## Contributing

Built and maintained by Robert Claw 🦞 for Leon Acosta

Last updated: February 8, 2026
