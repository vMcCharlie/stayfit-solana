import { Q } from '@nozbe/watermelondb';
import {
  getDatabase,
  isWatermelonDBAvailable,
  getExercisesCollection,
  getExerciseFocusAreasCollection,
  getExerciseMistakesCollection,
  getExerciseTipsCollection,
  getWorkoutRoutinesCollection,
  getRoutineExercisesCollection,
  getSyncMetadataCollection,
} from './index';
import { supabase } from '../lib/supabase';
import type Exercise from './models/Exercise';
import type ExerciseFocusArea from './models/ExerciseFocusArea';
import type ExerciseMistake from './models/ExerciseMistake';
import type ExerciseTip from './models/ExerciseTip';
import type WorkoutRoutine from './models/WorkoutRoutine';
import type RoutineExercise from './models/RoutineExercise';
import type SyncMetadata from './models/SyncMetadata';


/**
 * Sync Service for WatermelonDB
 * 
 * Strategy:
 * - Exercises are synced once and cached forever (until user clears cache)
 * - Only fetch exercises that don't exist locally
 * - Routines are synced based on user preferences and system updates
 * - User workout data syncs bidirectionally
 * 
 * NOTE: All functions gracefully handle the case when WatermelonDB is not available
 * (e.g., when running in Expo Go instead of a dev build)
 */

// Map to track server_id -> local_id for exercises
const exerciseIdMap = new Map<string, string>();
const routineIdMap = new Map<string, string>();




/**
 * Get or create sync metadata for a table
 */
async function getSyncMetadataRecord(tableName: string): Promise<SyncMetadata | null> {
  if (!isWatermelonDBAvailable()) return null;

  const collection = getSyncMetadataCollection();
  if (!collection) return null;

  try {
    const metadata = await collection
      .query(Q.where('table_name', tableName))
      .fetch();
    return (metadata[0] as unknown as SyncMetadata) || null;
  } catch (error) {
    console.error(`[Sync] Error getting metadata for ${tableName}:`, error);
    return null;
  }
}

/**
 * Update sync metadata for a table
 */
async function updateSyncMetadata(
  tableName: string,
  status: 'idle' | 'syncing' | 'error',
  errorMessage?: string
): Promise<void> {
  if (!isWatermelonDBAvailable()) return;

  const database = getDatabase();
  const collection = getSyncMetadataCollection();
  if (!database || !collection) return;

  await database.write(async () => {
    const existing = await collection
      .query(Q.where('table_name', tableName))
      .fetch();

    if (existing.length > 0) {
      await (existing[0] as unknown as SyncMetadata).update((m: any) => {
        m.lastSyncAt = Date.now();
        m.syncStatus = status;
        m.errorMessage = errorMessage || null;
      });
    } else {
      await collection.create((m: any) => {
        m.tableName = tableName;
        m.lastSyncAt = Date.now();
        m.syncStatus = status;
        m.errorMessage = errorMessage || null;
      });
    }
  });
}

/**
 * Get local exercise by server ID
 */
export async function getExerciseByServerId(serverId: string): Promise<Exercise | null> {
  if (!isWatermelonDBAvailable()) return null;

  const collection = getExercisesCollection();
  if (!collection) return null;

  try {
    const exercises = await collection
      .query(Q.where('server_id', serverId))
      .fetch();
    return exercises[0] as Exercise || null;
  } catch (error) {
    console.error('[Sync] Error getting exercise by server ID:', error);
    return null;
  }
}

/**
 * Get local routine by server ID
 */
export async function getRoutineByServerId(serverId: string): Promise<WorkoutRoutine | null> {
  if (!isWatermelonDBAvailable()) return null;

  const collection = getWorkoutRoutinesCollection();
  if (!collection) return null;

  try {
    const routines = await collection
      .query(Q.where('server_id', serverId))
      .fetch();
    return routines[0] as WorkoutRoutine || null;
  } catch (error) {
    console.error('[Sync] Error getting routine by server ID:', error);
    return null;
  }
}

/**
 * Sync a single exercise with all its related data
 * Only creates if it doesn't exist locally (exercises are static)
 */
