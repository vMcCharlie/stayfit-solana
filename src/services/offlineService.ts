import { Q } from '@nozbe/watermelondb';
import {
  isWatermelonDBAvailable,
  getExercisesCollection,
  getExerciseFocusAreasCollection,
  getExerciseMistakesCollection,
  getExerciseTipsCollection,
  getWorkoutRoutinesCollection,
  getRoutineExercisesCollection,
} from '../database';
import {
  syncExercise,
  syncRoutine,
  syncRoutineExercises,
  getExerciseByServerId,
  getRoutineByServerId,
  clearOfflineData as clearWatermelonData,
} from '../database/sync';
import { supabase } from '../lib/supabase';
import { api } from './api';
import type Exercise from '../database/models/Exercise';
import type ExerciseFocusArea from '../database/models/ExerciseFocusArea';
import type ExerciseMistake from '../database/models/ExerciseMistake';
import type ExerciseTip from '../database/models/ExerciseTip';
import type WorkoutRoutine from '../database/models/WorkoutRoutine';
import type RoutineExercise from '../database/models/RoutineExercise';

/**
 * Offline-First Service
 * 
 * This service provides offline-first data access for the StayFit app.
 * It uses WatermelonDB for local storage and syncs with Supabase.
 * 
 * Key principles:
 * 1. Exercise data is cached forever (until user clears cache)
 * 2. If data exists locally, don't re-fetch from server
 * 3. Only fetch from server what we don't have locally
 */

/**
 * Format exercise data for UI compatibility
 * Converts from WatermelonDB model to the format expected by UI components
 */
async function formatExerciseForUI(exercise: Exercise): Promise<any> {
  const focusAreasCollection = getExerciseFocusAreasCollection();
  const mistakesCollection = getExerciseMistakesCollection();
  const tipsCollection = getExerciseTipsCollection();

  if (!focusAreasCollection || !mistakesCollection || !tipsCollection) {
    // Return basic data if collections not available
    return {
      id: exercise.serverId,
      name: exercise.name,
      gif_url: exercise.gifUrl,
      image_url_male: exercise.imageUrlMale,
      image_url_female: exercise.imageUrlFemale,
      exercise_type: exercise.exerciseType,
      instructions: exercise.instructions,
      is_per_side: exercise.isPerSide,
      equipments: exercise.equipments,
      focusAreas: [],
      mistakes: [],
      tips: [],
      _fromCache: true,
    };
  }

  const [focusAreas, mistakes, tips] = await Promise.all([
    focusAreasCollection
      .query(Q.where('exercise_id', exercise.id))
      .fetch() as Promise<ExerciseFocusArea[]>,
    mistakesCollection
      .query(Q.where('exercise_id', exercise.id))
      .fetch() as Promise<ExerciseMistake[]>,
    tipsCollection
      .query(Q.where('exercise_id', exercise.id))
      .fetch() as Promise<ExerciseTip[]>,
  ]);

  return {
    id: exercise.serverId,
    name: exercise.name,
    gif_url: exercise.gifUrl,
    image_url_male: exercise.imageUrlMale,
    image_url_female: exercise.imageUrlFemale,
    exercise_type: exercise.exerciseType,
    instructions: exercise.instructions,
    is_per_side: exercise.isPerSide,
    equipments: exercise.equipments,
    avg_time_per_rep: exercise.avgTimePerRep,
    place: exercise.place,
    requires_weight: exercise.requiresWeight,
    weight_unit: exercise.weightUnit,
    recommended_weight_range: exercise.recommendedWeightRange,
    // Formatted for UI components
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
    // Pre-formatted for some UI components
    focusAreas: focusAreas.map(fa => ({
      area: fa.area,
      weightage: fa.weightage,
      intensity: fa.intensity,
    })),
    mistakes: mistakes.map(m => m.displayText),
    tips: tips.map(t => t.tip),
    _fromCache: true,
  };
}

/**
 * Get exercise details by server ID
 * First checks local DB (if WatermelonDB available), then fetches from server if not found
 * Exercise data is stored forever locally
 */
