# Production operations

Pushes to `master` deploy the app to `/var/www/liberture` and restart the `liberture` process in PM2. The app connects to local PostgreSQL. The deployment workflow builds the host’s `.env` from the GitHub Actions secret `ENV_PRODUCTION`. When rotating the database password, update the PostgreSQL role, the deployed `DATABASE_URL`, and the Actions secret together. See the [deployment workflow](.github/workflows/deploy.yml).

## Database backups

On the production host, `liberture-backup.timer` runs at 02:00 UTC daily and catches up after downtime. The service reads the deployed database connection and uploads a PostgreSQL custom-format dump to the private Hetzner bucket `liberture` in Nuremberg under `backups/liberture/`. A bucket lifecycle rule expires that prefix after 30 days. The host manages the timer independently of application deployments.

The systemd units live in `/etc/systemd/system/`. The backup and restore scripts live in `/etc/liberture-backup/`. Their root-only `storage.env` holds the dedicated S3 credential, managed under **Hetzner Console → Default → Security → S3 credentials**. Hetzner grants this key project-wide bucket access.

| Task on the production host | Command |
|---|---|
| Check the next backup | `systemctl list-timers liberture-backup.timer` |
| Run a backup now | `sudo systemctl start liberture-backup.service` |
| Test the latest uploaded backup | `sudo systemctl start liberture-restore-check.service` |
| Read the results | `sudo journalctl -u liberture-backup.service -u liberture-restore-check.service -n 20` |

The restore check downloads the latest dump, verifies its SHA-256 checksum, and restores it into a temporary PostgreSQL cluster accessible only through a private Unix socket. It checks the restored table count against the archive, queries restored data, and removes the test cluster.