export async function syncExercise(serverExercise: any, preparations?: any[]): Promise<string | null> {
  if (!isWatermelonDBAvailable()) return null;

  const database = getDatabase();
  const exercisesCollection = getExercisesCollection();
  const focusAreasCollection = getExerciseFocusAreasCollection();
  const mistakesCollection = getExerciseMistakesCollection();
  const tipsCollection = getExerciseTipsCollection();

  if (!database || !exercisesCollection || !focusAreasCollection || !mistakesCollection || !tipsCollection) {
    return null;
  }

  // Check cache first
  if (exerciseIdMap.has(serverExercise.id)) {
    return exerciseIdMap.get(serverExercise.id)!;
  }

  // Check if already exists locally
  const existingExercise = await getExerciseByServerId(serverExercise.id);
  if (existingExercise) {
    exerciseIdMap.set(serverExercise.id, existingExercise.id);
    return existingExercise.id;
  }

  const now = Date.now();

  const createLogic = (exercise: any) => {
    exercise.serverId = serverExercise.id;
    exercise.name = serverExercise.name || '';
    exercise.gifUrl = serverExercise.gif_url || null;
    exercise.imageUrlMale = serverExercise.image_url_male || null;
    exercise.imageUrlFemale = serverExercise.image_url_female || null;
    exercise.exerciseType = serverExercise.exercise_type || null;
    exercise.avgTimePerRep = serverExercise.avg_time_per_rep || null;
    exercise.instructions = serverExercise.instructions || null;
    exercise.place = serverExercise.place || null;
    exercise.equipmentsJson = serverExercise.equipments
      ? JSON.stringify(serverExercise.equipments)
      : null;
    exercise.isPerSide = serverExercise.is_per_side || false;
    exercise.requiresWeight = serverExercise.requires_weight || false;
    exercise.weightUnit = serverExercise.weight_unit || null;
    exercise.recommendedWeightRangeJson = serverExercise.recommended_weight_range
      ? JSON.stringify(serverExercise.recommended_weight_range)
      : null;
    exercise.syncedAt = now;
  };

  if (preparations) {
    const newExercise = exercisesCollection.prepareCreate(createLogic);
    preparations.push(newExercise);
    exerciseIdMap.set(serverExercise.id, newExercise.id);

    // Prepare focus areas
    if (serverExercise.exercise_focus_areas?.length > 0) {
      for (const area of serverExercise.exercise_focus_areas) {
        preparations.push(focusAreasCollection.prepareCreate((fa: any) => {
          fa.serverId = area.id;
          fa.exerciseId = newExercise.id;
          fa.serverExerciseId = serverExercise.id;
          fa.area = area.area;
          fa.weightage = area.weightage || 0;
          fa.syncedAt = now;
        }));
      }
    }

    // Prepare mistakes
    if (serverExercise.exercise_mistakes?.length > 0) {
      for (const mistake of serverExercise.exercise_mistakes) {
        preparations.push(mistakesCollection.prepareCreate((m: any) => {
          m.serverId = mistake.id;
          m.exerciseId = newExercise.id;
          m.serverExerciseId = serverExercise.id;
          m.title = mistake.title;
          m.subtitle = mistake.subtitle || null;
          m.syncedAt = now;
        }));
      }
    }

    // Prepare tips
    if (serverExercise.exercise_tips?.length > 0) {
      for (const tip of serverExercise.exercise_tips) {
        preparations.push(tipsCollection.prepareCreate((t: any) => {
          t.serverId = tip.id;
          t.exerciseId = newExercise.id;
          t.serverExerciseId = serverExercise.id;
          t.tip = tip.tip;
          t.syncedAt = now;
        }));
      }
    }

    return newExercise.id;
  }

  // Create new exercise locally (Original non-batch path)
  let localExerciseId = '';

  await database.write(async () => {
    // Create exercise
    const newExercise = await exercisesCollection.create(createLogic);
    localExerciseId = newExercise.id;

    // Create focus areas
    if (serverExercise.exercise_focus_areas?.length > 0) {
      for (const area of serverExercise.exercise_focus_areas) {
        await focusAreasCollection.create((fa: any) => {
          fa.serverId = area.id;
          fa.exerciseId = localExerciseId;
          fa.serverExerciseId = serverExercise.id;
          fa.area = area.area;
          fa.weightage = area.weightage || 0;
          fa.syncedAt = now;
        });
      }
    }

    // Create mistakes
    if (serverExercise.exercise_mistakes?.length > 0) {
      for (const mistake of serverExercise.exercise_mistakes) {
        await mistakesCollection.create((m: any) => {
          m.serverId = mistake.id;
          m.exerciseId = localExerciseId;
          m.serverExerciseId = serverExercise.id;
          m.title = mistake.title;
          m.subtitle = mistake.subtitle || null;
          m.syncedAt = now;
        });
      }
    }

    // Create tips
    if (serverExercise.exercise_tips?.length > 0) {
      for (const tip of serverExercise.exercise_tips) {
        await tipsCollection.create((t: any) => {
          t.serverId = tip.id;
          t.exerciseId = localExerciseId;
          t.serverExerciseId = serverExercise.id;
          t.tip = tip.tip;
          t.syncedAt = now;
        });
      }
    }
  });

  // Cache the mapping
  exerciseIdMap.set(serverExercise.id, localExerciseId);

  console.log(`[Sync] Created exercise: ${serverExercise.name} (${localExerciseId})`);
  return localExerciseId;
}

