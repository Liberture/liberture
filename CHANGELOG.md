# Changelog

## Unreleased

- Automatically lock an existing creator advance once the opponent’s deposit is verified, without creating another invoice. Resume from the player’s device after reopening the challenge.
- Treat selecting a result as payout approval. Matching votes automatically prepare, sign, and settle either winner’s payout or a draw, with device-side keys and persisted payout plans for safe retries.
- Ignore malformed or duplicate Nostr inbox addresses and distinguish unavailable relays from rejected messages. Private messages still go only to the recipient’s advertised inbox relays and require a relay acknowledgment.

## 0.8.2

Released 2026-11-15.

- Restore the mint’s restricted Lightning proxy compatibility after the previous rebuild skipped its patch, fixing new invoice creation.
- Include the standard error detail alongside code 20008 so the wallet can retry legacy quote signatures when reclaiming or locking an already-paid advance. Existing quotes, signing keys, proofs, and balances are preserved.
- Require an opponent or an explicit link-invitation choice when creating a challenge, enforced in the interface and API. Link invitations remain available for people without Nostr.
- Avoid requesting the Vercel analytics script on the self-hosted deployment. Existing Google and Ahrefs analytics are unchanged.
- Verify the patched mint source and HTTP contracts before builds, with proxy request and serialized error regression tests.

## 0.8.1

Released 2026-11-15.

- Fix the mint’s generic “Unknown error” when reclaiming or locking a paid challenge advance. The mint now returns the correct invalid-signature code so cashu-ts can retry its supported legacy signature, using the same paid quote and outputs.
- Add mint-side and wallet regression coverage. Preserve mint keys, quote state and deposits; take an encrypted backup and retain the previous binary for rollback.

## 0.8.0

Released 2026-11-15.

- Challenge recipients can join and pay their stake directly from the invitation. Existing members return to their match, and pending invoices resume after reload without requesting a second payment.
- Show who is waiting and the next action inside the match card. Keep routine signing-key backups in the background and show recovery controls only when wallet access is missing. Reclaimed advances can be copied into a Cashu wallet as well as downloaded.
- Start the race once both locked stakes are confirmed, with linked daily tasks for tracker members and check-ins for guests. Public spectators see the same race progress.
- Verify the creator’s payment before issuing invitations. Payment initiation requires an explicit user action; a URL alone cannot trigger a wallet payment.
- Preserve existing challenge keys, quotes, deposits and refund deadlines. This release does not move existing funds or change their spending conditions.

## 0.7.0

Released 2026-11-15.

- Reviewed and integrated the bilingual Royal Flush article, protocol and artwork, with an atomic database import.
- Manage article and protocol covers and social previews through the directory editor, including Spanish variants and Hetzner uploads. Existing protocol edits survive release preparation.
- Show a cancellable waiting screen while Nostr signers approve the login-event signature.

- Release preparation imports the reviewed article and protocol into the database and migrates editorial image references to Hetzner. Application rollback preserves these database edits and uploaded assets.

## 0.6.1

Released 2026-11-13.

- Restored the localized Liberture sign-in dialog. Pair a NIP-46 signer by QR code, open it on the same device, or paste its bunker URI. New QR pairings use the Damus and Primal relays.

## 0.6.0

Released 2026-11-13.

- Tracker sections have direct URLs and share navigation. Challenges can be created at /tracker/challenges/new, and the history sidebar supports search and status filters.
- Choose an opponent by Nostr profile or invite link, add an optional moderator, and share a read-only spectator page. The animated matchup shows both players and their progress.
- Creators can pay their stake before an opponent joins using WebLN or a Lightning invoice. They can reclaim their advance before locking it into the match. Signed-in players can send an encrypted signing-key backup to their Nostr inbox.
- Nostr sign-in uses the LoginModal from @nostr-wot/ui 2.0.1 for browser extensions, remote signers, and generated or imported keys. Liberture verifies the signature before creating the server session.

## 0.5.1

Released 2026-11-13.

- Challenge invitations now use compact copy and send actions. Search followed profiles first, discover other profiles through the wallet’s search relay, or paste an npub to review the recipient before sending.
- The mint checks payment status through wallet-scoped proxy history. Release cleanup can remove cache directories created by the application.

## 0.5.0

Released 2026-11-13.

- **Lightning funding.** New challenges use the Nostr WoT mainnet Cashu mint at mint.nostrwot.com. Players pay a Lightning invoice and can resume a pending deposit from the same browser. Each stake is limited to 10,000 sats. Existing test challenges retain their original mint for payouts and refunds.
- **Moderation and invitations.** Two players can fund immediately after the second player joins. For arbitration, select a Nostr moderator who has registered their browser-held Cashu key. Invite a player by private link, profile search or npub. The tracker uses layered SVG cashew characters for sparring, victories and draws.
- **Sign-in.** The login dialog supports pasting a bunker URI while QR pairing is pending and uses nostr-tools 2.26.0.
- **Operations.** Apply the moderator registry migration. Nostr WoT operates the mint behind a rate-limited gateway with a dedicated LNbits wallet accessed through the existing proxy. Restore the mint database and key material together. Preserve mint availability and challenge records when rolling back the tracker.

## 0.4.0

Released 2026-11-13.

- **Tracker challenges.** Two players can agree on rules, invite a moderator and stake Cashu test sats. Invitees can join by private link without a Nostr account or receive an encrypted invitation to their Nostr inbox. Both players can award the pot to either player or agree on a draw. A disputed payout requires the moderator and one player to sign. After the deadline each depositor can reclaim their unspent stake. Test sats have no monetary value.
- **Tracker navigation and accounts.** The Day, Week and Matrix selector sits above the tracker. Tracker screens share session state and send owner-scoped API requests through a common client.
- **Languages and search.** English public pages use unprefixed canonical URLs, including in the sitemap. The language switcher resolves translated directory and article slugs. The Ahrefs site audit crawler can see the installation snippet.
- **Upgrading.** Apply the included PostgreSQL migration for challenges and deposit proof tracking before serving challenge traffic. An application rollback can leave the new tables in place. Preserve their contents while challenges have outstanding deposits.

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
