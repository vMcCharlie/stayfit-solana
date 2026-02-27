import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

/**
 * SyncMetadata Model
 * Tracks sync status for each table
 */
export default class SyncMetadata extends Model {
  static table = 'sync_metadata';

  @field('table_name') tableName!: string;
  @field('last_sync_at') lastSyncAt!: number;
  @field('sync_status') syncStatus!: 'idle' | 'syncing' | 'error';
  @field('error_message') errorMessage?: string;

  // Check if data is stale (older than specified hours)
  isStale(hours: number = 24): boolean {
    const staleThreshold = Date.now() - (hours * 60 * 60 * 1000);
    return this.lastSyncAt < staleThreshold;
  }
}


