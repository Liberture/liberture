#!/bin/bash

# PostgreSQL Automated Backup to Hetzner Object Storage
# Runs daily via cron to backup Liberture database

set -e

# Configuration
DB_NAME="liberture"
DB_USER="liberture_user"
BACKUP_DIR="/tmp/liberture-backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="liberture_backup_$DATE.sql.gz"

# Hetzner S3 Configuration (from .env.local)
S3_ENDPOINT="https://nbg1.your-objectstorage.com"
S3_BUCKET="robert-claw"
S3_REGION="nbg1"
S3_ACCESS_KEY="***REMOVED_S3_ACCESS_KEY***"
S3_SECRET_KEY="***REMOVED_S3_SECRET_KEY***"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🗄️  Starting PostgreSQL backup for $DB_NAME..."

# Export password for pg_dump (avoid password prompt)
export PGPASSWORD="***REMOVED_DB_PASSWORD***"

# Create backup
pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "$BACKUP_DIR/$BACKUP_FILE"

echo "✅ Database backed up to $BACKUP_DIR/$BACKUP_FILE"

# Upload to Hetzner S3
echo "☁️  Uploading to Hetzner Object Storage..."

aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" \
  "s3://$S3_BUCKET/backups/liberture/$BACKUP_FILE" \
  --endpoint-url "$S3_ENDPOINT" \
  --region "$S3_REGION" \
  --no-verify-ssl

echo "✅ Backup uploaded to s3://$S3_BUCKET/backups/liberture/$BACKUP_FILE"

# Clean up local backup (keep only last 3 days locally)
find "$BACKUP_DIR" -name "liberture_backup_*.sql.gz" -mtime +3 -delete

echo "🧹 Cleaned up old local backups (kept last 3 days)"

# Clean up S3 backups (keep only last 30 days)
echo "🧹 Cleaning up old S3 backups (keeping last 30 days)..."

aws s3 ls "s3://$S3_BUCKET/backups/liberture/" \
  --endpoint-url "$S3_ENDPOINT" \
  --region "$S3_REGION" \
  --no-verify-ssl | \
  while read -r line; do
    createDate=$(echo "$line" | awk {'print $1" "$2'})
    createDate=$(date -d "$createDate" +%s)
    olderThan=$(date -d "30 days ago" +%s)
    if [[ $createDate -lt $olderThan ]]; then
      fileName=$(echo "$line" | awk {'print $4'})
      if [[ $fileName != "" ]]; then
        aws s3 rm "s3://$S3_BUCKET/backups/liberture/$fileName" \
          --endpoint-url "$S3_ENDPOINT" \
          --region "$S3_REGION" \
          --no-verify-ssl
        echo "  🗑️  Deleted old backup: $fileName"
      fi
    fi
  done

echo "✅ Backup completed successfully!"
echo "📊 Backup size: $(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)"

# Unset password
unset PGPASSWORD
