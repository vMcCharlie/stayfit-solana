import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

/**
 * RoutineExercise Model
 * Links an exercise to a routine with specific parameters
 */
export default class RoutineExercise extends Model {
  static table = 'routine_exercises';

  static associations = {
    workout_routines: { type: 'belongs_to' as const, key: 'routine_id' },
    exercises: { type: 'belongs_to' as const, key: 'exercise_id' },
  };

  @field('server_id') serverId!: string;
  @field('routine_id') routineId!: string;
  @field('server_routine_id') serverRoutineId!: string;
  @field('exercise_id') exerciseId!: string;
  @field('server_exercise_id') serverExerciseId!: string;
  @field('reps') reps?: number;
  @field('duration') duration?: number;
  @field('sets') sets?: number;
  @field('order_position') orderPosition!: number;
  @field('synced_at') syncedAt!: number;

  @relation('workout_routines', 'routine_id') routine: any;
  @relation('exercises', 'exercise_id') exercise: any;

  // Format duration as MM:SS string
  get formattedDuration(): string | undefined {
    if (!this.duration) return undefined;
    const mins = Math.floor(this.duration / 60);
    const secs = this.duration % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}


