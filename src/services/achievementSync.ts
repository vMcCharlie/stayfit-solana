
import { supabase } from '../lib/supabase';
import { api } from './api';
import { Database } from '../types/database.types';

type Achievement = Database['public']['Tables']['achievements']['Row'];

export const syncAchievements = async (userId: string) => {
    try {
        console.log("Starting achievement sync...");

        // 1. Fetch necessary data
        const { data: { user } } = await supabase.auth.getUser();
        console.log(`[Sync] Syncing for userId: ${userId}, Auth User: ${user?.id}`);

        const profileResponse = await api.getProfile();
        const profile = profileResponse.profile;
        const streak = profileResponse.streak || 0;

        // Fetch definitions to know targets
        const { data: achievements } = await supabase.from('achievements').select('*');
        if (!achievements) return;

        // Fetch history for detailed analysis
        // Default to last 30 days or all time? ideally all time for lifetime achievements
        // But getWorkoutHistory usually paginates or defaults. 
        // Let's assume for now we trust `total_workouts_completed` from profile for volume,
        // and only use history for categorical if needed. 
        // Parsing ALL history might be heavy. 
        // Let's rely on simple counters where possible.

        const updates: any[] = [];

        // Helper to check tier
        const calculateLevel = (achievementCode: string, value: number) => {
            const achievement = achievements.find(a => a.code === achievementCode);
            if (!achievement) return 0;

            const tiers = achievement.tiers as any[]; // [{level: 1, target: 5}, ...]
            // specific logic: level is the highest tier passed
            let level = 0;
            for (const tier of tiers) {
                if (value >= tier.target) {
                    level = Math.max(level, tier.level);
                }
            }
            return level;
        };

        // --- STREAK_MASTER ---
        if (streak > 0) {
            const code = 'STREAK_MASTER';
            const level = calculateLevel(code, streak);
            updates.push({
                user_id: userId,
                achievement_code: code,
                current_value: streak,
                current_level: level,
                updated_at: new Date().toISOString()
            });
        }

        // --- CLUB_100 (Total Workouts) ---
        const totalWorkouts = profile.total_workouts_completed || 0;
        if (totalWorkouts >= 0) {
            const code = 'CLUB_100';
            const level = calculateLevel(code, totalWorkouts);
            updates.push({
                user_id: userId,
                achievement_code: code,
                current_value: totalWorkouts,
                current_level: level,
                updated_at: new Date().toISOString()
            });
        }

        // --- CALORIE_CRUSHER ---
        const totalCalories = profile.total_calories_burned || 0;
        if (totalCalories >= 0) {
            const code = 'CALORIE_CRUSHER';
            const level = calculateLevel(code, totalCalories);
            updates.push({
                user_id: userId,
                achievement_code: code,
                current_value: Math.floor(totalCalories),
                current_level: level,
                updated_at: new Date().toISOString()
            });
        }

        // --- PROFILE_ARCHITECT ---
        // Check if avatar, bio, full_name, goal are set
        let profileScore = 0;
        if (profile.avatar_url) profileScore++;
        if (profile.bio) profileScore++;
        if (profile.full_name) profileScore++;
        if (profile.fitness_goal) profileScore++;
        // Target is 1 (completed) if generic, or maybe we define "complete" as having all
        // The tier says target: 1. Let's assume if score >= 3 it's done. 
        // Or simplification: if avatar is there, give it.
        const isProfileComplete = profile.avatar_url && profile.full_name; // simplified
        if (isProfileComplete) {
            const code = 'PROFILE_ARCHITECT';
            updates.push({
                user_id: userId,
                achievement_code: code,
                current_value: 1,
                current_level: 1,
                updated_at: new Date().toISOString()
            });
        }

        // --- ON_THE_SCALE ---
        // Need to fetch history count
        // We'll fetch last 30 days weight history and count it
        const weightHistory = await api.getWeightHistory(90); // 90 days
        const weightCount = weightHistory.length;
        if (weightCount >= 0) {
            const code = 'ON_THE_SCALE';
            const level = calculateLevel(code, weightCount);
            updates.push({
                user_id: userId,
                achievement_code: code,
                current_value: weightCount,
                current_level: level,
                updated_at: new Date().toISOString()
            });
        }

        // --- Perform Upserts ---
        for (const update of updates) {
            // We check if it exists to preserve 'unlocked_at' if level didn't change
            // But supabase upsert handles this if we exclude unlocked_at from update?
            // Actually, if level increases, we want to set 'unlocked_at'.
            // If level is same, we verified we don't overwrite 'unlocked_at' with null.

            // Check existing
            const { data: existing } = await supabase
                .from('user_achievements')
                .select('*')
                .eq('user_id', userId)
                .eq('achievement_code', update.achievement_code)
                .maybeSingle();

            let unlockedAt = existing?.unlocked_at;
            if (update.current_level > (existing?.current_level || 0)) {
                unlockedAt = new Date().toISOString();
            }

            const payload = {
                ...update,
                unlocked_at: unlockedAt
            };

            const { error } = await supabase
                .from('user_achievements')
                .upsert(payload, { onConflict: 'user_id, achievement_code' });

            if (error) console.error("Error syncing achievement:", update.achievement_code, error);
        }

        console.log("Achievement sync complete.");

    } catch (error) {
        console.error("Achievement sync failed:", error);
    }
};
