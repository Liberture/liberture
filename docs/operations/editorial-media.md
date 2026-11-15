# Editorial media

Article and protocol covers (`imageUrl`) and sharing previews (`previewImageUrl`) are database fields. Spanish variants live in `localized.es`. Article pages, cards, JSON-LD, Open Graph, Twitter cards and the image sitemap read these fields. The static tracker catalog resolves its image through a cached redirect to the current protocol record; legacy PNG/WebP protocol links use the same resolver. Covers and previews are served directly by Hetzner, without application-server image resizing.

In Admin → Directory, select the article/protocol, choose the editing language, open Links and upload or paste the cover and social preview. Uploading prepares a file; Save applies it to the record with normal edit history. Existing book, person and organization image fields share the upload control. Preview uploads become 1200×630 JPEGs; covers become WebP up to 1600 pixels wide. Both preserve aspect ratio. PNG, JPEG and WebP input is decoded, stripped of metadata and re-encoded; uploads require administrator authentication and are limited to 10 MiB and 40 megapixels.

Files use content hashes and immutable cache headers. Replacing an image creates a new URL; do not overwrite an existing object. Old objects remain available for old shares and rollbacks. Social networks may still need their own preview refresh for a previously shared page. Protocol redirect caches expire after 60 seconds.

## Storage configuration

The dedicated public bucket is `liberture-media` in `nbg1`. Only `images/*` is publicly readable; database backups remain in the separate private `liberture` bucket. Configure the `MEDIA_*` variables documented in `.env.example`. The `MEDIA_*` variables have been prepared in `/etc/liberture/app.env` for the next authorized release; the current service has not been restarted. It currently uses the existing operator S3 credential; that credential is also used by the backup job. Rotate to a dedicated media credential/project when available. Never expose these values in browser code or commit them.

## Release preparation

The normal prepare service runs Prisma `db push` and `seed-marketplace-protocols.ts`. The seed now creates missing protocols without replacing existing administrator edits, then applies `prepare-editorial-media.ts`. That runs the media URL backfill once using the `EditorialMigration` ledger and imports the bilingual Royal Flush records atomically. Repeated imports preserve existing entries; a partial publication fails for operator review. The release archive includes the reviewed editorial payload. AI updates use the directory edit context, so installed revision triggers retain per-entry changes.

The initial upload contains existing article and protocol assets and localized Royal Flush covers, previews and editable SVG sources. Original files remain in Git for source editing and compatibility. The reviewed Royal Flush source and import data are under `content/editorial/royal-flush/`. Its `media.json` records the uploaded editable SVGs and rendered variants. UI icons, logos, screenshots and other application assets remain application assets, not editorial database records.

Royal Flush uses the shared icon artwork generator for its 1200×420 article cover and 1200×320 protocol reader cover. Regenerate with `pnpm exec tsx scripts/generate-protocol-images.tsx --royal-flush`. The detailed 1200×630 artwork remains the social preview. The text-free covers are shared by English and Spanish; localized previews retain their separate URLs. The live cover correction was applied through `withDirectoryEdit` as `royal-flush-cover-correction` on 2026-11-15.
