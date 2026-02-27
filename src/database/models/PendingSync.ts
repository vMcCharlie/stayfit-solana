import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

/**
 * PendingSync Model
 * Queue for operations that need to sync to server when online
 * Examples: workout completions, profile updates, etc.
 */
export default class PendingSync extends Model {
  static table = 'pending_sync';

  @field('operation_type') operationType!: string;
  @field('payload') payloadJson!: string;
  @readonly @date('created_at') createdAt!: Date;
  @field('retry_count') retryCount!: number;
  @field('last_error') lastError?: string;

  // Parse the JSON payload
  get payload(): any {
    try {
      return JSON.parse(this.payloadJson);
    } catch {
      return null;
    }
  }
}


