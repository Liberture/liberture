# Agent Guidelines

- Ensure all user-facing text is sourced from the translations file so new strings can be localized.
- When adding new UI copy, update `lib/translations.ts` first and reference those entries in components.

## Component reuse and clean code

- Before building or changing UI, find the component used for the same interaction elsewhere in Liberture. Reuse it across public and signed-in pages. If behavior differs, extend its props or compose existing components before introducing a separate implementation.
- Keep components focused, props explicit, and data shaping outside presentation code where practical. When a new component is necessary, extract shared behavior once and keep existing callers working.
