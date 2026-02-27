import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';

/**
 * WorkoutRoutine Model
 * Represents a workout routine (system-defined or user-created)
 */
export default class WorkoutRoutine extends Model {
  static table = 'workout_routines';

  static associations = {
    routine_exercises: { type: 'has_many' as const, foreignKey: 'routine_id' },
  };

  @field('server_id') serverId!: string;
  @field('name') name!: string;
  @field('description') description?: string;
  @field('image_url') imageUrl?: string;
  @field('image_url_male') imageUrlMale?: string;
  @field('image_url_female') imageUrlFemale?: string;
  @field('level') level?: string; // Keep for compatibility
  @field('difficulty_level') difficultyLevel?: string; // New field
  @field('category') category?: string;
  @field('place') place?: string;
  @field('estimated_duration') estimatedDuration?: number;
  @field('created_by') createdBy?: string;
  @field('is_system') isSystem!: boolean;
  @field('synced_at') syncedAt!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('routine_exercises') routineExercises: any;

  // Get the cover image based on gender preference
  getCoverImage(gender: 'male' | 'female' = 'male'): string | undefined {
    if (gender === 'female' && this.imageUrlFemale) {
      return this.imageUrlFemale;
    }
    if (gender === 'male' && this.imageUrlMale) {
      return this.imageUrlMale;
    }
    return this.imageUrl || this.imageUrlMale || this.imageUrlFemale;
  }
}


