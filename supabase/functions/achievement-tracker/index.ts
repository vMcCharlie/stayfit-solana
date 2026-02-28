
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { type, user_id, data } = await req.json()

        if (!user_id || !type) {
            throw new Error('Missing user_id or type')
        }

        // Logic to handle different events
        // For now, this is a skeleton. We can expand this.
        // Ideally, we'd have a helper to check each achievement category relevant to the event.

        if (type === 'WORKOUT_COMPLETED') {
            const workout = data.workout;
            // Check "Club 100", "Sweat Equity", "Calorie Crusher"
            // Check "Early Bird", "Night Owl" (Consistency)
            // Check "Specific Exercises" if data details exercises

            // This is where we would query user_achievements, update current_value, check against tiers, and update/notify.
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Achievement progress processed' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
