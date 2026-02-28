
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

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

            // Fetch Routine Details (for Activity Feed)
            let routineName = 'Workout';
            let routineImage = null;
            const { data: routineData } = await supabaseAdmin
                .from('workout_routines')
                .select('name, image_url')
                .eq('id', body.routine_id)
                .single();

            if (routineData) {
                routineName = routineData.name || 'Workout';
                routineImage = routineData.image_url;
            }

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

            // B. Log to User Streak History (Fire)
            const todayDate = new Date().toISOString().split('T')[0];
            await supabaseAdmin.from('user_streak_history').upsert({
                user_id: user.id,
                activity_date: todayDate,
                streak_type: 'fire'
            }, { onConflict: 'user_id, activity_date' });

            // C. (Recalculate Numeric Streak removed - using dynamic calculation on read)
            // D. (Update Workout Streaks Table removed - deprecated)

            // E. Activity Feed & Exercises
            // 1. Activity
            await supabaseAdmin.from('activities').insert({
                user_id: user.id,
                type: 'workout_completed',
                data: {
                    session_id: body.session_id,
                    routine_id: body.routine_id,
                    routine_name: routineName,
                    routine_image: routineImage,
                    completed_at: body.completed_at,
                    duration: body.total_duration,
                    calories: body.total_calories_burned
                }
            });

            // 2. Exercise Completions
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
                    .from('exercise_completions')
                    .insert(completions)
                    .select('id, exercise_id');

                if (!exError && insertedCompletions) {
                    // Focus Area Tracking
                    const exerciseIds = insertedCompletions.map(c => c.exercise_id);
                    const { data: focusAreas } = await supabaseAdmin
                        .from('exercise_focus_areas')
                        .select('id, exercise_id, weightage')
                        .in('exercise_id', exerciseIds);

                    if (focusAreas) {
                        const trackingInserts: any[] = [];
                        insertedCompletions.forEach(c => {
                            const relevant = focusAreas.filter(fa => fa.exercise_id === c.exercise_id);
                            relevant.forEach(fa => {
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
                .from('daily_workout_summary')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', todayDate)
                .single();

            let mergedFocusAreas = body.focus_areas_summary || {};
            if (existingSummary?.focus_areas_summary) {
                // Simple merge logic
                const existing = existingSummary.focus_areas_summary;
                mergedFocusAreas = { ...existing };
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

            // G. Update Profile
            const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single();
            if (profile) {
                await supabaseAdmin.from('profiles').update({
                    total_workouts_completed: (profile.total_workouts_completed || 0) + 1,
                    total_calories_burned: (profile.total_calories_burned || 0) + Math.round(body.total_calories_burned),
                    total_time_taken: (profile.total_time_taken || 0) + Math.round(body.total_duration / 60)
                }).eq('id', user.id);
            }

            return new Response(
                JSON.stringify({ success: true, message: 'Workout logged and streak updated' }),
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
