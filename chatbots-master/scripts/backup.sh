#!/bin/bash

# MongoDB Backup Script
# This script creates regular backups of MongoDB databases and uploads them to S3

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups"
BACKUP_FILE="$BACKUP_DIR/mongodb_backup_$TIMESTAMP.gz"
LOG_FILE="$BACKUP_DIR/backup_log.txt"
S3_PATH="s3://$S3_BUCKET/mongodb_backups/"

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Log function
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" >> $LOG_FILE
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1"
}

# Perform backup
backup_mongodb() {
  log "Starting MongoDB backup..."
  
  # Create backup
  mongodump --uri="$MONGODB_URI" --gzip --archive=$BACKUP_FILE
  
  if [ $? -eq 0 ]; then
    log "Backup completed successfully: $BACKUP_FILE"
    return 0
  else
    log "Backup failed!"
    return 1
  fi
}

# Upload to S3
upload_to_s3() {
  log "Uploading backup to S3..."
  
  # Configure AWS CLI
  export AWS_ACCESS_KEY_ID=$S3_ACCESS_KEY_ID
  export AWS_SECRET_ACCESS_KEY=$S3_SECRET_ACCESS_KEY
  export AWS_DEFAULT_REGION=$S3_REGION
  
  # Upload to S3
  aws s3 cp $BACKUP_FILE $S3_PATH
  
  if [ $? -eq 0 ]; then
    log "Upload to S3 completed successfully"
    return 0
  else
    log "Upload to S3 failed!"
    return 1
  fi
}

# Clean up old backups
cleanup_old_backups() {
  log "Cleaning up old backups..."
  
  # Keep only the 7 most recent backups locally
  ls -t $BACKUP_DIR/mongodb_backup_*.gz | tail -n +8 | xargs -r rm
  
  log "Cleanup completed"
}

# Main backup process
main() {
  log "=== Backup process started ==="
  
  # Perform backup
  backup_mongodb
  if [ $? -ne 0 ]; then
    log "Backup process failed. Exiting."
    return 1
  fi
  
  # Upload to S3
  upload_to_s3
  if [ $? -ne 0 ]; then
    log "Upload process failed. Keeping local backup."
  fi
  
  # Clean up old backups
  cleanup_old_backups
  
  log "=== Backup process completed ==="
}

# Run backup immediately, then schedule regular backups
main

# Schedule regular backups
while true; do
  sleep $BACKUP_FREQUENCY
  main
done
