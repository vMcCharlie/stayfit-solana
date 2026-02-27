import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

/**
 * ExerciseTip Model
 * Tips for performing an exercise correctly
 */
export default class ExerciseTip extends Model {
  static table = 'exercise_tips';

  static associations = {
    exercises: { type: 'belongs_to' as const, key: 'exercise_id' },
  };

  @field('server_id') serverId!: string;
  @field('exercise_id') exerciseId!: string;
  @field('server_exercise_id') serverExerciseId!: string;
  @field('tip') tip!: string;
  @field('synced_at') syncedAt!: number;

  @relation('exercises', 'exercise_id') exercise: any;
}


