
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createSupabaseClient, createServiceClient } from "../_shared/auth-utils.ts"
import { corsHeaders } from "../_shared/cors.ts"

type Achievement = {
    code: string
    tiers: { level: number; target: number }[]
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Authenticate User
        const supabaseAuth = createSupabaseClient(req)
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

        if (authError || !user) {
            console.error("Auth Fail:", authError)
            return new Response(
                JSON.stringify({ error: 'Unauthorized', details: authError }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 401,
                }
            )
        }

        const userId = user.id
        const supabaseAdmin = createServiceClient()

        // 2. Fetch necessary data
        // Fetch definitions
        const { data: achievements, error: achError } = await supabaseAdmin
            .from('achievements')
            .select('*')

        if (achError || !achievements) {
            throw new Error("Failed to fetch achievements definitions")
        }

        // Fetch User Profile
        const { data: profile, error: profError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (profError) throw profError

        // Fetch current streak (from separate table or logic? client passed it in original code)
        // Ideally we fetch it from source of truth.
        // Assuming there is a 'user_streaks' table or similar? 
        // In `achievementSync.ts` client logic, it got streak from `api.getProfile()` which calls `profile-manager`.
        // Let's call `profile-manager` logic here or just query the streaks table.
        // Let's assume there is a `user_streaks` table.
        const { data: streakData } = await supabaseAdmin
            .from('user_streaks')
            .select('current_streak')
            .eq('user_id', userId)
            .single()

        const streak = streakData?.current_streak || 0

        // Fetch weight history count
        // In original code: `api.getWeightHistory(90)`
        const { count: weightCount } = await supabaseAdmin
            .from('weight_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('recorded_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

        // 3. Logic
        // Defined in client code: calculateLevel helper
        const calculateLevel = (achievementCode: string, value: number) => {
            const achievement = achievements.find((a: any) => a.code === achievementCode);
            if (!achievement) return 0;

            const tiers = achievement.tiers as any[];
            let level = 0;
            for (const tier of tiers) {
                if (value >= tier.target) {
                    level = Math.max(level, tier.level);
                }
            }
            return level;
        };

        const updates: any[] = [];

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
        const isProfileComplete = profile.avatar_url && profile.full_name;
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
        const wCount = weightCount || 0;
        if (wCount >= 0) {
            const code = 'ON_THE_SCALE';
            const level = calculateLevel(code, wCount);
            updates.push({
                user_id: userId,
                achievement_code: code,
                current_value: wCount,
                current_level: level,
                updated_at: new Date().toISOString()
            });
        }

        // 4. Perform Upserts
        const results = []
        for (const update of updates) {
            // Check existing
            const { data: existing } = await supabaseAdmin
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

            const { error: upsertError } = await supabaseAdmin
                .from('user_achievements')
                .upsert(payload, { onConflict: 'user_id, achievement_code' });

            if (upsertError) {
                console.error("Error syncing achievement:", update.achievement_code, upsertError);
            } else {
                results.push({ code: update.achievement_code, status: 'synced' })
            }
        }

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        })

    } catch (error) {
        console.error("Sync Achievements Error:", error)
        return new Response(JSON.stringify({ error: error.message, details: error }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        })
    }
})
