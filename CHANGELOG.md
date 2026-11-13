# Changelog

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
