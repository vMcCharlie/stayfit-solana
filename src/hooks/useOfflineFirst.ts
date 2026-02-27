import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import database, {
  exercisesCollection,
  exerciseFocusAreasCollection,
  exerciseMistakesCollection,
  exerciseTipsCollection,
  workoutRoutinesCollection,
  routineExercisesCollection,
} from '../database';
import {
  syncExercise,
  syncRoutineById,
  getExerciseByServerId,
  getRoutineByServerId,
} from '../database/sync';
import { api } from '../services/api';
import type Exercise from '../database/models/Exercise';
import type ExerciseFocusArea from '../database/models/ExerciseFocusArea';
import type ExerciseMistake from '../database/models/ExerciseMistake';
import type ExerciseTip from '../database/models/ExerciseTip';
import type WorkoutRoutine from '../database/models/WorkoutRoutine';
import type RoutineExercise from '../database/models/RoutineExercise';

/**
 * Hook for offline-first exercise data access
 * Checks local DB first, falls back to API if not found
 */
export function useExercise(serverId: string | null) {
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serverId) {
      setLoading(false);
      return;
    }

    const fetchExercise = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check local DB first
        const localExercise = await getExerciseByServerId(serverId);

        if (localExercise) {
          // Get related data
          const [focusAreas, mistakes, tips] = await Promise.all([
            exerciseFocusAreasCollection
              .query(Q.where('exercise_id', localExercise.id))
              .fetch() as Promise<ExerciseFocusArea[]>,
            exerciseMistakesCollection
              .query(Q.where('exercise_id', localExercise.id))
              .fetch() as Promise<ExerciseMistake[]>,
            exerciseTipsCollection
              .query(Q.where('exercise_id', localExercise.id))
              .fetch() as Promise<ExerciseTip[]>,
          ]);

          // Format for UI compatibility
          setExercise({
            id: localExercise.serverId,
            name: localExercise.name,
            gif_url: localExercise.gifUrl,
            image_url_male: localExercise.imageUrlMale,
            image_url_female: localExercise.imageUrlFemale,
            exercise_type: localExercise.exerciseType,
            instructions: localExercise.instructions,
            is_per_side: localExercise.isPerSide,
            equipments: localExercise.equipments,
            focusAreas: focusAreas.map(fa => ({
              area: fa.area,
              weightage: fa.weightage,
              intensity: fa.intensity,
            })),
            mistakes: mistakes.map(m => m.displayText),
            tips: tips.map(t => t.tip),
            _fromCache: true,
          });
          setLoading(false);
          return;
        }

        // Not in local DB, fetch from API
        console.log('[useExercise] Not cached, fetching from API:', serverId);
        const apiExercise = await api.getExerciseDetails(serverId);

        if (apiExercise) {
          // Sync to local DB for future use
          await syncExercise(apiExercise);

          setExercise({
            ...apiExercise,
            focusAreas: (apiExercise.exercise_focus_areas || []).map((fa: any) => ({
              area: fa.area,
              weightage: fa.weightage,
              intensity: fa.weightage / 100,
            })),
            mistakes: (apiExercise.exercise_mistakes || []).map(
              (m: any) => `${m.title}${m.subtitle ? ' - ' + m.subtitle : ''}`
            ),
            tips: (apiExercise.exercise_tips || []).map((t: any) => t.tip),
            _fromCache: false,
          });
        }
      } catch (err) {
        console.error('[useExercise] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load exercise');
      } finally {
        setLoading(false);
      }
    };

    fetchExercise();
  }, [serverId]);

  return { exercise, loading, error };
}

/**
 * Hook for offline-first routine data access
 */
export function useRoutine(serverId: string | null) {
  const [routine, setRoutine] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!serverId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to get from local DB with sync fallback
      const result = await syncRoutineById(serverId);

      if (result) {
        setRoutine({
          id: result.routine.serverId,
          name: result.routine.name,
          image_url: result.routine.imageUrl,
          image_url_male: result.routine.imageUrlMale,
          image_url_female: result.routine.imageUrlFemale,
          level: result.routine.level,
          category: result.routine.category,
          place: result.routine.place,
          _fromCache: true,
        });
        setExercises(result.exercises);
      }
    } catch (err) {
      console.error('[useRoutine] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load routine');
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { routine, exercises, loading, error, refresh };
}

/**
 * Hook for listing all workout routines (offline-first)
 */
export function useWorkoutRoutines(filters?: { level?: string; category?: string; place?: string }) {
  const [routines, setRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query with filters
      let query = workoutRoutinesCollection.query();

      const conditions: any[] = [];
      if (filters?.level) {
        conditions.push(Q.where('level', filters.level));
      }
      if (filters?.category) {
        conditions.push(Q.where('category', filters.category));
      }
      if (filters?.place) {
        conditions.push(Q.where('place', filters.place));
      }

      if (conditions.length > 0) {
        query = workoutRoutinesCollection.query(Q.and(...conditions));
      }

      const localRoutines = await query.fetch() as WorkoutRoutine[];

      if (localRoutines.length > 0) {
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

        setRoutines(routinesWithCounts);
        setLoading(false);
        return;
      }

      // Fallback to API if no local data
      console.log('[useWorkoutRoutines] No cached data, fetching from API');
      const apiRoutines = await api.getWorkoutRoutines();
      setRoutines(apiRoutines.map(r => ({ ...r, _fromCache: false })));
    } catch (err) {
      console.error('[useWorkoutRoutines] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load routines');
    } finally {
      setLoading(false);
    }
  }, [filters?.level, filters?.category, filters?.place]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { routines, loading, error, refresh };
}

/**
 * Get cached exercise data synchronously if available
 * Useful for components that need data immediately
 */
export async function getCachedExerciseData(serverId: string): Promise<any | null> {
  try {
    const localExercise = await getExerciseByServerId(serverId);
    if (!localExercise) return null;

    const [focusAreas, mistakes, tips] = await Promise.all([
      exerciseFocusAreasCollection
        .query(Q.where('exercise_id', localExercise.id))
        .fetch() as Promise<ExerciseFocusArea[]>,
      exerciseMistakesCollection
        .query(Q.where('exercise_id', localExercise.id))
        .fetch() as Promise<ExerciseMistake[]>,
      exerciseTipsCollection
        .query(Q.where('exercise_id', localExercise.id))
        .fetch() as Promise<ExerciseTip[]>,
    ]);

    return {
      id: localExercise.serverId,
      name: localExercise.name,
      gif_url: localExercise.gifUrl,
      image_url_male: localExercise.imageUrlMale,
      image_url_female: localExercise.imageUrlFemale,
      exercise_type: localExercise.exerciseType,
      instructions: localExercise.instructions,
      is_per_side: localExercise.isPerSide,
      equipments: localExercise.equipments,
      focusAreas: focusAreas.map(fa => ({
        area: fa.area,
        weightage: fa.weightage,
        intensity: fa.intensity,
      })),
      mistakes: mistakes.map(m => m.displayText),
      tips: tips.map(t => t.tip),
      _fromCache: true,
    };
  } catch (error) {
    console.error('[getCachedExerciseData] Error:', error);
    return null;
  }
}


