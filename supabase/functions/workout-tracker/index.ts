
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Workout Tracker: Function Loaded");

// --- Types ---
interface ExerciseLog {
    exercise_id: string
    reps_completed?: number
    duration_completed?: number
    weight_used?: number
    is_per_side?: boolean
    notes?: string
    status?: string
}

interface WorkoutSessionLog {
    session_id: string
    routine_id: string
    started_at: string
    completed_at: string
    total_duration: number
    total_calories_burned: number
    notes?: string
    exercises: ExerciseLog[]
    focus_areas_summary?: { [key: string]: number }
}

// --- Helpers ---
const getSupabaseClient = (req: Request) => {
    return createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
            global: {
                headers: { Authorization: req.headers.get('Authorization')! },
            },
        }
    )
}

const getAdminClient = () => {
    return createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )
}

// --- Handler ---
serve(async (req) => {
    // 0. CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = getSupabaseClient(req)
        const supabaseAdmin = getAdminClient()

        // 1. Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            console.error("Auth Error:", authError);
            throw new Error('Unauthorized')
        }

        const url = new URL(req.url)
        const action = url.searchParams.get('action') // 'start' | 'complete'

        console.log(`Workout Tracker: Action=${action}, User=${user.id}`);

        // 2. Action: Start Workout
        if (req.method === 'POST' && action === 'start') {
            const body = await req.json();
            const { routine_id } = body;

            if (!routine_id) throw new Error('Routine ID required')

            const { data: session, error } = await supabaseAdmin
                .from('workout_sessions')
                .insert({
                    user_id: user.id,
                    routine_id: routine_id,
                    started_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) {
                console.error("Start Workout Error:", error);
                throw error;
            }

            return new Response(
                JSON.stringify({ success: true, session_id: session.id }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Action: Complete Workout
        if (req.method === 'POST' && action === 'complete') {
            const body: WorkoutSessionLog = await req.json()

            // Check Duplicate Completion
            const { data: existingSession } = await supabaseAdmin
                .from('workout_sessions')
                .select('completed_at')
                .eq('id', body.session_id)
                .single();

            if (existingSession?.completed_at) {
                return new Response(
                    JSON.stringify({ success: true, message: 'Already completed' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // A. Update Session
            const { error: sessionError } = await supabaseAdmin
                .from('workout_sessions')
                .update({
                    completed_at: body.completed_at,
                    total_duration: body.total_duration,
                    total_calories_burned: body.total_calories_burned,
                    notes: body.notes
                })
                .eq('id', body.session_id)
                .eq('user_id', user.id)

            if (sessionError) throw sessionError

            // B. Anti-Abuse XP Calculation & Profile Updates
            const todayDate = new Date().toISOString().split('T')[0];
            const { data: dailySummary } = await supabaseAdmin
                .from('daily_workout_summary')
                .select('total_workouts')
                .eq('user_id', user.id)
                .eq('date', todayDate)
                .single();

            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('xp_multiplier, xp_balance, total_workouts_completed, total_calories_burned, total_time_taken')
                .eq('id', user.id)
                .single();

            const multiplier = profile?.xp_multiplier || 1.0;
            let xpReward = 0;
            let rewardLimitReached = false;

            if ((dailySummary?.total_workouts || 0) >= 2) {
                rewardLimitReached = true;
                xpReward = 0;
                console.log(`Daily reward limit reached for user ${user.id}`);
            } else {
                // Dynamic XP Calculation
                const baseXp = 100;
                const durationMinutes = Math.min(90, Math.floor(body.total_duration / 60));
                const timeBonus = durationMinutes * 5;
                const calorieBonus = Math.floor(body.total_calories_burned * 0.5);

                xpReward = Math.round((baseXp + timeBonus + calorieBonus) * multiplier);
                console.log(`Calculated XP: ${xpReward} (Base 100 + Time ${timeBonus} + Calorie ${calorieBonus}) * Multiplier ${multiplier}`);
            }

            // C. Log XP Transaction (only if reward > 0)
            if (xpReward > 0) {
                await supabaseAdmin.from('xp_transactions').insert({
                    user_id: user.id,
                    amount: xpReward,
                    type: 'workout',
                    description: `Completed workout session (${Math.round(body.total_duration / 60)}m)`
                });
            }

            // D. Streak history & Referral Logic
            await supabaseAdmin.from('user_streak_history').upsert({
                user_id: user.id,
                activity_date: todayDate,
                streak_type: 'fire'
            }, { onConflict: 'user_id, activity_date' });

            // Check if user hit a 7-day streak for referral bonus
            // Get last 7 days of activity
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

            const { data: streakHistory } = await supabaseAdmin
                .from('user_streak_history')
                .select('activity_date')
                .eq('user_id', user.id)
                .gte('activity_date', sevenDaysAgoStr);

            if (streakHistory && streakHistory.length >= 7) {
                // Check if this user was referred and bonus not yet paid
                const { data: referral } = await supabaseAdmin
                    .from('referrals')
                    .select('id, referrer_id')
                    .eq('referred_id', user.id)
                    .eq('status', 'joined')
                    .single();

                if (referral) {
                    // Update referral status
                    await supabaseAdmin.from('referrals').update({ status: 'streak_completed' }).eq('id', referral.id);

                    // Update referrer multiplier
                    const { data: referrer } = await supabaseAdmin.from('profiles').select('xp_multiplier').eq('id', referral.referrer_id).single();
                    if (referrer) {
                        const newMultiplier = Number(referrer.xp_multiplier) + 0.01;
                        await supabaseAdmin.from('profiles').update({ xp_multiplier: newMultiplier }).eq('id', referral.referrer_id);

                        // Log bonus for referrer
                        await supabaseAdmin.from('xp_transactions').insert({
                            user_id: referral.referrer_id,
                            amount: 5000, // Bonus XP
                            type: 'referral_bonus',
                            description: `Referral completed 7-day streak`
                        });
                    }
                }
            }

            // E. Exercise Completions
            if (body.exercises && body.exercises.length > 0) {
                const completions = body.exercises.map(ex => ({
                    session_id: body.session_id,
                    exercise_id: ex.exercise_id,
                    reps_completed: ex.reps_completed,
                    duration_completed: ex.duration_completed,
                    weight_used: ex.weight_used,
                    is_per_side: ex.is_per_side,
                    notes: ex.notes,
                    status: ex.status || 'completed'
                }));

                const { data: insertedCompletions, error: exError } = await supabaseAdmin
                    .from('exercise_completions').insert(completions).select('id, exercise_id');

                if (!exError && insertedCompletions) {
                    const exerciseIds = insertedCompletions.map((c: any) => c.exercise_id);
                    const { data: focusAreas } = await supabaseAdmin
                        .from('exercise_focus_areas').select('id, exercise_id, weightage')
                        .in('exercise_id', exerciseIds);

                    if (focusAreas) {
                        const trackingInserts: any[] = [];
                        insertedCompletions.forEach((c: any) => {
                            focusAreas
                                .filter((fa: any) => fa.exercise_id === c.exercise_id)
                                .forEach((fa: any) => {
                                    trackingInserts.push({
                                        exercise_completion_id: c.id,
                                        focus_area_id: fa.id,
                                        intensity_score: Math.min(10, Math.max(1, Math.round((fa.weightage || 0) / 10)))
                                    });
                                });
                        });
                        if (trackingInserts.length > 0) {
                            await supabaseAdmin.from('focus_area_tracking').insert(trackingInserts);
                        }
                    }
                }
            }

            // F. Daily Summary Upsert
            const { data: existingSummary } = await supabaseAdmin
                .from('daily_workout_summary').select('*')
                .eq('user_id', user.id).eq('date', todayDate).single();

            let mergedFocusAreas = body.focus_areas_summary || {};
            if (existingSummary?.focus_areas_summary) {
                mergedFocusAreas = { ...existingSummary.focus_areas_summary };
                Object.entries(body.focus_areas_summary || {}).forEach(([k, v]) => {
                    mergedFocusAreas[k] = mergedFocusAreas[k] ? (Number(mergedFocusAreas[k]) + Number(v)) / 2 : v;
                });
            }

            await supabaseAdmin.from('daily_workout_summary').upsert({
                id: existingSummary?.id,
                user_id: user.id,
                date: todayDate,
                total_calories_burned: (existingSummary?.total_calories_burned || 0) + body.total_calories_burned,
                total_workouts: (existingSummary?.total_workouts || 0) + 1,
                total_duration: (existingSummary?.total_duration || 0) + body.total_duration,
                focus_areas_summary: mergedFocusAreas
            });

            // G. Final Profile Updates (XP + Stats)
            if (profile) {
                await supabaseAdmin.from('profiles').update({
                    xp_balance: (profile.xp_balance || 0) + xpReward,
                    total_workouts_completed: (profile.total_workouts_completed || 0) + 1,
                    total_calories_burned: (profile.total_calories_burned || 0) + Math.round(body.total_calories_burned),
                    total_time_taken: (profile.total_time_taken || 0) + Math.round(body.total_duration / 60)
                }).eq('id', user.id);
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    message: rewardLimitReached ? 'Workout logged (Daily reward limit reached)' : 'Workout logged and XP earned',
                    xp_earned: xpReward
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        throw new Error(`Method or Action not supported: ${req.method} ${action}`)

    } catch (error) {
        console.error("Function Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