/**
 * Sync a workout routine with all its exercises
 */
export async function syncRoutine(serverRoutine: any, preparations?: any[]): Promise<string | null> {
  if (!isWatermelonDBAvailable()) return null;

  const database = getDatabase();
  const routinesCollection = getWorkoutRoutinesCollection();
  if (!database || !routinesCollection) return null;

  // Check cache first
  if (routineIdMap.has(serverRoutine.id)) {
    return routineIdMap.get(serverRoutine.id)!;
  }

  // Check if already exists locally
  const existingRoutine = await getRoutineByServerId(serverRoutine.id);
  if (existingRoutine) {
    routineIdMap.set(serverRoutine.id, existingRoutine.id);
    return existingRoutine.id;
  }

  const now = Date.now();
  const createLogic = (routine: any) => {
    routine.serverId = serverRoutine.id;
    routine.name = serverRoutine.name;
    routine.imageUrl = serverRoutine.image_url || null;
    routine.imageUrlMale = serverRoutine.image_url_male || null;
    routine.imageUrlFemale = serverRoutine.image_url_female || null;
    routine.level = serverRoutine.level || null;
    routine.category = serverRoutine.category || null;
    routine.place = serverRoutine.place || null;
    routine.createdBy = serverRoutine.created_by || null;
    routine.isSystem = serverRoutine.is_system ?? true;
    routine.syncedAt = now;
  };

  if (preparations) {
    const newRoutine = routinesCollection.prepareCreate(createLogic);
    preparations.push(newRoutine);
    routineIdMap.set(serverRoutine.id, newRoutine.id);
    return newRoutine.id;
  }

  let localRoutineId = '';

  await database.write(async () => {
    // Create routine
    const newRoutine = await routinesCollection.create(createLogic);
    localRoutineId = newRoutine.id;
  });

  // Cache the mapping
  routineIdMap.set(serverRoutine.id, localRoutineId);

  console.log(`[Sync] Created routine: ${serverRoutine.name} (${localRoutineId})`);
  return localRoutineId;
}

/**
 * Sync routine exercises (the linking between routines and exercises)
 */
export async function syncRoutineExercises(
  serverRoutineId: string,
  localRoutineId: string,
  routineExercises: any[]
): Promise<void> {
  if (!isWatermelonDBAvailable()) return;

  const database = getDatabase();
  const routineExercisesCollection = getRoutineExercisesCollection();
  if (!database || !routineExercisesCollection) return;

  await database.write(async () => {
    const now = Date.now();

    for (const re of routineExercises) {
      // Get or sync the exercise first
      const exercise = re.exercises || re.exercise;
      if (!exercise?.id) {
        console.warn('[Sync] Routine exercise missing exercise data:', re);
        continue;
      }

      // Sync the exercise (will return existing ID if already synced)
      const localExerciseId = await syncExercise(exercise);
      if (!localExerciseId) continue;

      // Check if this routine exercise already exists
      const existing = await routineExercisesCollection
        .query(Q.where('server_id', re.id))
        .fetchCount();

      if (existing > 0) continue;

      // Create routine exercise link
      await routineExercisesCollection.create((link: any) => {
        link.serverId = re.id;
        link.routineId = localRoutineId;
        link.serverRoutineId = serverRoutineId;
        link.exerciseId = localExerciseId;
        link.serverExerciseId = exercise.id;
        link.reps = re.reps || null;
        link.duration = re.duration || null;
        link.sets = re.sets || 3;
        link.orderPosition = re.order_position || 0;
        link.syncedAt = now;
      });
    }
  });
}

