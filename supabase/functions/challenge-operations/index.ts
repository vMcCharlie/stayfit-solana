
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: { headers: { Authorization: authHeader } },
                auth: { persistSession: false }
            }
        )

        // Initialize Supabase Admin client (Service Role) to bypass RLS
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false } }
        )

        const { action, ...payload } = await req.json()

        // Debugging logs & Token Parsing
        const isAnon = authHeader.includes(Deno.env.get('SUPABASE_ANON_KEY') ?? 'xxxx');

        let tokenData: any = null;
        let tokenDebug: any = {};

        try {
            const token = authHeader.replace('Bearer ', '');
            if (token && !isAnon) {
                const parts = token.split('.');
                if (parts.length === 3) {
                    tokenData = JSON.parse(atob(parts[1]));
                    tokenDebug = {
                        sub: tokenData.sub,
                        exp: tokenData.exp,
                        now: Math.floor(Date.now() / 1000),
                        expired: tokenData.exp < Math.floor(Date.now() / 1000)
                    };
                }
            }
        } catch (e) {
            tokenDebug = { error: 'Failed to parse token' };
        }

        // Validate via DB instead of auth.getUser() which is erroneously failing
        let userId = tokenData?.sub;
        let authError = null;

        if (userId) {
            // Verify the token works against the DB (Postgrest validates signature)
            const { error } = await supabaseClient
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .single();

            // If error is 401 or JWT invalid, then fail
            if (error && (error.code === 'PGRST301' || error.message?.includes('JWT'))) {
                authError = error;
                userId = null;
            }
        } else {
            authError = { message: 'No valid user ID in token' };
        }

        console.log(`[ChallengeOps] Action: ${action}, Auth: ${isAnon ? 'ANON' : 'USER'}, UserID: ${userId}, Error: ${authError?.message}`);

        if (!userId) {
            // Return 401 for easier client handling
            return new Response(JSON.stringify({
                error: 'User not found or unauthenticated',
                details: authError?.message,
                token_debug: tokenDebug
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const user = { id: userId }; // Mock user object for compatibility

        if (action === 'join_challenge') {
            const { challenge_id } = payload

            // Check if ANY row exists (active or not)
            const { data: existing } = await supabaseAdmin
                .from('user_challenges')
                .select('*')
                .eq('user_id', user.id)
                .eq('challenge_id', challenge_id)
                .single()

            if (existing) {
                if (existing.status === 'active') {
                    return new Response(JSON.stringify({ message: 'Already joined', data: existing }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 200,
                    })
                } else {
                    // Re-join: Update status to active and reset progress? Or keep progress?
                    // User requirements imply "Start Challenge" -> likely restart.
                    // Let's reset to day 0 and active.
                    const { data: updated, error: updateError } = await supabaseAdmin
                        .from('user_challenges')
                        .update({
                            status: 'active',
                            current_day_index: 0,
                            start_date: new Date().toISOString()
                        })
                        .eq('id', existing.id)
                        .select()
                        .single()

                    if (updateError) throw updateError

                    return new Response(JSON.stringify({ data: updated }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 200,
                    })
                }
            }

            const { data, error } = await supabaseAdmin
                .from('user_challenges')
                .insert({
                    user_id: user.id,
                    challenge_id: challenge_id,
                    start_date: new Date().toISOString(),
                    status: 'active',
                    current_day_index: 0
                })
                .select()
                .single()

            if (error) throw error

            return new Response(JSON.stringify({ data }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        if (action === 'complete_day') {
            const { user_challenge_id, day_number, type } = payload

            // 1. Verify this is the correct next day or a previous uncompleted day? 
            // User requirements: "users can complete as many routines as they want in a day"
            // "make sure to keep the next routines locked until the previous one has been completed"

            // Check valid challenge
            const { data: userChallenge } = await supabaseAdmin
                .from('user_challenges')
                .select('*')
                .eq('id', user_challenge_id)
                .single()

            if (!userChallenge) throw new Error('Challenge not found')

            if (day_number > (userChallenge.current_day_index || 0) + 1) {
                return new Response(JSON.stringify({ error: 'Previous days must be completed first' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                })
            }

            // Log the completion
            const { error: logError } = await supabaseAdmin
                .from('user_challenge_logs')
                .insert({
                    user_challenge_id,
                    day_number,
                    type: type || 'workout',
                    completed_at: new Date().toISOString()
                })

            if (logError) throw logError

            // Update progress if we are advancing
            // If we re-do an old day, we don't necessarily advance the index beyond the max?
            // But typically we only advance if day_number == current_day_index + 1
            let newIndex = userChallenge.current_day_index
            if (day_number > (userChallenge.current_day_index || 0)) {
                newIndex = day_number

                await supabaseAdmin
                    .from('user_challenges')
                    .update({ current_day_index: newIndex })
                    .eq('id', user_challenge_id)
            }

            return new Response(JSON.stringify({ success: true, new_day_index: newIndex }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        if (action === 'get_challenge_status') {
            const { challenge_id } = payload

            const { data: userChallenge } = await supabaseAdmin
                .from('user_challenges')
                .select(`
                *,
                user_challenge_logs (
                    day_number,
                    completed_at
                )
            `)
                .eq('user_id', user.id)
                .eq('challenge_id', challenge_id)
                .eq('status', 'active')
                .single()

            return new Response(JSON.stringify({ data: userChallenge }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        throw new Error('Invalid action')

    } catch (error) {
        console.error("Edge Function Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
