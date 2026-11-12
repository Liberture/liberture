# Production operations

GitHub Actions tests and builds each push to `master`. A restricted SSH key lets `liberture-deploy` install a release under `/srv/liberture/releases`, prepare the app database, and restart only the Liberture service. The deploy switches the `current` symlink and checks a database-backed endpoint. If that check fails, it reactivates the previous release. Database schema changes persist across a code rollback. See the [workflow](.github/workflows/deploy.yml) and [host commands and units](ops/).

The web service runs as `liberture` on loopback behind the reverse proxy. Systemd loads the database URL, mail key and stable Web Push keys from the root-only `/etc/liberture/app.env`. Update runtime secrets there and restart `liberture.service`. CI uses a dedicated deployment key and a pinned SSH host key.

## Third-party services

| Service | Use and configuration |
|---|---|
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