/**
 * Fetch and sync all exercises from server
 * Only fetches exercises that don't exist locally
 */
export async function syncAllExercises(): Promise<void> {
  if (!isWatermelonDBAvailable()) {
    console.log('[Sync] WatermelonDB not available, skipping exercise sync');
    return;
  }

  const database = getDatabase();
  const exercisesCollection = getExercisesCollection();
  if (!database || !exercisesCollection) return;

  console.log('[Sync] Starting full exercise sync...');
  await updateSyncMetadata('exercises', 'syncing');

  try {
    // Get count of local exercises
    const localCount = await exercisesCollection.query().fetchCount();

    // If we have exercises locally, skip full sync (user can clear cache to force refresh)
    if (localCount > 0) {
      console.log(`[Sync] ${localCount} exercises already cached locally, skipping full sync`);
      await updateSyncMetadata('exercises', 'idle');
      return;
    }

    // Fetch all exercises from server via Edge Function
    const { data: response, error } = await supabase.functions.invoke('fetch-exercises', {
      method: 'POST',
      body: {} // Empty body implies no filters -> fetch all
    });

    if (error) throw error;
    if (response?.error) throw new Error(response.error);

    const exercises = response.exercises || [];
    console.log(`[Sync] Fetched ${exercises.length} exercises from server. Preparing batch...`);

    const now = Date.now();
    const preparations: any[] = [];

    // Preparation logic for each exercise
    for (const serverExercise of exercises) {
      if (exerciseIdMap.has(serverExercise.id)) continue;

      const existing = await getExerciseByServerId(serverExercise.id);
      if (existing) {
        exerciseIdMap.set(serverExercise.id, existing.id);
        continue;
      }

      await syncExercise(serverExercise, preparations);
    }

    if (preparations.length > 0) {
      console.log(`[Sync] Executing exercise batch write (${preparations.length} actions)...`);
      await database.write(async () => {
        await database.batch(...preparations);
      });
    }

    await updateSyncMetadata('exercises', 'idle');
    console.log('[Sync] Exercise sync complete');
  } catch (error) {
    console.error('[Sync] Exercise sync failed:', error);
    await updateSyncMetadata('exercises', 'error', String(error));
    throw error;
  }
}

/**
 * Fetch and sync all workout routines from server
 */
export async function syncAllRoutines(): Promise<void> {
  if (!isWatermelonDBAvailable()) {
    console.log('[Sync] WatermelonDB not available, skipping routine sync');
    return;
  }

  const database = getDatabase();
  const routinesCollection = getWorkoutRoutinesCollection();
  if (!database || !routinesCollection) return;

  console.log('[Sync] Starting full routine sync...');
  await updateSyncMetadata('workout_routines', 'syncing');

  try {
    const localCount = await routinesCollection.query().fetchCount();

    if (localCount > 0) {
      console.log(`[Sync] ${localCount} routines already cached locally, skipping full sync`);
      await updateSyncMetadata('workout_routines', 'idle');
      return;
    }

    const { data: response, error } = await supabase.functions.invoke('workout-manager?action=sync', {
      method: 'GET'
    });

    if (error) throw error;
    if (response?.error) throw new Error(response.error);

    const routines = response.routines || [];
    console.log(`[Sync] Fetched ${routines.length} routines from server. Preparing batch...`);

    const now = Date.now();
    const preparations: any[] = [];
    const routineExercisesCollection = getRoutineExercisesCollection();

    for (const serverRoutine of routines) {
      if (routineIdMap.has(serverRoutine.id)) continue;

      const existing = await getRoutineByServerId(serverRoutine.id);
      if (existing) {
        routineIdMap.set(serverRoutine.id, existing.id);
        continue;
      }

      // Prepare routine
      const newRoutine = routinesCollection.prepareCreate((routine: any) => {
        routine.serverId = serverRoutine.id;
        routine.name = serverRoutine.name;
        routine.imageUrl = serverRoutine.image_url || null;
        routine.imageUrlMale = serverRoutine.image_url_male || null;
        routine.imageUrlFemale = serverRoutine.image_url_female || null;
        routine.level = serverRoutine.level || null;
        routine.category = serverRoutine.category || null;
        routine.place = serverRoutine.place || null;
        routine.createdBy = serverRoutine.created_by || null;
        routine.isSystem = serverRoutine.is_system ?? true;
        routine.syncedAt = now;
      });

      preparations.push(newRoutine);
      routineIdMap.set(serverRoutine.id, newRoutine.id);

      // Prepare routine exercises
      if (serverRoutine.routine_exercises?.length > 0) {
        for (const re of serverRoutine.routine_exercises) {
          const exercise = re.exercises || re.exercise;
          if (!exercise?.id) continue;

          // Sync exercise (prepared)
          const localExerciseId = await syncExercise(exercise, preparations);
          if (!localExerciseId) continue;

          preparations.push(routineExercisesCollection!.prepareCreate((link: any) => {
            link.serverId = re.id;
            link.routineId = newRoutine.id;
            link.serverRoutineId = serverRoutine.id;
            link.exerciseId = localExerciseId;
            link.serverExerciseId = exercise.id;
            link.reps = re.reps || null;
            link.duration = re.duration || null;
            link.sets = re.sets || 3;
            link.orderPosition = re.order_position || 0;
            link.syncedAt = now;
          }));
        }
      }
    }

    if (preparations.length > 0) {
      console.log(`[Sync] Executing routine batch write (${preparations.length} actions)...`);
      await database.write(async () => {
        await database.batch(...preparations);
      });
    }

    await updateSyncMetadata('workout_routines', 'idle');
    console.log('[Sync] Routine sync complete');
  } catch (error) {
    console.error('[Sync] Routine sync failed:', error);
    await updateSyncMetadata('workout_routines', 'error', String(error));
    throw error;
  }
}