export async function getExerciseDetails(serverId: string): Promise<any | null> {
  try {
    // Check local DB first (if WatermelonDB is available)
    if (isWatermelonDBAvailable()) {
      const localExercise = await getExerciseByServerId(serverId);

      if (localExercise) {
        console.log(`[OfflineService] Exercise ${serverId} found in local DB`);
        return await formatExerciseForUI(localExercise);
      }
    }

    // Not found locally or WatermelonDB not available, fetch from server
    console.log(`[OfflineService] Exercise ${serverId} not cached, fetching from server`);

    const { data: serverExercise, error } = await supabase
      .from('exercises')
      .select(`
        *,
        exercise_focus_areas(*),
        exercise_mistakes(*),
        exercise_tips(*),
        exercise_animations(*)
      `)
      .eq('id', serverId)
      .single();

    if (error || !serverExercise) {
      console.error('[OfflineService] Error fetching exercise:', error);
      return null;
    }

    // Sync to local DB for future use (if WatermelonDB available)
    if (isWatermelonDBAvailable()) {
      await syncExercise(serverExercise);
    }

    // Return the server data formatted for UI
    return {
      ...serverExercise,
      focusAreas: (serverExercise.exercise_focus_areas || []).map((fa: any) => ({
        area: fa.area,
        weightage: fa.weightage,
        intensity: fa.weightage / 100,
      })),
      mistakes: (serverExercise.exercise_mistakes || []).map(
        (m: any) => `${m.title}${m.subtitle ? ' - ' + m.subtitle : ''}`
      ),
      tips: (serverExercise.exercise_tips || []).map((t: any) => t.tip),
      _fromCache: false,
    };
  } catch (error) {
    console.error('[OfflineService] Error getting exercise details:', error);
    return null;
  }
}

/**
 * Get routine details with all exercises
 * Checks local DB first (if WatermelonDB available), fetches from server if not found
 */
export async function getRoutineDetails(serverRoutineId: string): Promise<{
  routine: any;
  exercises: any[];
} | null> {
  try {
    // Check if routine exists locally (if WatermelonDB available)
    if (isWatermelonDBAvailable()) {
      const localRoutine = await getRoutineByServerId(serverRoutineId);
      const routineExercisesCollection = getRoutineExercisesCollection();

      if (localRoutine && routineExercisesCollection) {
        console.log(`[OfflineService] Routine ${serverRoutineId} found in local DB`);

        // Get routine exercises from local DB
        const routineExercises = await routineExercisesCollection
          .query(Q.where('server_routine_id', serverRoutineId))
          .fetch() as RoutineExercise[];

        // Build exercises array with full details
        const exercises = await Promise.all(
          routineExercises
            .sort((a, b) => a.orderPosition - b.orderPosition)
            .map(async (re) => {
              const exercise = await getExerciseByServerId(re.serverExerciseId);
              if (!exercise) {
                console.warn(`[OfflineService] Exercise ${re.serverExerciseId} not found for routine`);
                return null;
              }

              const formattedExercise = await formatExerciseForUI(exercise);

              return {
                id: re.serverId,
                order_position: re.orderPosition,
                reps: re.reps,
                duration: re.duration,
                sets: re.sets,
                exercises: formattedExercise,
              };
            })
        );

        return {
          routine: {
            id: localRoutine.serverId,
            name: localRoutine.name,
            image_url: localRoutine.imageUrl,
            image_url_male: localRoutine.imageUrlMale,
            image_url_female: localRoutine.imageUrlFemale,
            level: localRoutine.level,
            category: localRoutine.category,
            place: localRoutine.place,
            _fromCache: true,
          },
          exercises: exercises.filter(Boolean),
        };
      }
    }

    // Not found locally or WatermelonDB not available, fetch from server
    console.log(`[OfflineService] Routine ${serverRoutineId} not cached, fetching from server`);

    const { data: serverRoutine, error } = await supabase
      .from('workout_routines')
      .select(`
        *,
        routine_exercises(
          *,
          exercises(
            *,
            exercise_focus_areas(*),
            exercise_mistakes(*),
            exercise_tips(*),
            exercise_animations(*)
          )
        )
      `)
      .eq('id', serverRoutineId)
      .single();

    if (error || !serverRoutine) {
      console.error('[OfflineService] Error fetching routine:', error);
      return null;
    }

    // Sync routine and exercises to local DB (if WatermelonDB available)
    if (isWatermelonDBAvailable()) {
      const localRoutineId = await syncRoutine(serverRoutine);
      if (localRoutineId && serverRoutine.routine_exercises?.length > 0) {
        await syncRoutineExercises(serverRoutine.id, localRoutineId, serverRoutine.routine_exercises);
      }
    }

    // Return server data
    return {
      routine: {
        ...serverRoutine,
        _fromCache: false,
      },
      exercises: serverRoutine.routine_exercises || [],
    };
  } catch (error) {
    console.error('[OfflineService] Error getting routine details:', error);
    return null;
  }
}

