import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

/**
 * ExerciseMistake Model
 * Common mistakes to avoid when performing an exercise
 */
export default class ExerciseMistake extends Model {
  static table = 'exercise_mistakes';

  static associations = {
    exercises: { type: 'belongs_to' as const, key: 'exercise_id' },
  };

  @field('server_id') serverId!: string;
  @field('exercise_id') exerciseId!: string;
  @field('server_exercise_id') serverExerciseId!: string;
  @field('title') title!: string;
  @field('subtitle') subtitle?: string;
  @field('synced_at') syncedAt!: number;

  @relation('exercises', 'exercise_id') exercise: any;

  // Formatted display string
  get displayText(): string {
    if (this.subtitle) {
      return `${this.title} - ${this.subtitle}`;
    }
    return this.title;
  }
}