/**
 * Sync a specific routine by server ID
 * Useful for fetching routine details on-demand
 */
export async function syncRoutineById(serverRoutineId: string): Promise<{
  routine: WorkoutRoutine;
  exercises: any[];
} | null> {
  if (!isWatermelonDBAvailable()) return null;

  const routineExercisesCollection = getRoutineExercisesCollection();
  const focusAreasCollection = getExerciseFocusAreasCollection();
  const mistakesCollection = getExerciseMistakesCollection();
  const tipsCollection = getExerciseTipsCollection();

  if (!routineExercisesCollection || !focusAreasCollection || !mistakesCollection || !tipsCollection) {
    return null;
  }

  try {
    // Check if already exists locally
    const existingRoutine = await getRoutineByServerId(serverRoutineId);

    if (existingRoutine) {
      // Get exercises from local DB
      const routineExercises = await routineExercisesCollection
        .query(Q.where('server_routine_id', serverRoutineId))
        .fetch() as RoutineExercise[];

      // Build exercises array with full details
      const exercises = await Promise.all(
        routineExercises
          .sort((a, b) => a.orderPosition - b.orderPosition)
          .map(async (re) => {
            const exercise = await getExerciseByServerId(re.serverExerciseId);
            if (!exercise) return null;

            // Get focus areas, mistakes, tips
            const focusAreas = await focusAreasCollection
              .query(Q.where('exercise_id', exercise.id))
              .fetch() as ExerciseFocusArea[];

            const mistakes = await mistakesCollection
              .query(Q.where('exercise_id', exercise.id))
              .fetch() as ExerciseMistake[];

            const tips = await tipsCollection
              .query(Q.where('exercise_id', exercise.id))
              .fetch() as ExerciseTip[];

            return {
              id: re.id,
              order_position: re.orderPosition,
              reps: re.reps,
              duration: re.duration,
              sets: re.sets,
              exercises: {
                id: exercise.serverId,
                name: exercise.name,
                gif_url: exercise.gifUrl,
                image_url_male: exercise.imageUrlMale,
                image_url_female: exercise.imageUrlFemale,
                exercise_type: exercise.exerciseType,
                instructions: exercise.instructions,
                is_per_side: exercise.isPerSide,
                exercise_focus_areas: focusAreas.map(fa => ({
                  id: fa.serverId,
                  area: fa.area,
                  weightage: fa.weightage,
                })),
                exercise_mistakes: mistakes.map(m => ({
                  id: m.serverId,
                  title: m.title,
                  subtitle: m.subtitle,
                })),
                exercise_tips: tips.map(t => ({
                  id: t.serverId,
                  tip: t.tip,
                })),
              },
            };
          })
      );

      return {
        routine: existingRoutine,
        exercises: exercises.filter(Boolean),
      };
    }

    // Fetch from server if not cached
    const { data: response, error } = await supabase.functions.invoke(`workout-manager?id=${serverRoutineId}`, {
      method: 'GET'
    });

    if (error) throw error;
    if (response?.error) throw new Error(response.error);

    // Response from workout-manager for ID is { routine: ..., exercises: [...] }
    const routine = response.routine;
    const exercises = response.exercises;

    if (!routine) return null;

    // Sync to local DB
    const localRoutineId = await syncRoutine(routine);
    if (localRoutineId && exercises?.length > 0) {
      await syncRoutineExercises(routine.id, localRoutineId, exercises);
    }

    // Return in expected format
    const localRoutine = await getRoutineByServerId(serverRoutineId);
    return localRoutine ? {
      routine: localRoutine,
      exercises: routine.routine_exercises || [],
    } : null;

  } catch (error) {
    console.error('[Sync] Error syncing routine by ID:', error);
    throw error;
  }
}

