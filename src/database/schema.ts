import { appSchema, tableSchema } from '@nozbe/watermelondb';

/**
 * WatermelonDB Schema for StayFit App
 * 
 * We're creating a local-first database for:
 * - Exercises (relatively static, synced once and cached forever until cleared)
 * - Exercise Focus Areas (linked to exercises)
 * - Exercise Tips (linked to exercises)
 * - Exercise Mistakes (linked to exercises)
 * - Workout Routines (system + user created)
 * - Routine Exercises (linking table)
 * - Workout Sessions (user's workout history - needs sync)
 * - Exercise Completions (individual exercise completions in a session)
 * 
 * The exercises data is mostly static and won't change often,
 * so we sync once and cache forever unless user clears cache.
 */

export const schema = appSchema({
  version: 1,
  tables: [
    // Exercises table - Core exercise data (relatively static)
    tableSchema({
      name: 'exercises',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true }, // UUID from Supabase
        { name: 'name', type: 'string' },
        { name: 'gif_url', type: 'string', isOptional: true },
        { name: 'image_url_male', type: 'string', isOptional: true },
        { name: 'image_url_female', type: 'string', isOptional: true },
        { name: 'exercise_type', type: 'string', isOptional: true },
        { name: 'avg_time_per_rep', type: 'number', isOptional: true },
        { name: 'instructions', type: 'string', isOptional: true },
        { name: 'place', type: 'string', isOptional: true },
        { name: 'equipments', type: 'string', isOptional: true }, // JSON array as string
        { name: 'is_per_side', type: 'boolean', isOptional: true },
        { name: 'requires_weight', type: 'boolean', isOptional: true },
        { name: 'weight_unit', type: 'string', isOptional: true },
        { name: 'recommended_weight_range', type: 'string', isOptional: true }, // JSON as string
        { name: 'synced_at', type: 'number' }, // Timestamp when synced
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Exercise Focus Areas - Muscle groups targeted by an exercise
    tableSchema({
      name: 'exercise_focus_areas',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true }, // Local WatermelonDB ID
        { name: 'server_exercise_id', type: 'string', isIndexed: true }, // Server UUID
        { name: 'area', type: 'string' },
        { name: 'weightage', type: 'number' },
        { name: 'synced_at', type: 'number' },
      ],
    }),

    // Exercise Mistakes - Common mistakes to avoid
    tableSchema({
      name: 'exercise_mistakes',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'server_exercise_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'subtitle', type: 'string', isOptional: true },
        { name: 'synced_at', type: 'number' },
      ],
    }),

    // Exercise Tips - Tips for performing the exercise
    tableSchema({
      name: 'exercise_tips',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'server_exercise_id', type: 'string', isIndexed: true },
        { name: 'tip', type: 'string' },
        { name: 'synced_at', type: 'number' },
      ],
    }),

    // Workout Routines - Pre-defined and custom workout routines
    tableSchema({
      name: 'workout_routines',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'image_url_male', type: 'string', isOptional: true },
        { name: 'image_url_female', type: 'string', isOptional: true },
        { name: 'level', type: 'string', isOptional: true }, // Keep for compatibility
        { name: 'difficulty_level', type: 'string', isOptional: true }, // New field
        { name: 'category', type: 'string', isOptional: true },
        { name: 'place', type: 'string', isOptional: true },
        { name: 'estimated_duration', type: 'number', isOptional: true },
        { name: 'created_by', type: 'string', isOptional: true }, // user_id if custom
        { name: 'is_system', type: 'boolean', isOptional: true }, // true for pre-defined routines
        { name: 'synced_at', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Challenges - Multi-day workout programs
    tableSchema({
      name: 'challenges',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'duration_days', type: 'number' },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'image_url_male', type: 'string', isOptional: true },
        { name: 'image_url_female', type: 'string', isOptional: true },
        { name: 'gender', type: 'string', isOptional: true }, // JSON array of strings
        { name: 'synced_at', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Challenge Days - Daily schedule for a challenge
    tableSchema({
      name: 'challenge_days',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'challenge_id', type: 'string', isIndexed: true }, // Local ID
        { name: 'server_challenge_id', type: 'string', isIndexed: true },
        { name: 'day_number', type: 'number' },
        { name: 'routine_id', type: 'string', isIndexed: true, isOptional: true }, // Local ID
        { name: 'server_routine_id', type: 'string', isIndexed: true, isOptional: true },
        { name: 'is_rest_day', type: 'boolean' },
        { name: 'instructions', type: 'string', isOptional: true },
        { name: 'synced_at', type: 'number' },
      ],
    }),

    // User Challenges - User participation in a challenge
    tableSchema({
      name: 'user_challenges',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true }, // Auth user ID (from profile)
        { name: 'challenge_id', type: 'string', isIndexed: true }, // Local ID
        { name: 'server_challenge_id', type: 'string', isIndexed: true },
        { name: 'start_date', type: 'string' }, // ISO Date string
        { name: 'status', type: 'string' },
        { name: 'preferred_workout_days', type: 'string', isOptional: true }, // JSON string of days
        { name: 'current_day_index', type: 'number' },
        { name: 'synced_at', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // User Challenge Logs - Progress tracking for challenges
    tableSchema({
      name: 'user_challenge_logs',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'user_challenge_id', type: 'string', isIndexed: true }, // Local ID
        { name: 'server_user_challenge_id', type: 'string', isIndexed: true },
        { name: 'day_number', type: 'number' },
        { name: 'completed_at', type: 'number' },
        { name: 'type', type: 'string' }, // 'workout' or 'rest'
        { name: 'synced_at', type: 'number' },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // Routine Exercises - Links exercises to routines with order and parameters
    tableSchema({
      name: 'routine_exercises',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'routine_id', type: 'string', isIndexed: true }, // Local ID
        { name: 'server_routine_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true }, // Local ID
        { name: 'server_exercise_id', type: 'string', isIndexed: true },
        { name: 'reps', type: 'number', isOptional: true },
        { name: 'duration', type: 'number', isOptional: true },
        { name: 'sets', type: 'number', isOptional: true },
        { name: 'order_position', type: 'number' },
        { name: 'synced_at', type: 'number' },
      ],
    }),

    // Pending Sync Queue - For operations that need to sync to server
    tableSchema({
      name: 'pending_sync',
      columns: [
        { name: 'operation_type', type: 'string' }, // 'workout_session', 'profile_update', etc.
        { name: 'payload', type: 'string' }, // JSON payload
        { name: 'created_at', type: 'number' },
        { name: 'retry_count', type: 'number' },
        { name: 'last_error', type: 'string', isOptional: true },
      ],
    }),

    // Sync Metadata - Track last sync times for each table
    tableSchema({
      name: 'sync_metadata',
      columns: [
        { name: 'table_name', type: 'string', isIndexed: true },
        { name: 'last_sync_at', type: 'number' },
        { name: 'sync_status', type: 'string' }, // 'idle', 'syncing', 'error'
        { name: 'error_message', type: 'string', isOptional: true },
      ],
    }),
  ],
});

export default schema;


