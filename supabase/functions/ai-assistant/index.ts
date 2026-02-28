import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createSupabaseClient } from "../_shared/auth-utils.ts"
import { RateLimiter } from "../_shared/rate-limit.ts"

// Initialize Rate Limiter: 5 requests per 60 seconds per user
const rateLimiter = new RateLimiter(5, 60);

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
// User specified model: gemini-2.5-flash-lite
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Authenticate User
        const supabase = createSupabaseClient(req)
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error("Auth Error:", authError)
            throw new Error('Unauthorized')
        }

        // 2. Rate Limit Check
        if (!rateLimiter.check(user.id)) {
            throw new Error('Rate limit exceeded. Please try again later.')
        }

        // 3. Parse Request
        const { message, enabledOptions = [] } = await req.json()

        if (!message) {
            throw new Error('Message is required')
        }

        // 4. Fetch Context Data (Server-Side)
        let context = "";
        if (enabledOptions.length > 0) {
            const [profile, weightHistory, workouts, focusAreas] = await Promise.all([
                supabase.from("profiles").select("*").single(),
                enabledOptions.includes("weight_history")
                    ? supabase
                        .from("weight_history")
                        .select("*")
                        .gte("recorded_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                        .order("recorded_at", { ascending: false })
                    : Promise.resolve({ data: [] }),
                enabledOptions.includes("recent_workouts")
                    ? supabase
                        .from("workout_sessions")
                        .select(`
                            id, routine_id, started_at, completed_at, total_duration, total_calories_burned, focus_areas_summary,
                            exercise_completions (
                                exercise_id, reps_completed, duration_completed, weight_used, status,
                                exercises ( name )
                            ),
                            workout_routines ( name )
                        `)
                        .gte("completed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                        .order("completed_at", { ascending: false })
                    : Promise.resolve({ data: [] }),
                enabledOptions.includes("focus_areas")
                    ? supabase
                        .from("focus_area_tracking")
                        .select(`
                            focus_area_id, intensity_score,
                            exercise_focus_areas ( area )
                        `)
                        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                    : Promise.resolve({ data: [] }),
            ]);

            if (profile.data) {
                context = formatUserContext(
                    profile.data,
                    weightHistory.data || [],
                    workouts.data || [],
                    focusAreas.data || [],
                    enabledOptions
                );
            }
        }

        // 5. Call Gemini API
        // Construct prompt with context + message
        const systemPrompt = `You are StayFit AI, a helpful and motivational fitness assistant.
        
        Use the following user context to provide personalized advice:
        ${context || 'No specific valid context provided.'}
        
        Keep responses concise, encouraging, and actionable.`;

        const payload = {
            contents: [
                {
                    parts: [
                        { text: systemPrompt },
                        { text: `User: ${message}` }
                    ]
                }
            ]
        };

        const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text()
            console.error("Gemini API Error:", errorText)
            throw new Error(`AI Service Error: ${geminiResponse.status}`)
        }

        const geminiData = await geminiResponse.json()
        const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response."

        return new Response(
            JSON.stringify({ text: aiText }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error("AI Assistant Error:", error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: error.message.includes('Unauthorized') ? 401 : error.message.includes('Rate limit') ? 429 : 400,
            }
        )
    }
})

// --- Helper: Format Context ---

const formatUserContext = (
    profile: any,
    weightHistory: any[],
    workouts: any[],
    focusAreas: any[],
    enabledOptions: string[]
) => {
    const context: string[] = [];

    if (enabledOptions.includes("basic_info")) {
        context.push(
            `User Profile:`,
            `- Name: ${profile.full_name}`,
            `- Current Weight: ${profile.weight} ${profile.weight_unit}`,
            `- Height: ${profile.height} ${profile.height_unit}`,
            `- Gender: ${profile.gender}`,
            `- Age: ${profile.date_of_birth
                ? Math.floor(
                    (new Date().getTime() -
                        new Date(profile.date_of_birth).getTime()) /
                    (1000 * 60 * 60 * 24 * 365.25)
                )
                : "Not specified"
            } years`
        );
    }

    if (enabledOptions.includes("fitness_profile")) {
        context.push(
            ``,
            `Fitness Profile:`,
            `- Fitness Goal: ${profile.fitness_goal}`,
            `- Workout Frequency: ${profile.workout_frequency} times per week`,
            `- Fitness Level: ${profile.fitness_level}`,
            `- Equipment Access: ${profile.equipment_access}`
        );
    }

    if (enabledOptions.includes("progress_stats")) {
        context.push(
            ``,
            `Progress Statistics:`,
            `- Total Workouts Completed: ${profile.total_workouts_completed || 0}`,
            `- Total Calories Burned: ${profile.total_calories_burned || 0}`
        );
    }

    if (enabledOptions.includes("weight_history")) {
        context.push(
            ``,
            `Weight History (Past Week):`,
            ...weightHistory.map(
                (w) =>
                    `- ${new Date(w.recorded_at).toLocaleDateString()}: ${w.weight} ${profile.weight_unit}`
            )
        );
    }

    if (enabledOptions.includes("recent_workouts")) {
        context.push(
            ``,
            `Recent Workouts:`,
            ...workouts.map(
                (w) =>
                    `- ${w.workout_routines?.name || 'Unknown'}: ${w.exercise_completions?.map((e: any) => e.exercises?.name).join(', ') || 'No exercises'} (${w.total_duration}s)`
            )
        );
    }

    if (enabledOptions.includes("focus_areas")) {
        context.push(
            ``,
            `Focus Area Intensity (Past Week):`,
            ...focusAreas.map(
                (fa) =>
                    `- ${fa.exercise_focus_areas?.area}: ${Math.round(parseFloat(fa.intensity_score) * 10)}%`
            )
        );
    }

    return context.join("\n");
};
