import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createSupabaseClient, createServiceClient } from "../_shared/auth-utils.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAuth = createSupabaseClient(req)
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

        if (authError || !user) {
            console.error("Auth Fail:", authError)
            throw new Error('Unauthorized')
        }

        // Use Admin for Data
        const supabaseAdmin = createServiceClient()

        const url = new URL(req.url)
        const routePattern = new URLPattern({ pathname: '/workout-manager/:id' })
        const match = routePattern.exec(url)
        const routineId = match?.pathname.groups.id || url.searchParams.get('id')


        // GET /routines (All or Sync)
        if (req.method === 'GET' && !routineId) {
            const action = url.searchParams.get('action')

            // Fetch ALL available exercises if requested (for cleaner UI selection)
            if (action === 'exercises') {
                const { data: exercises, error } = await supabaseAdmin
                    .from('exercises')
                    .select('id, name, exercise_type, equipment:equipments, image_url:gif_url')
                    .order('name')
                
                if (error) throw error
                return new Response(JSON.stringify({ exercises }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            if (action === 'sync') {
                // Sync Mode: Fetch Everything deeply
                // Filter by created_by = NULL (system), created_by = user.id, or is_explore = true
                const { data: routines, error } = await supabaseAdmin
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
                    .or(`created_by.is.null,created_by.eq.${user.id},is_explore.is.true`)

                if (error) {
                    console.error("Sync Routines Error:", error)
                    throw error
                }

                return new Response(
                    JSON.stringify({ routines }),
                    {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 200,
                    }
                )
            }

            // Normal List Mode (Summary)
            const { data: routines, error } = await supabaseAdmin
                .from('workout_routines')
                .select(`
                  id, 
                  name, 
                  created_at, 
                  image_url, 
                  image_url_male, 
                  image_url_female, 
                  level, 
                  category, 
                  place,
                  created_by,
                  is_explore,
                  routine_exercises (count)
                `)
                .or(`created_by.is.null,created_by.eq.${user.id},is_explore.is.true`)
                .order('created_at', { ascending: false })

            if (error) {
                console.error("Fetch Routines Error:", error)
                throw error
            }

            return new Response(
                JSON.stringify({ routines }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

        // POST /routines (Create Routine)
        if (req.method === 'POST') {
             const body = await req.json()
             const { name, category, level, place, exercises } = body // exercises: [{id, reps, sets, order}]

             if (!name || !exercises || exercises.length === 0) {
                 throw new Error("Missing name or exercises")
             }

             // 1. Create Routine Header
             const { data: routine, error: routineError } = await supabaseAdmin
                .from('workout_routines')
                .insert({
                    name,
                    category: category || 'Custom',
                    level: level || 'Intermediate',
                    place: place || 'Home',
                    created_by: user.id,
                    is_explore: false // Default private
                })
                .select()
                .single()

             if (routineError) throw routineError

             // 2. Insert Exercises
             const exerciseRows = exercises.map((ex: any, index: number) => ({
                 routine_id: routine.id,
                 exercise_id: ex.id,
                 order_position: index + 1,
                 reps: ex.reps || 10,
                 sets: ex.sets || 3,
                 // other potential fields like duration
             }))

             const { error: exercisesError } = await supabaseAdmin
                .from('routine_exercises')
                .insert(exerciseRows)

             if (exercisesError) {
                 // Cleanup if failed? For now just throw
                 console.error("Failed to insert exercises", exercisesError)
                 throw exercisesError
             }

             return new Response(
                JSON.stringify({ success: true, routine }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
             )
        }

        // GET /routines/:id (Details) - Ensure access rights
        if (req.method === 'GET' && routineId) {
            // Check if user has access (handled by RLS if using client, but we use Admin)
            // So we must manually check or filter.
            // Simplified: Fetch and check ownership/visibility
            const routinePromise = supabaseAdmin
                .from('workout_routines')
                .select('*')
                .eq('id', routineId)
                .single()

            const exercisesPromise = supabaseAdmin
                .from('routine_exercises')
                .select(`
                *,
                exercises (
                    id, name, gif_url, image_url_male, image_url_female, equipments, is_per_side, instructions, exercise_type, avg_time_per_rep, place,
                    exercise_tips (tip),
                    exercise_mistakes (title, subtitle),
                    exercise_focus_areas (area, weightage),
                    exercise_animations (gender, frame_urls, frame_count)
                )
            `)
                .eq('routine_id', routineId)
                .order('order_position')

            const [routineResult, exercisesResult] = await Promise.all([routinePromise, exercisesPromise])

            if (routineResult.error) throw routineResult.error
            
            // Access Check
            const r = routineResult.data
            const hasAccess = !r.created_by || r.created_by === user.id || r.is_explore === true
            if (!hasAccess) {
                throw new Error("Unauthorized access to private routine")
            }

            if (exercisesResult.error) throw exercisesResult.error

            return new Response(
                JSON.stringify({
                    routine: routineResult.data,
                    exercises: exercisesResult.data
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

        // GET /exercises/:id (Single Exercise Details for Fallback)
        if (req.method === 'GET' && (url.pathname.includes('/exercises') || url.searchParams.get('exerciseId'))) {
            const exerciseId = url.pathname.split('/exercises/')[1] || url.searchParams.get('exerciseId')

            if (!exerciseId) throw new Error('Exercise ID required')

            const { data: exercise, error } = await supabaseAdmin
                .from('exercises')
                .select(`
                    id, name, gif_url, image_url_male, image_url_female, equipments, is_per_side, instructions, exercise_type, avg_time_per_rep, place,
                    exercise_tips (tip),
                    exercise_mistakes (title, subtitle),
                    exercise_focus_areas (area, weightage),
                    exercise_animations (gender, frame_urls, frame_count)
                `)
                .eq('id', exerciseId)
                .single()

            if (error) throw error

            return new Response(
                JSON.stringify({ exercise }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

        throw new Error('Not Found')

    } catch (error) {
        console.error("Workout Manager Error:", error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