/**
 * Get all workout routines
 * Returns from local DB if available, otherwise fetches from server
 */
export async function getWorkoutRoutines(): Promise<any[]> {
  try {
    // Check local DB first (if WatermelonDB available)
    if (isWatermelonDBAvailable()) {
      const routinesCollection = getWorkoutRoutinesCollection();
      const routineExercisesCollection = getRoutineExercisesCollection();

      if (routinesCollection && routineExercisesCollection) {
        const localRoutines = await routinesCollection.query().fetch() as WorkoutRoutine[];

        if (localRoutines.length > 0) {
          console.log(`[OfflineService] Found ${localRoutines.length} routines in local DB`);

          // Get exercise counts for each routine
          const routinesWithCounts = await Promise.all(
            localRoutines.map(async (routine) => {
              const exerciseCount = await routineExercisesCollection
                .query(Q.where('routine_id', routine.id))
                .fetchCount();

              return {
                id: routine.serverId,
                name: routine.name,
                image_url: routine.imageUrl,
                image_url_male: routine.imageUrlMale,
                image_url_female: routine.imageUrlFemale,
                level: routine.level,
                category: routine.category,
                place: routine.place,
                exercise_count: exerciseCount,
                _fromCache: true,
              };
            })
          );

          return routinesWithCounts;
        }
      }
    }

    // Fallback to API (WatermelonDB not available or no local data)
    console.log('[OfflineService] No cached routines, fetching from API');
    return await api.getWorkoutRoutines();
  } catch (error) {
    console.error('[OfflineService] Error getting workout routines:', error);
    throw error;
  }
}

/**
 * Clear all offline data
 * Clears WatermelonDB if available
 */
export async function clearAllOfflineData(): Promise<void> {
  if (isWatermelonDBAvailable()) {
    await clearWatermelonData();
  }
}

/**
 * Get offline data statistics
 */
export async function getOfflineStats(): Promise<{
  exerciseCount: number;
  routineCount: number;
  lastSync: Date | null;
}> {
  if (!isWatermelonDBAvailable()) {
    return {
      exerciseCount: 0,
      routineCount: 0,
      lastSync: null,
    };
  }

  try {
    const exercisesCollection = getExercisesCollection();
    const routinesCollection = getWorkoutRoutinesCollection();

    const exerciseCount = exercisesCollection
      ? await exercisesCollection.query().fetchCount()
      : 0;
    const routineCount = routinesCollection
      ? await routinesCollection.query().fetchCount()
      : 0;

    return {
      exerciseCount,
      routineCount,
      lastSync: null, // TODO: Track last sync time
    };
  } catch (error) {
    console.error('[OfflineService] Error getting stats:', error);
    return {
      exerciseCount: 0,
      routineCount: 0,
      lastSync: null,
    };
  }
}

export default {
  getExerciseDetails,
  getRoutineDetails,
  getWorkoutRoutines,
  clearAllOfflineData,
  getOfflineStats,
};