/**
 * Clear all offline data (exercises, routines, etc.)
 * User-triggered action from settings
 */
export async function clearOfflineData(): Promise<void> {
  if (!isWatermelonDBAvailable()) {
    console.log('[Sync] WatermelonDB not available, nothing to clear');
    return;
  }

  const database = getDatabase();
  if (!database) return;

  console.log('[Sync] Clearing all offline data...');

  try {
    await database.write(async () => {
      // Clear all tables
      await database.adapter.unsafeExecute({
        sqls: [
          ['DELETE FROM exercises', []],
          ['DELETE FROM exercise_focus_areas', []],
          ['DELETE FROM exercise_mistakes', []],
          ['DELETE FROM exercise_tips', []],
          ['DELETE FROM workout_routines', []],
          ['DELETE FROM routine_exercises', []],
          ['DELETE FROM challenges', []],
          ['DELETE FROM challenge_days', []],
          ['DELETE FROM user_challenges', []],
          ['DELETE FROM user_challenge_logs', []],
          ['DELETE FROM pending_sync', []],
          ['DELETE FROM sync_metadata', []],
        ],
      });
    });

    // Clear in-memory caches
    exerciseIdMap.clear();
    routineIdMap.clear();

    console.log('[Sync] All offline data cleared');
  } catch (error) {
    console.error('[Sync] Error clearing offline data:', error);
    throw error;
  }
}

/**
 * Get sync status for a table
 */
export async function getSyncStatus(tableName: string): Promise<{
  lastSyncAt: number | null;
  status: string;
  itemCount: number;
}> {
  if (!isWatermelonDBAvailable()) {
    return {
      lastSyncAt: null,
      status: 'watermelon_unavailable',
      itemCount: 0,
    };
  }

  const metadata = await getSyncMetadataRecord(tableName);

  let itemCount = 0;
  const exercisesCollection = getExercisesCollection();
  const routinesCollection = getWorkoutRoutinesCollection();

  switch (tableName) {
    case 'exercises':
      if (exercisesCollection) {
        itemCount = await exercisesCollection.query().fetchCount();
      }
      break;
    case 'workout_routines':
      if (routinesCollection) {
        itemCount = await routinesCollection.query().fetchCount();
      }
      break;
  }

  return {
    lastSyncAt: metadata?.lastSyncAt || null,
    status: metadata?.syncStatus || 'never_synced',
    itemCount,
  };
}

/**
 * Initialize sync - call on app startup
 */
export async function initializeSync(): Promise<void> {
  if (!isWatermelonDBAvailable()) {
    console.log('[Sync] WatermelonDB not available (Expo Go?), skipping initialization');
    return;
  }

  console.log('[Sync] Initializing offline data...');

  const exercisesCollection = getExercisesCollection();
  const routinesCollection = getWorkoutRoutinesCollection();

  if (!exercisesCollection || !routinesCollection) {
    console.log('[Sync] Collections not available');
    return;
  }

  try {
    // Check if we have any data locally
    const exerciseCount = await exercisesCollection.query().fetchCount();
    const routineCount = await routinesCollection.query().fetchCount();

    console.log(`[Sync] Local data: ${exerciseCount} exercises, ${routineCount} routines`);

    // If no data, trigger initial sync (in background)
    if (exerciseCount === 0 || routineCount === 0) {
      console.log('[Sync] No local data, starting initial sync...');
      // Don't await - let it sync in background
      Promise.all([
        syncAllExercises(),
        syncAllRoutines(),
      ]).catch(err => console.error('[Sync] Background sync error:', err));
    }
  } catch (error) {
    console.error('[Sync] Initialization error:', error);
  }
}
