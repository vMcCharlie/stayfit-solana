import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createSupabaseClient, createServiceClient } from "../_shared/auth-utils.ts"

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Authenticate User
        const supabaseAuth = createSupabaseClient(req)
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

        if (authError || !user) {
            console.error('Auth Error:', authError)
            throw new Error('Unauthorized')
        }

        // 2. Use Service Role for Database Operations
        const supabaseAdmin = createServiceClient()

        const { method } = req
        const url = new URL(req.url)
        const action = url.searchParams.get('action')

        // GET: Fetch Activity Feed or Search Users
        if (method === 'GET') {
            // Search Users
            if (action === 'search') {
                const query = url.searchParams.get('query')
                if (!query) throw new Error('Query parameter is required')

                const { data, error } = await supabaseAdmin
                    .from("profiles")
                    .select("id, username, full_name, avatar_url, avatar_thumbnail_url")
                    .ilike("username", `%${query.trim()}%`)
                    .limit(20)

                if (error) throw error

                return new Response(
                    JSON.stringify({ results: data }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // Check Follow Status
            if (action === 'check_follow') {
                const targetId = url.searchParams.get('target_id')
                if (!targetId) throw new Error('Target ID required')

                const { data, error } = await supabaseAdmin
                    .from("follows")
                    .select("id")
                    .eq("follower_id", user.id)
                    .eq("following_id", targetId)
                    .maybeSingle()

                if (error) throw error

                return new Response(
                    JSON.stringify({ is_following: !!data }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // Get list of followed users (for filter dropdown)
            if (action === 'get_following') {
                const { data: following, error: followingError } = await supabaseAdmin
                    .from('follows')
                    .select(`
                        following_id,
                        profiles!follows_following_id_fkey (
                            id,
                            username,
                            full_name,
                            avatar_url,
                            avatar_thumbnail_url
                        )
                    `)
                    .eq('follower_id', user.id)

                if (followingError) throw followingError

                const users = following.map(f => f.profiles).filter(Boolean)

                return new Response(
                    JSON.stringify({ following: users }),
                    {
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'application/json',
                            'Cache-Control': 'private, max-age=300' // Cache for 5 minutes
                        }
                    }
                )
            }

            // Fetch Public Profile
            if (action === 'get_profile') {
                const targetId = url.searchParams.get('target_id')
                if (!targetId) throw new Error('Target ID required')

                // Fetch Profile
                const { data: profile, error: profileError } = await supabaseAdmin
                    .from("profiles")
                    .select("username, full_name, bio, avatar_url, avatar_thumbnail_url, subscription, total_calories_burned, total_workouts_completed, total_time_taken")
                    .eq("id", targetId)
                    .maybeSingle()

                if (profileError) throw profileError
                if (!profile) throw new Error("User not found")

                // Fetch Social Links
                const { data: socialLinks, error: socialError } = await supabaseAdmin
                    .from("social_links")
                    .select("id, url")
                    .eq("profile_id", targetId)

                if (socialError) throw socialError

                // Fetch Focus Area Stats (Aggregated)
                const { data: focusData, error: focusError } = await supabaseAdmin
                    .from('focus_area_tracking')
                    .select(`
                        intensity_score,
                        exercise_completions!inner (
                            session_id,
                            workout_sessions!inner (user_id)
                        ),
                        exercise_focus_areas (
                            area,
                            category
                        )
                    `)
                    .eq('exercise_completions.workout_sessions.user_id', targetId)

                let focus_areas: any[] = []
                if (!focusError && focusData) {
                    const statsMap: Record<string, { times: number, intensity: number }> = {}
                    focusData.forEach((item: any) => {
                        const rawFa = item.exercise_focus_areas;
                        const areas = Array.isArray(rawFa) ? rawFa : (rawFa ? [rawFa] : []);

                        areas.forEach((fa: any) => {
                            const group = fa.category || fa.area || 'Other'
                            if (!statsMap[group]) statsMap[group] = { times: 0, intensity: 0 }
                            statsMap[group].times++
                            statsMap[group].intensity += (item.intensity_score || 0)
                        })
                    })
                    focus_areas = Object.entries(statsMap).map(([area, stat]) => ({
                        area,
                        times_targeted: stat.times,
                        avg_intensity: stat.times > 0 ? stat.intensity / stat.times : 0
                    }))
                }

                // Fetch Daily Workout Summary (for Calendar Heatmap - last 365 days)
                const oneYearAgo = new Date();
                oneYearAgo.setDate(oneYearAgo.getDate() - 365);

                const { data: calendarData, error: calendarError } = await supabaseAdmin
                    .from('daily_workout_summary')
                    .select('date, total_calories_burned, total_duration')
                    .eq('user_id', targetId)
                    .gte('date', oneYearAgo.toISOString().split('T')[0])

                return new Response(
                    JSON.stringify({
                        profile: {
                            ...profile,
                            social_links: socialLinks || [],
                            focus_areas,
                            calendar_data: calendarData || []
                        }
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // Default: Fetch Feed with pagination and filtering
            const limit = parseInt(url.searchParams.get('limit') || '10')
            const offset = parseInt(url.searchParams.get('offset') || '0')
            const filterType = url.searchParams.get('type') // Optional: filter by activity type
            const filterUserId = url.searchParams.get('user_id') // Optional: filter by specific user

            // Fetch following IDs first
            const { data: following, error: followingError } = await supabaseAdmin
                .from('follows')
                .select('following_id')
                .eq('follower_id', user.id)

            if (followingError) throw followingError

            let followingIds = following.map(f => f.following_id)

            // If following no one, return empty
            if (followingIds.length === 0) {
                return new Response(
                    JSON.stringify({ activities: [] }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // If filtering by specific user, validate they're in following list
            if (filterUserId) {
                if (!followingIds.includes(filterUserId)) {
                    return new Response(
                        JSON.stringify({ activities: [] }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                }
                followingIds = [filterUserId]
            }

            // Build query
            let query = supabaseAdmin
                .from('activities')
                .select(`
                    *,
                    profiles (
                        username,
                        full_name,
                        avatar_url,
                        avatar_thumbnail_url
                    )
                `)
                .in('user_id', followingIds)

            // Apply type filter if specified
            if (filterType && filterType !== 'all') {
                query = query.eq('type', filterType)
            }

            const { data: activities, error: activityError } = await query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)

            if (activityError) throw activityError

            return new Response(
                JSON.stringify({ activities }),
                {
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                        'Cache-Control': 'private, max-age=30' // Cache for 30 seconds
                    }
                }
            )
        }

        // POST: Follow/Unfollow
        if (method === 'POST') {
            if (action === 'follow') {
                const { target_id } = await req.json()
                if (!target_id) throw new Error('Target ID required')

                if (target_id === user.id) throw new Error('Cannot follow yourself')

                // Check if already following
                const { data: existing, error: checkError } = await supabaseAdmin
                    .from('follows')
                    .select('id')
                    .eq('follower_id', user.id)
                    .eq('following_id', target_id)
                    .maybeSingle()

                if (checkError) throw checkError

                if (existing) {
                    // Already following, maybe do nothing or return success
                    return new Response(
                        JSON.stringify({ success: true, message: 'Already following' }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                }

                const { error } = await supabaseAdmin
                    .from('follows')
                    .insert({
                        follower_id: user.id,
                        following_id: target_id
                    })

                if (error) throw error

                return new Response(
                    JSON.stringify({ success: true }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            if (action === 'unfollow') {
                const { target_id } = await req.json()
                if (!target_id) throw new Error('Target ID required')

                const { error } = await supabaseAdmin
                    .from('follows')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', target_id)

                if (error) throw error

                return new Response(
                    JSON.stringify({ success: true }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
        }

        throw new Error('Method not supported')

    } catch (error) {
        console.error("Activity Feed Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
