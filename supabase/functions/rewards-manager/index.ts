import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createSupabaseClient, createServiceClient } from "../_shared/auth-utils.ts"
import nacl from "https://esm.sh/tweetnacl@1.0.3"
import { decode as decodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts"
import { PublicKey } from "https://esm.sh/@solana/web3.js@1.87.6"

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
            const { wallet_address, message, signature } = body

            // Handle wallet removal
            if (wallet_address === null) {
                console.log(`Removing wallet address for user ${user.id}`)
                const { error: updateError } = await supabaseAdmin
                    .from('profiles')
                    .update({ wallet_address: null })
                    .eq('id', user.id)

                if (updateError) {
                    return new Response(JSON.stringify({ error: updateError.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
                }
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
            }

            // Verify ownership for updates
            if (!wallet_address || !message || !signature) {
                return new Response(
                    JSON.stringify({ error: 'wallet_address, message, and signature are required for connection' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                )
            }

            try {
                // 1. Verify Message Content (prevents replay/hijack)
                // Message format: `Sign-in to StayFit Seeker: [userId] at [timestamp]`
                if (!message.includes(user.id)) {
                    throw new Error('Message does not match current user ID')
                }

                const parts = message.split(' at ')
                const timestamp = parseInt(parts[parts.length - 1])
                const now = Date.now()
                const fiveMinutes = 5 * 60 * 1000

                if (isNaN(timestamp) || Math.abs(now - timestamp) > fiveMinutes) {
                    throw new Error('Verification request expired or invalid timestamp')
                }

                // 2. Verify Cryptographic Signature
                const signatureUint8 = decodeBase64(signature)
                const messageUint8 = new TextEncoder().encode(message)
                const publicKeyUint8 = new PublicKey(wallet_address).toBytes()

                const isValid = nacl.sign.detached.verify(
                    messageUint8,
                    signatureUint8,
                    publicKeyUint8
                )

                if (!isValid) {
                    throw new Error('Invalid wallet signature')
                }

                console.log(`Verified wallet ownership for user ${user.id}: ${wallet_address}`)

                // 3. Update profile
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
            } catch (err: any) {
                console.error('Verification failed:', err.message)
                return new Response(
                    JSON.stringify({ error: err.message }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
                )
            }
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
