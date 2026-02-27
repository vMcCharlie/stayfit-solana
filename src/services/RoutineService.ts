import { Q } from '@nozbe/watermelondb';
import { getWorkoutRoutinesCollection } from '../database';
import { syncAllRoutines, syncRoutineById } from '../database/sync';
import WorkoutRoutine from '../database/models/WorkoutRoutine';

export const RoutineService = {
    /**
     * Sync routines from server
     */
    sync: async () => {
        await syncAllRoutines();
    },

    /**
     * Get all workout routines
     */
    getAllRoutines: async (): Promise<WorkoutRoutine[]> => {
        const collection = getWorkoutRoutinesCollection();
        if (!collection) return [];

        try {
            return await collection.query().fetch();
        } catch (error) {
            console.error('Error fetching routines:', error);
            return [];
        }
    },

    /**
     * Get routine details (with exercises)
     * This ensures we have the latest data for the routine
     */
    getRoutineDetails: async (serverId: string) => {
        // Force sync for this specific routine to ensure we have exercises
        return await syncRoutineById(serverId);
    }
};
