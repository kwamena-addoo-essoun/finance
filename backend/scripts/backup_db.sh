#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# backup_db.sh — PostgreSQL database backup script for Finsight
#
# Usage:
#   ./backup_db.sh                     # one-off backup to ./backups/
#   BACKUP_DIR=/mnt/backups ./backup_db.sh
#
# Reads connection details from environment variables (or .env if not set).
# Add to cron for scheduled backups:
#   0 2 * * *  /app/scripts/backup_db.sh >> /var/log/finsight-backup.log 2>&1
# ---------------------------------------------------------------------------
set -euo pipefail

# Load .env if present and vars are not already exported
if [[ -f "$(dirname "$0")/../.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$(dirname "$0")/../.env"
  set +a
fi

PGHOST="${POSTGRES_HOST:-db}"
PGPORT="${POSTGRES_PORT:-5432}"
PGUSER="${POSTGRES_USER:?POSTGRES_USER not set}"
PGPASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD not set}"
PGDB="${POSTGRES_DB:?POSTGRES_DB not set}"

BACKUP_DIR="${BACKUP_DIR:-$(dirname "$0")/../backups}"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/${PGDB}_${TIMESTAMP}.sql.gz"

echo "[$(date -Iseconds)] Starting backup of $PGDB to $FILENAME"

PGPASSWORD="$PGPASSWORD" pg_dump \
  -h "$PGHOST" \
  -p "$PGPORT" \
  -U "$PGUSER" \
  -d "$PGDB" \
  --no-password \
  | gzip -9 > "$FILENAME"

echo "[$(date -Iseconds)] Backup complete: $FILENAME ($(du -sh "$FILENAME" | cut -f1))"

# --- Optional: prune backups older than 30 days ---
KEEP_DAYS="${BACKUP_KEEP_DAYS:-30}"
find "$BACKUP_DIR" -name "${PGDB}_*.sql.gz" -mtime +"$KEEP_DAYS" -delete
echo "[$(date -Iseconds)] Pruned backups older than ${KEEP_DAYS} days"
