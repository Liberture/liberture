# Production operations

GitHub Actions tests and builds each push to `master`. A restricted SSH key lets `liberture-deploy` install a release under `/srv/liberture/releases`, prepare the app database, and restart only the Liberture service. The deploy switches the `current` symlink and checks a database-backed endpoint. If that check fails, it reactivates the previous release. Database schema changes persist across a code rollback. See the [workflow](.github/workflows/deploy.yml) and [host commands and units](ops/).

The web service runs as `liberture` on loopback behind the reverse proxy. Systemd loads the database URL, mail key and stable Web Push keys from the root-only `/etc/liberture/app.env`. Update runtime secrets there and restart `liberture.service`. CI uses a dedicated deployment key and a pinned SSH host key.

## Sign-in and user administration

Nostr proves control of the signing key. With managed authentication enabled, Better Auth owns the web sessions and roles used by [/admin/users](https://liberture.com/admin/users). Each imported identity uses the original tracker ID, so habits, history and assistant connections keep their existing owner. Imported identities use internal addresses ending in `@accounts.invalid`. The newsletter list is separate.

Deploy the release with managed authentication disabled first. For cutover, stop `liberture.service`, take a fresh database backup, set `BETTER_AUTH_URL` to the public origin and a stable randomly generated `BETTER_AUTH_SECRET` of at least 32 characters in `/etc/liberture/app.env`, then run the migration under the application account with its normal environment:

```sh
sudo systemd-run --wait --collect --pipe --uid=liberture --gid=liberture \
  -p WorkingDirectory=/srv/liberture/current -p EnvironmentFile=/etc/liberture/app.env \
  /usr/bin/node node_modules/tsx/dist/cli.mjs scripts/migrate-managed-auth.mjs
```

After a successful migration, set `LIBERTURE_MANAGED_AUTH=true`, start the service and check an existing login and the user list. The transaction imports active legacy sessions with their original expiration, consumes their old records, and preserves assigned roles on reruns. The configured Nostr admin keys supply the initial role for new identities.

If the migration fails, the transaction rolls back and the legacy service can restart. After cutover, use a managed-auth-compatible release for code rollback so bans and revocations stay enforced. Returning to legacy authentication requires restoring the pre-cutover database while access is paused. Reconcile any subsequent tracker writes before restoring.

## Third-party services

| Service | Use and configuration |
|---|---|
| Google reCAPTCHA | The public newsletter loads invisible reCAPTCHA v2 when the signup section enters view and verifies on submission. Register a key pair for Invisible reCAPTCHA v2. Configure `RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`, and `RECAPTCHA_HOSTNAMES` in the web service environment. Subscribers are searchable under `/admin/subscribers`. |
| Resend | The [mail helpers](lib/resend.ts) send from `hello@liberture.com`. The production service reads `RESEND_API_KEY` from its runtime environment. Manage the sending-only key for `liberture.com` in the Liberture Resend account. |
| Google Books | The [Goodreads enrichment script](scripts/goodreads-scraper/step3-enrich-and-normalize.ts) reads `GOOGLE_BOOKS_API_KEY` from the environment where the scraper runs. Its Google Cloud key is restricted to the Books API. |
| Web Push | Browser reminders use stable VAPID keys from the web service’s runtime environment. See [Push reminders](docs/REMINDERS.md). |
| Hetzner Object Storage | The backup service stores PostgreSQL dumps in a private bucket. The schedule, retention and restore procedure are below. |

## Database backups

On the production host, `liberture-backup.timer` runs at 02:00 UTC daily and catches up after downtime. The service runs as `liberture_backup`, uses PostgreSQL peer authentication with read access to the app tables, and uploads a PostgreSQL custom-format dump to the private Hetzner bucket `liberture` in Nuremberg under `backups/liberture/`. A bucket lifecycle rule expires that prefix after 30 days. The host manages the timer independently of application deployments.

The systemd units live in `/etc/systemd/system/`. The scripts live in `/usr/local/libexec/liberture-backup/`. The root-only `/etc/liberture-backup/storage.env` holds the dedicated S3 credential, managed under **Hetzner Console → Default → Security → S3 credentials**. Hetzner grants this key project-wide bucket access.

| Task on the production host | Command |
|---|---|
| Check the next backup | `systemctl list-timers liberture-backup.timer` |
| Run a backup now | `sudo systemctl start liberture-backup.service` |
| Test the latest uploaded backup | `sudo systemctl start liberture-restore-check.service` |
| Read the results | `sudo journalctl -u liberture-backup.service -u liberture-restore-check.service -n 20` |

The restore check downloads the latest dump, verifies its SHA-256 checksum, and restores it into a temporary PostgreSQL cluster accessible only through a private Unix socket. It checks the restored table count against the archive, queries restored data, and removes the test cluster.
