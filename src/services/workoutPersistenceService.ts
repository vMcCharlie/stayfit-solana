import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_WORKOUT_KEY = 'stayfit_active_workout_session';

export interface SavedWorkoutState {
    routineId: string;
    routineName: string;
    workoutSessionId: string | null;
    workoutMode: "idle" | "edit" | "start" | "exercise" | "rest" | "complete";
    currentExerciseIndex: number;
    workoutStartTime: number | null;
    totalWorkoutDuration: number; // accumulated duration before pause/crash
    caloriesBurned: number;
    completedExercises: { [key: string]: any };
    workouts: any[]; // The list of workout items with user customizations (reps/duration)
    lastUpdated: number;
}

export const workoutPersistenceService = {
    /**
     * Save the current state of the workout
     */
    async saveState(state: SavedWorkoutState): Promise<void> {
        try {
            // Add timestamp
            const stateToSave = {
                ...state,
                lastUpdated: Date.now(),
            };
            await AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(stateToSave));
            console.log(`[Persistence] Workout state saved for routine: ${state.routineName}`);
        } catch (error) {
            console.error('[Persistence] Failed to save workout state:', error);
        }
    },

    /**
     * Check if there is an active session saved
     */
    async hasActiveSession(): Promise<boolean> {
        try {
            const json = await AsyncStorage.getItem(ACTIVE_WORKOUT_KEY);
            return !!json;
        } catch (error) {
            return false;
        }
    },

    /**
     * Get the saved active session
     */
    async getState(): Promise<SavedWorkoutState | null> {
        try {
            const json = await AsyncStorage.getItem(ACTIVE_WORKOUT_KEY);
            if (!json) return null;

            const state = JSON.parse(json) as SavedWorkoutState;

            // Optional: Check if state is too old (e.g., > 24 hours)?
            // For now, let's keep it until explicitly cleared or resumed.

            return state;
        } catch (error) {
            console.error('[Persistence] Failed to get workout state:', error);
            return null;
        }
    },

    /**
     * Clear the active session (on complete or quit)
     */
    async clearState(): Promise<void> {
        try {
            await AsyncStorage.removeItem(ACTIVE_WORKOUT_KEY);
            console.log('[Persistence] Workout state cleared');
        } catch (error) {
            console.error('[Persistence] Failed to clear workout state:', error);
        }
    }
};
