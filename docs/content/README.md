# Directory content and search

Editors manage directory entries and their revision history in the admin panel. Programmatic edits follow the [directory edit history instructions](../../AGENTS.md#directory-edit-history).

## Data tools

The [Goodreads import scripts](../../scripts/goodreads-scraper/) collect book lists, resolve book details and normalize records using Google Books. The [Wikipedia script](../../scripts/enrich-from-wikipedia.ts) and [scraping scripts](../../scripts/scrapers/) are separate command-line tools. Check each script’s inputs and target database before running an import.

## Search metadata

The [sitemap](../../app/sitemap.ts) defines discoverable URLs. The [robots configuration](../../app/robots.ts) controls crawler access. Public detail pages use the [metadata helpers](../../lib/seo/) and [structured data components](../../components/seo/). Update the [published llms.txt](../../public/llms.txt) when public features or assistant endpoints change.

## Site features

The [games](../../app/(site)/games/) use the shared [game engine](../../components/games/). The [cookie consent component](../../components/legal/CookieConsent.tsx) loads Google Analytics after analytics consent and reads the GA4 measurement ID from the build-time variable `NEXT_PUBLIC_GA_ID`.
