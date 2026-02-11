#!/bin/bash
# Automated PostgreSQL backup for Liberture
# Run this daily via cron: 0 2 * * * /root/liberture/scripts/backup-database.sh

set -e

# Configuration
DB_NAME="liberture"
DB_USER="liberture_user"
BACKUP_DIR="/root/liberture/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/liberture_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $(date)"

# Perform backup
PGPASSWORD="$DATABASE_PASSWORD" pg_dump \
  -h localhost \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-acl \
  | gzip > "$BACKUP_FILE"

# Check if backup was successful
if [ -f "$BACKUP_FILE" ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✅ Backup completed: $BACKUP_FILE ($SIZE)"
  
  # Delete old backups (keep only last N days)
  find "$BACKUP_DIR" -name "liberture_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
  echo "🗑️  Cleaned up backups older than $RETENTION_DAYS days"
  
  # Optional: Upload to Hetzner Object Storage
  if [ -n "$HETZNER_S3_ENDPOINT" ] && command -v aws &> /dev/null; then
    aws s3 cp "$BACKUP_FILE" \
      "s3://robert-claw/backups/liberture/" \
      --endpoint-url "$HETZNER_S3_ENDPOINT"
    echo "☁️  Uploaded to Hetzner Object Storage"
  fi
else
  echo "❌ Backup failed!"
  exit 1
fi

echo "Backup completed at $(date)"
