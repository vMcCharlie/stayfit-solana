import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeDatabase, isWatermelonDBAvailable, getDatabase } from '../database';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DatabaseContextType {
  isInitialized: boolean;
  isWatermelonAvailable: boolean;
  syncStatus: {
    exercises: { lastSyncAt: number | null; status: string; itemCount: number };
    routines: { lastSyncAt: number | null; status: string; itemCount: number };
  };
  refreshSyncStatus: () => Promise<void>;
  clearCache: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isWatermelonAvailable, setIsWatermelonAvailable] = useState(false);
  const [syncStatus, setSyncStatus] = useState<DatabaseContextType['syncStatus']>({
    exercises: { lastSyncAt: null, status: 'unknown', itemCount: 0 },
    routines: { lastSyncAt: null, status: 'unknown', itemCount: 0 },
  });

  const refreshSyncStatus = async () => {
    try {
      if (isWatermelonDBAvailable()) {
        // Use WatermelonDB sync status
        const { getSyncStatus } = await import('../database/sync');
        const [exerciseStatus, routineStatus] = await Promise.all([
          getSyncStatus('exercises'),
          getSyncStatus('workout_routines'),
        ]);
        setSyncStatus({
          exercises: exerciseStatus,
          routines: routineStatus,
        });
      } else {
        // Fallback: count AsyncStorage cache entries
        const keys = await AsyncStorage.getAllKeys();
        const exerciseKeys = keys.filter(k => k.includes('exercise_cache_'));
        const routineKeys = keys.filter(k => k.includes('routine_cache_'));
        setSyncStatus({
          exercises: { lastSyncAt: null, status: 'async_storage', itemCount: exerciseKeys.length },
          routines: { lastSyncAt: null, status: 'async_storage', itemCount: routineKeys.length },
        });
      }
    } catch (error) {
      console.error('[DatabaseProvider] Error refreshing sync status:', error);
    }
  };

  const clearCache = async () => {
    try {
      // Clear WatermelonDB if available
      if (isWatermelonDBAvailable()) {
        const { clearOfflineData } = await import('../database/sync');
        await clearOfflineData();
      }

      // Always clear AsyncStorage cache as well
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key =>
        key.includes('routine_cache_') ||
        key.includes('exercise_cache_') ||
        key.includes('cached_workout_routines') ||
        key === 'chatHistory' ||
        key === 'aiDataOptions'
      );
      await AsyncStorage.multiRemove(cacheKeys);

      // Clear API cache
      const { api } = await import('../services/api');
      await api.clearApiCache();

      await refreshSyncStatus();
    } catch (error) {
      console.error('[DatabaseProvider] Error clearing cache:', error);
      throw error;
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        console.log('[DatabaseProvider] Initializing...');

        // Try to initialize WatermelonDB (will fail gracefully in Expo Go)
        initializeDatabase();
        const wmAvailable = isWatermelonDBAvailable();
        setIsWatermelonAvailable(wmAvailable);

        if (wmAvailable) {
          console.log('[DatabaseProvider] WatermelonDB available, initializing sync...');
          const { initializeSync } = await import('../database/sync');
          await initializeSync();
        } else {
          console.log('[DatabaseProvider] WatermelonDB not available (Expo Go), using AsyncStorage fallback');
        }

        // Get initial sync status
        await refreshSyncStatus();

        setIsInitialized(true);
        console.log('[DatabaseProvider] Initialization complete');
      } catch (error) {
        console.error('[DatabaseProvider] Initialization error:', error);
        // Still mark as initialized to not block the app
        setIsInitialized(true);
      }
    };

    init();
  }, []);

  // Listen for auth changes to trigger sync on login
  // This is needed because if we cleared cache on logout, we need to re-sync on next login
  useEffect(() => {
    const handleAuthChange = async () => {
      if (!isInitialized || !isWatermelonAvailable) return;

      const { data: { session } } = await import('../lib/supabase').then(m => m.supabase.auth.getSession());

      if (session) {
        console.log('[DatabaseProvider] User logged in, checking sync status...');
        const { initializeSync } = await import('../database/sync');
        await initializeSync();
        await refreshSyncStatus();
      }
    };

    const { data: { subscription } } = require('../lib/supabase').supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && isInitialized && isWatermelonAvailable) {
        console.log('[DatabaseProvider] User signed in event, triggering sync...');
        const { initializeSync } = await import('../database/sync');
        await initializeSync();
        await refreshSyncStatus();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isInitialized, isWatermelonAvailable]);

  const value: DatabaseContextType = {
    isInitialized,
    isWatermelonAvailable,
    syncStatus,
    refreshSyncStatus,
    clearCache,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

export default DatabaseContext;

