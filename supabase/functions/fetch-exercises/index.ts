
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createSupabaseClient, createServiceClient } from "../_shared/auth-utils.ts"
import { corsHeaders } from "../_shared/cors.ts"

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

        // 2. Use Admin Client for Data Fetching
        const supabaseAdmin = createServiceClient()
        const { search, filters } = await req.json()

        // 3. Fetch all exercises
        const { data: allExercises, error } = await supabaseAdmin
            .from("exercises")
            .select(`
                id,
                name,
                image_url_male,
                image_url_female,
                gif_url,
                exercise_type,
                place,
                equipments,
                exercise_focus_areas (
                    area,
                    weightage
                ),
                exercise_mistakes (
                    title,
                    subtitle
                ),
                exercise_tips (
                    tip
                ),
                exercise_animations (
                    gender,
                    frame_urls,
                    frame_count
                )
            `)

        if (error) {
            console.error("Error fetching exercises:", error)
            throw error
        }

        let filteredExercises = allExercises || []

        // 4. Text Search
        if (search && search.trim() !== "") {
            const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
            const query = normalize(search);

            filteredExercises = filteredExercises.filter((ex: any) =>
                normalize(ex.name).includes(query)
            )
        }

        // 5. Filters
        if (filters) {
            // Focus Area Filter
            if (filters.focusArea && filters.focusArea.length > 0) {
                filteredExercises = filteredExercises.filter((ex: any) => {
                    if (!ex.exercise_focus_areas) return false
                    return ex.exercise_focus_areas.some((fa: any) =>
                        filters.focusArea.includes(fa.area)
                    )
                })
            }

            // Equipment Filter
            if (filters.equipment && filters.equipment.length > 0) {
                filteredExercises = filteredExercises.filter((ex: any) => {
                    if (!ex.equipments) return false
                    return ex.equipments.some((eq: string) =>
                        filters.equipment.includes(eq)
                    )
                })
            }

            // Type Filter
            if (filters.type && filters.type.length > 0) {
                filteredExercises = filteredExercises.filter((ex: any) =>
                    filters.type.includes(ex.exercise_type)
                )
            }
        }

        return new Response(JSON.stringify({ exercises: filteredExercises }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        })

    } catch (error) {
        console.error("Fetch Exercises Error:", error)
        return new Response(JSON.stringify({ error: error.message, details: error }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        })
    }
})
