import { Database } from '@nozbe/watermelondb';
import { Platform } from 'react-native';

import schema from './schema';
import { modelClasses } from './models';

/**
 * Initialize WatermelonDB database
 * 
 * NOTE: WatermelonDB requires native modules and won't work in Expo Go.
 * It requires a development build (eas build) to function.
 * We use lazy initialization to prevent crashes in Expo Go.
 */

let database: Database | null = null;
let initializationError: Error | null = null;
let isInitialized = false;

/**
 * Check if WatermelonDB is available (requires dev build)
 */
export function isWatermelonDBAvailable(): boolean {
  return database !== null && !initializationError;
}

/**
 * Initialize the database lazily
 * Returns the database instance or null if not available
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Check if running in Expo Go
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Initialize the database lazily
 * Returns the database instance or null if not available
 */
export function initializeDatabase(): Database | null {
  if (isInitialized) {
    return database;
  }

  isInitialized = true;

  // Explicitly skip for Expo Go to prevent native crashes
  if (isExpoGo) {
    console.log('[WatermelonDB] Skipping initialization in Expo Go');
    initializationError = new Error('WatermelonDB not supported in Expo Go');
    return null;
  }

  try {
    // Dynamic import to prevent crash at module load time
    const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;

    const adapter = new SQLiteAdapter({
      schema,
      jsi: Platform.OS !== 'web',
      onSetUpError: (error: Error) => {
        console.error('[WatermelonDB] Setup error:', error);
        initializationError = error;
      },
    });

    database = new Database({
      adapter,
      modelClasses,
    });

    console.log('[WatermelonDB] Database initialized successfully');
    return database;
  } catch (error) {
    console.warn('[WatermelonDB] Not available (requires dev build):', error);
    initializationError = error as Error;
    return null;
  }
}

/**
 * Get the database instance (initializes if needed)
 */
export function getDatabase(): Database | null {
  if (!isInitialized) {
    return initializeDatabase();
  }
  return database;
}

// Export default as a getter function to allow lazy initialization
export default { getDatabase, isWatermelonDBAvailable, initializeDatabase };

// Collection getters that check if DB is available
export function getExercisesCollection() {
  const db = getDatabase();
  return db ? db.get('exercises') : null;
}

export function getExerciseFocusAreasCollection() {
  const db = getDatabase();
  return db ? db.get('exercise_focus_areas') : null;
}

export function getExerciseMistakesCollection() {
  const db = getDatabase();
  return db ? db.get('exercise_mistakes') : null;
}

export function getExerciseTipsCollection() {
  const db = getDatabase();
  return db ? db.get('exercise_tips') : null;
}

export function getWorkoutRoutinesCollection() {
  const db = getDatabase();
  return db ? db.get('workout_routines') : null;
}

export function getRoutineExercisesCollection() {
  const db = getDatabase();
  return db ? db.get('routine_exercises') : null;
}

export function getPendingSyncCollection() {
  const db = getDatabase();
  return db ? db.get('pending_sync') : null;
}

export function getSyncMetadataCollection() {
  const db = getDatabase();
  return db ? db.get('sync_metadata') : null;
}



// Legacy exports for backward compatibility (will be null in Expo Go)
export const exercisesCollection = null;
export const exerciseFocusAreasCollection = null;
export const exerciseMistakesCollection = null;
export const exerciseTipsCollection = null;
export const workoutRoutinesCollection = null;
export const routineExercisesCollection = null;
export const pendingSyncCollection = null;
export const syncMetadataCollection = null;

