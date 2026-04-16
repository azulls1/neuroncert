#!/bin/bash
# Supabase data backup script
# Run via cron: 0 2 * * * /path/to/backup-supabase.sh

set -euo pipefail

SUPABASE_URL="${SUPABASE_URL:-https://iagenteksupabase.iagentek.com.mx}"
SERVICE_KEY="${SUPABASE_SERVICE_KEY}"
BACKUP_DIR="./backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

for table in iagentek_simuexamen_exam_results iagentek_simuexamen_progress iagentek_simuexamen_study_sessions; do
  echo "Backing up $table..."
  curl -s "$SUPABASE_URL/rest/v1/$table?select=*" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    > "$BACKUP_DIR/$table.json"
  echo "  -> $(wc -l < "$BACKUP_DIR/$table.json") bytes"
done

echo "Backup complete: $BACKUP_DIR"
