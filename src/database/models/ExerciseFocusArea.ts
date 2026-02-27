import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

/**
 * ExerciseFocusArea Model
 * Links an exercise to a muscle group/focus area with a weightage
 */
export default class ExerciseFocusArea extends Model {
  static table = 'exercise_focus_areas';

  static associations = {
    exercises: { type: 'belongs_to' as const, key: 'exercise_id' },
  };

  @field('server_id') serverId!: string;
  @field('exercise_id') exerciseId!: string;
  @field('server_exercise_id') serverExerciseId!: string;
  @field('area') area!: string;
  @field('weightage') weightage!: number;
  @field('synced_at') syncedAt!: number;

  @relation('exercises', 'exercise_id') exercise: any;

  // Calculated intensity (0-1 scale)
  get intensity(): number {
    return this.weightage / 100;
  }
}


