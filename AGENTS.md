# Agent Guidelines

- Ensure all user-facing text is sourced from the translations file so new strings can be localized.
- When adding new UI copy, update `lib/translations.ts` first and reference those entries in components.

## Directory edit history

- Record every applied AI-assisted change to an existing person, book, organization, protocol, or article in that entry’s edit history. Include the responsible administrator or job, the AI source, and the fields changed with their previous and new values. A queued request or a draft is not an applied edit.
- Use the authenticated directory PATCH endpoint with the `X-Liberture-Edit-Source: ai` header, or the shared `withDirectoryEdit` transaction for server-side jobs. Write the entry and its revision atomically. Bulk jobs must produce a separate revision for each changed entry.
