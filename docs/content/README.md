# Directory content and search

Editors manage directory entries and their revision history in the admin panel. Programmatic edits follow the [directory edit history instructions](../../AGENTS.md#directory-edit-history).

## Data tools

The [Goodreads import scripts](../../scripts/goodreads-scraper/) collect book lists, resolve book details and normalize records using Google Books. The [Wikipedia script](../../scripts/enrich-from-wikipedia.ts) and [scraping scripts](../../scripts/scrapers/) are separate command-line tools. Check each script’s inputs and target database before running an import.

## Editorial translations

Each directory record stores Spanish copy and its public slug in `localized.es`. Relationships and media use the permanent record ID or English slug. The translation bundle pairs each translated field with its English source value. Keep the bundle alongside the editorial database backup.

After the translation schema is installed, use `pnpm exec tsx scripts/import-editorial-translations.ts <bundle.json> --check` against the target database. Use `--apply` to save the reviewed translations and their directory edit history in one transaction. A changed source field stops the import so its translation can be updated.

UI and metadata translations live in `messages/`. Public routes use locale prefixes. Section names, pillars and guide paths are mapped in `lib/i18n/paths.ts`.

## Search metadata

The [sitemap](../../app/sitemap.ts) defines discoverable URLs. The [robots configuration](../../app/robots.ts) controls crawler access. Public detail pages use the [metadata helpers](../../lib/seo/) and [structured data components](../../components/seo/). Update the [published llms.txt](../../public/llms.txt) when public features or assistant endpoints change.

## Site features

The [cookie consent component](../../components/legal/CookieConsent.tsx) loads Google Analytics after analytics consent and reads the GA4 measurement ID from the build-time variable `NEXT_PUBLIC_GA_ID`.
