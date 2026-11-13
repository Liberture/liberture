# Changelog

## 0.3.0

Released 2026-11-13. This release also delivers the book card updates from 0.2.1, whose production build failed on the People page.

- **Directory and books.** Search, sort and continuously scroll directory listings. The sort control fits its selected option. Pillar pages share directory cards. Book pages distinguish titles from subtitles and group covers, credits, editions, publication details and verticals together. Older book slugs can resolve to the current entry. Missing numeric metadata no longer appears as a stray zero. The People page builds successfully.
- **Languages.** Public routes, directory content, protocol metadata and share previews support English and Spanish. The database supports editorial translations and book slug aliases. Operators can check and import reviewed translations using the [editorial content guide](docs/content/README.md).
- **Habit tracker.** A vertical selector switches between Day, Week and Matrix with directional transitions. Week and Matrix fill the available height for short lists and scroll for long ones. Week gives habit names more room, moves Edit and Restore into the row and shows the streak as a flame and count with a localized personal-best tooltip. The toolbar groups by time or category and includes Add habit. All seven days remain reachable on narrow screens.
- **Habit controls.** Add and Edit share a tabbed form. Day navigation, date selection and statistics reuse a localized calendar. The dashboard shows a one-time welcome toast and provides a floating tutorial button.
- **Catalog.** The tracker catalog lives at `?view=catalog`; existing Discover, Market and Coach links still work. Desktop search and full-width filters share a sticky sidebar with the Catalog heading. Selected authors appear below the input, sorting stays with the results and featured labels appear on card artwork. Mobile places the controls above the results.
- **API access and performance.** Tracker writes are atomic and scoped to their owner. Push subscriptions and assistant connections enforce ownership, and concurrent permission updates preserve separate changes. Narrower database reads, fewer background requests and cleanup of disconnected event streams reduce server work. Public protocol responses are cached per language for one minute. Personal responses use private, no-store caching.
- **API migration.** The redundant `/api/auth/me` and `/api/storage/import` routes have been removed. Use `/api/auth/nostr/session` for a Nostr session or `/api/auth/verify` for legacy verification. To merge habit history, use Settings → Data → Merge history or `/api/import/habit-history`. Send API keys in the Authorization bearer header. The event stream retains legacy query-key support.
- **Analytics and operations.** Google Analytics and Ahrefs load after analytics consent. Production bundles include localization resources, and the health endpoint reports the running package version.

## 0.2.1

Released 2026-11-13.

- **Books.** Book cards show available covers and every assigned vertical in its own color across the directory, library, author profiles and pillar pages.

## 0.2.0

Released 2026-11-13.

- **Directory content.** Profiles and article reading notes are maintained in PostgreSQL. Retired repository content snapshots, old seed tools and the unused Creator Studio prototype.
- **Languages.** English and Spanish editions of translated pages have shareable URLs and reciprocal sitemap entries.
- **Games.** Retired the sleep and hydration simulations and removed their listings. Removed the unused Coming Soon page.
- **Operations.** Production deployments now run on published stable GitHub Releases. The workflow checks the tag against the package version and changelog before testing and building.
- **Upgrading.** Back up the database before upgrading. Existing installations using the older editorial files should finish importing their profile and article content before removing those files.

## 0.1.0

Tagged 2026-11-13 as the first recorded production baseline.

- **Tracker and marketplace.** Nostr sign-in, habit onboarding, progress tracking, assistant connections and a searchable protocol library with downloadable PDFs.
- **Directory.** People, projects and organizations have linked profiles. Directory edits have revision history, and articles support topic search and related reading.
- **Administration.** User and subscriber management, protected newsletter signup and migration of existing tracker identities to Better Auth.
- **Licensing.** Liberture is distributed under the GNU General Public License v3.0.
