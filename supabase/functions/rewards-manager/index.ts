import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createSupabaseClient, createServiceClient } from "../_shared/auth-utils.ts"

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { method } = req
        const body = await req.json().catch(() => ({}))
        const { action } = body

        // 1. Authenticate User (even if verify-jwt is off, we can still check token)
        const supabaseAuth = createSupabaseClient(req)
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

        if (authError || !user) {
            console.error('Auth Error:', authError)
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        // 2. Use Service Role for Database Operations (Bypass RLS)
        const supabaseAdmin = createServiceClient()

        // --- ACTIONS ---

        // Action: update_wallet_address
        if (action === 'update_wallet_address') {
            const { wallet_address } = body
            if (!wallet_address) {
                return new Response(
                    JSON.stringify({ error: 'wallet_address is required' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                )
            }

            console.log(`Updating wallet address for user ${user.id} to ${wallet_address}`)

            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ wallet_address })
                .eq('id', user.id)

            if (updateError) {
                console.error('Update Error:', updateError)
                return new Response(
                    JSON.stringify({ error: updateError.message }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                )
            }

            return new Response(
                JSON.stringify({ success: true, wallet_address }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // Action: redeem_referral
        if (action === 'redeem_referral') {
            const { code } = body
            if (!code) {
                return new Response(
                    JSON.stringify({ error: 'Referral code is required' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                )
            }

            const cleanCode = code.trim().toUpperCase()

            // 1. Find the referrer
            const { data: referrer, error: findError } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('invite_code', cleanCode)
                .single()

            if (findError || !referrer) {
                return new Response(
                    JSON.stringify({ error: 'Invalid referral code' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                )
            }

            if (referrer.id === user.id) {
                return new Response(
                    JSON.stringify({ error: 'You cannot refer yourself' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                )
            }

            // 2. Check if user already reached out via referral
            const { data: existingReferral } = await supabaseAdmin
                .from('referrals')
                .select('id')
                .eq('referred_id', user.id)
                .single()

            if (existingReferral) {
                return new Response(
                    JSON.stringify({ error: 'You have already been referred by someone else' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                )
            }

            // 3. Create referral record
            const { error: insertError } = await supabaseAdmin
                .from('referrals')
                .insert({
                    referrer_id: referrer.id,
                    referred_id: user.id,
                    status: 'joined'
                })

            if (insertError) {
                console.error('Insert Referral Error:', insertError)
                return new Response(
                    JSON.stringify({ error: 'Could not redeem referral code' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
                )
            }

            return new Response(
                JSON.stringify({ success: true, message: 'Referral code redeemed!' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // Default: Action not found
        return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )

    } catch (e) {
        console.error('Unexpected Error:', e)
        return new Response(
            JSON.stringify({ error: 'An unexpected error occurred' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
