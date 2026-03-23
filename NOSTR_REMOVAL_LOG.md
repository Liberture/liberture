# Nostr Features Removal Log

**Date**: 2026-03-22
**Reason**: Simplify the codebase by removing Nostr publishing, collaboration, and NIP-46 features. The app now uses the database directly instead of reading/writing through Nostr relays.

## What was KEPT

- **Nostr authentication (NIP-07)**: Users and admin can still log in by signing a challenge with their Nostr browser extension (Alby, nos2x)
- **Admin pubkey check**: `lib/auth.ts` still hardcodes the admin npub for authorization
- **User.nostrPubkey field**: Kept in the database for authentication
- **lib/nostr.ts**: Event verification used by the auth flow
- **types/nostr.ts**: Type definitions for NIP-07 window.nostr
- **app/api/auth/nostr/route.ts**: The login API endpoint

## What was REMOVED

### Database Models (prisma/schema.prisma)
- **NostrAccount** — Stored Liberture's NIP-46 bunker credentials (npub, pubkeyHex, nbunkerUrl, nbunkerSecret)
- **CollaborationRequest** — Tracked collaboration requests from external users (npub, message, status)
- **Collaborator** — Approved collaborators who could publish content (npub, displayName, wotScore, nostrProfile)
- **Nostr fields on content models** — Removed `authorPubkey`, `nostrEventId`, `nostrDTag`, `wotScore` from: Book, KnowledgeArticle, Organization, Protocol

### Library Files
- **lib/nostr-publisher.ts** — NostrPublisher class, event creation functions, relay publishing
- **lib/nip46.ts** — NIP-46 remote signer (Nip46Client, bunker URL parsing, nostrconnect session management)
- **lib/nostr-account.ts** — getLibertureNostrAccount() credential retrieval
- **lib/nostr-dm.ts** — sendCollaborationDM() encrypted DM sending
- **lib/nostr-reader.ts** — fetchPeople/Books/Organizations/Protocols from Nostr relays
- **lib/collaborator.ts** — isWhitelisted(), getCollaboratorByPubkey(), getActiveCollaborators()

### Admin Panel
- **app/admin/nostr-settings.tsx** — Nostr account configuration tab (bunker URL, connection status)
- **app/admin/collaboration-requests.tsx** — Collaboration request management tab (approve/reject)
- Removed "Nostr" and "Collaborators" tabs from admin/page.tsx
- Removed "Publish to Nostr" and "Publish All to Nostr" buttons from directory-admin.tsx
- Removed collaborator grant/revoke buttons from users-admin.tsx
- Removed Nostr profile fetching from users-admin.tsx

### API Routes
- **app/api/admin/nostr-account/** — GET/POST Nostr account configuration
- **app/api/admin/publish/** — POST publish content to Nostr relays
- **app/api/admin/collaboration-requests/** — GET/PATCH collaboration requests
- **app/api/admin/users/[id]/collaborator/** — POST/DELETE collaborator status
- **app/api/nostr-profile/[pubkey]/** — GET Nostr kind 0 metadata from relays
- **app/api/collaborate/** — POST collaboration requests, GET status

### Dashboard Components
- **app/dashboard/nostr-profile.tsx** — User's Nostr profile display
- **app/dashboard/collaboration-card.tsx** — Collaboration status and request form

### Pages
- **app/(site)/collaborate/page.tsx** — Public collaboration request page

### Login Page Changes
- **app/(site)/login/page.tsx** — Removed NIP-46 tabs (Mobile QR, Bunker URL). Now extension-only login.
- **lib/auth-context.tsx** — Removed loginWithNip46, NIP-46 session restore, bunker connection cleanup

## API Route Changes

### app/api/people|books|organizations|protocols/route.ts
- Previously: Tried fetching from Nostr relays first, fell back to database
- Now: Reads directly from the database only

### app/api/dashboard/content/route.ts
- Removed collaborator permission check (admin-only now)
- Removed nostrEventId, nostrDTag, authorPubkey from content creation

### app/api/dashboard/my-content/route.ts
- Removed authorPubkey-based content filtering
- Now returns recent content for admins

### app/api/admin/users/route.ts
- Removed collaborator status lookup from user list

## Migration Note

A Prisma migration is needed to drop the removed models and fields from the production database. Run:
```
npx prisma migrate dev --name remove-nostr-features
```
