# Agent Guidelines

- Ensure all user-facing text is sourced from the translations file so new strings can be localized.
- When adding new UI copy, update `lib/translations.ts` first and reference those entries in components.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Component reuse and clean code

- Before building or changing UI, find the component used for the same interaction elsewhere in Liberture. Reuse it across public and signed-in pages. If behavior differs, extend its props or compose existing components before introducing a separate implementation.
- Keep components focused, props explicit, and data shaping outside presentation code where practical. When a new component is necessary, extract shared behavior once and keep existing callers working.

## Directory edit history

- Record every applied AI-assisted change to an existing person, book, organization, protocol, or article in that entry’s edit history. Include the responsible administrator or job, the AI source, and the fields changed with their previous and new values. A queued request or a draft is not an applied edit.
- Use the authenticated directory PATCH endpoint with the `X-Liberture-Edit-Source: ai` header, or the shared `withDirectoryEdit` transaction for server-side jobs. Write the entry and its revision atomically. Bulk jobs must produce a separate revision for each changed entry.

## Releases and editorial updates

- Batch application and schema changes for local review. Publish a release and trigger production deployment only when the user explicitly asks to cut a release.
- Apply editorial changes through the database with per-entry edit history. If an edit depends on new application behavior, verify it locally and coordinate its production application with the release that supports it.
