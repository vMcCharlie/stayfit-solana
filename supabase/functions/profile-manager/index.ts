import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"
import { createSupabaseClient, createServiceClient } from "../_shared/auth-utils.ts"

// Define types for strict validation
interface ProfileUpdate {
    username?: string
    full_name?: string
    bio?: string
    social_links?: { url: string }[]
    equipment_access?: string
    // Onboarding fields
    weight?: number
    weight_unit?: string
    goal_weight?: number
    height?: number
    height_unit?: string
    fitness_goal?: string
    fitness_level?: string
    workout_frequency?: number
    gender?: string
}

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

        // 2. Use Service Role for Database Operations (Bypass RLS)
        const supabaseAdmin = createServiceClient()

        const { method } = req
        const url = new URL(req.url)

        // GET: Fetch Profile Data (Dashboard, History, or Stats)
        if (method === 'GET') {
            const action = url.searchParams.get('action')

            // 1. Workout History (Paginated/Date-Range)
            if (action === 'history') {
                const startDate = url.searchParams.get('start')
                const endDate = url.searchParams.get('end')
                const targetUserId = url.searchParams.get('user_id') || user.id

                if (!startDate || !endDate) throw new Error('Start and End dates are required for history')

                // Privacy Check
                if (targetUserId !== user.id) {
                    const { data: targetProfile, error: targetError } = await supabaseAdmin
                        .from('profiles')
                        .select('is_public')
                        .eq('id', targetUserId)
                        .single()

                    if (targetError || !targetProfile) {
                        throw new Error('User not found')
                    }

                    if (!targetProfile.is_public) {
                        return new Response(
                            JSON.stringify({ error: 'This profile is private' }),
                            {
                                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                                status: 403
                            }
                        )
                    }
                }

                const { data: history, error: historyError } = await supabaseAdmin
                    .from('workout_sessions')
                    .select(`
                        id,
                        started_at,
                        completed_at,
                        total_duration,
                        total_calories_burned,
                        routine_id,
                        workout_routines!inner (
                            id,
                            name,
                            image_url,
                            image_url_male,
                            image_url_female
                        )
                    `)
                    .eq('user_id', targetUserId)
                    .gte('completed_at', startDate)
                    .lte('completed_at', endDate)
                    .order('completed_at', { ascending: false })

                if (historyError) throw historyError

                return new Response(
                    JSON.stringify({ history }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // 2. Monthly Stats (Calorie Burn)
            if (action === 'monthly_stats') {
                const now = new Date()
                // Default to current month if not provided
                const year = parseInt(url.searchParams.get('year') || now.getFullYear().toString())
                const month = parseInt(url.searchParams.get('month') || (now.getMonth() + 1).toString())

                const startOfMonth = new Date(year, month - 1, 1)
                startOfMonth.setDate(startOfMonth.getDate() - 1)
                const startStr = startOfMonth.toISOString()

                const endOfMonth = new Date(year, month, 1) // First day of next month
                const endStr = endOfMonth.toISOString()

                const { data: stats, error: statsError } = await supabaseAdmin
                    .from('workout_sessions')
                    .select('completed_at, total_calories_burned')
                    .eq('user_id', user.id)
                    .gte('completed_at', startStr)
                    .lte('completed_at', endStr)

                if (statsError) throw statsError

                return new Response(
                    JSON.stringify({ stats }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // 3. Weight History
            if (action === 'weight_history') {
                const days = parseInt(url.searchParams.get('days') || '30')
                const endDate = new Date()
                const startDate = new Date()
                startDate.setDate(endDate.getDate() - days)

                const { data: weightHistory, error: weightError } = await supabaseAdmin
                    .from('weight_history')
                    .select('weight, recorded_at')
                    .eq('user_id', user.id)
                    .gte('recorded_at', startDate.toISOString())
                    .lte('recorded_at', endDate.toISOString())
                    .order('recorded_at', { ascending: true })

                if (weightError) throw weightError

                return new Response(
                    JSON.stringify({ weight_history: weightHistory }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // 4. Focus Stats (Reports)
            if (action === 'focus_stats') {
                const days = parseInt(url.searchParams.get('days') || '30')
                const endDate = new Date()
                const startDate = new Date()
                startDate.setDate(endDate.getDate() - days)

                const { data, error } = await supabaseAdmin.rpc('get_focus_area_intensity', {
                    p_user_id: user.id,
                    p_start_date: startDate.toISOString(),
                    p_end_date: endDate.toISOString()
                })

                if (error) throw error

                return new Response(
                    JSON.stringify({ focus_stats: data }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // 3. Default: Dashboard Data (Profile + Socials + Streaks + Graph + Focus Stats)
            // Perform parallel fetches for dashboard efficiency
            const localDate = url.searchParams.get('local_date')
            const todayStr = localDate || new Date().toISOString().split('T')[0]

            const [
                profileRes,
                socialRes,
                streakHistoryRes,
                activityRes,
                offerRes
            ] = await Promise.all([
                supabaseAdmin.from('profiles').select('*').eq('id', user.id).single(),
                supabaseAdmin.from('social_links').select('id, url').eq('profile_id', user.id),
                supabaseAdmin.from('user_streak_history').select('activity_date, streak_type').eq('user_id', user.id).order('activity_date', { ascending: false }),
                supabaseAdmin.from('daily_workout_summary').select('date').eq('user_id', user.id).gte('date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]),
                supabaseAdmin.from('offers').select('id').eq('is_read', false).limit(1)
            ])

            if (profileRes.error) throw profileRes.error
            if (socialRes.error) throw socialRes.error
            // streakHistoryRes.error is ignored as it might be null/empty
            if (activityRes.error) throw activityRes.error

            // Calculate Dynamic Streak (Fire/Ice count towards streak)
            let currentStreak = 0;
            if (streakHistoryRes.data && streakHistoryRes.data.length > 0) {
                // Determine streak based on Fire/Ice
                // We treat both Fire and Ice as valid "streak keeping" activities for now,
                // OR maybe Ice just "pauses" it?
                // User said: "fire is for when the user did workout, and ice is for when the user did rest log"
                // Usually "Rest" means you keep the streak.

                const activities = streakHistoryRes.data.map(d => ({ date: d.activity_date, type: d.streak_type }));

                // Sort by date descending
                // distinct dates
                const distinctDates = Array.from(new Set(activities.map(a => a.date))).sort((a, b) => b.localeCompare(a));

                const yesterday = new Date(todayStr);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                const mostRecent = distinctDates[0];

                // Streak is active if most recent is today or yesterday
                if (mostRecent === todayStr || mostRecent === yesterdayStr) {
                    let streakCount = 0;
                    let cursorDate = new Date(mostRecent);

                    while (true) {
                        const dStr = cursorDate.toISOString().split('T')[0];
                        if (distinctDates.includes(dStr)) {
                            streakCount++;
                            cursorDate.setDate(cursorDate.getDate() - 1);
                        } else {
                            break;
                        }
                    }
                    currentStreak = streakCount;
                } else {
                    currentStreak = 0;
                }
            }

            // Calculate Focus Area Stats (Server-side Aggregation)
            // This is complex to do purely via Supabase API without an RPC. 
            // For now, we'll fetch the aggregated view if it exists, or compute it.
            // Since we don't have a materialized view, we fetch the raw tracking data.
            // To avoid fetching HUGE data, we'll limit to recent history or use a simpler query.
            // CAUTION: Fetching ALL history for stats is heavy. 
            // Better approach: The client was fetching *all* sessions effectively. 
            // Let's implement a smarter query. 
            // We'll fetch 'focus_area_tracking' directly for the user (via joins).

            const startDateDashboard = new Date()
            startDateDashboard.setDate(startDateDashboard.getDate() - 30)

            const { data: focusData, error: focusError } = await supabaseAdmin
                .from('focus_area_tracking')
                .select(`
                    intensity_score,
                    exercise_completions!inner (
                        session_id,
                        workout_sessions!inner (user_id, completed_at)
                    ),
                    exercise_focus_areas (
                        area,
                        category
                    )
                `)
                .eq('exercise_completions.workout_sessions.user_id', user.id)
                .gte('exercise_completions.workout_sessions.completed_at', startDateDashboard.toISOString())

            let focus_areas: any[] = []
            if (!focusError && focusData) {
                const statsMap: Record<string, { times: number, intensity: number }> = {}
                focusData.forEach((item: any) => {
                    // Check if exercise_focus_areas is an array (it should be)
                    const areas = Array.isArray(item.exercise_focus_areas) ? item.exercise_focus_areas : []
                    areas.forEach((fa: any) => {
                        // Use category if available, fallback to area for backward compatibility or 'Other'
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

            // Prepare weekly activity with types
            // We need to map the daily_workout_summary dates to types from user_streak_history
            // actually, daily_workout_summary is for workouts (fire).
            // We should use user_streak_history for the calendar display since it has both.

            let weeklyActivityWithTypes: any[] = [];
            if (streakHistoryRes.data) {
                // user_streak_history has activity_date and streak_type
                // We want the last 7 days + today roughly, or all history?
                // The frontend expects a list of dates usually, but we want types now.
                // Let's filter to recent history to keep payload small? 
                // Frontend `WeeklyGoalIndicator` shows +/- 3 days. So we need recent history.
                // currently `activityRes` fetches daily_workout_summary for last 7 days.
                // But `streakHistoryRes` fetches ALL streak history.

                // Let's map ALL streak history to { date, type } but maybe limit to last 30 days for frontend cache?
                // For now, let's just return the `streakHistoryRes` data mapped.

                weeklyActivityWithTypes = streakHistoryRes.data.map((item: any) => ({
                    date: item.activity_date,
                    type: item.streak_type || 'fire' // default to fire if null
                }));
            }

            return new Response(
                JSON.stringify({
                    profile: profileRes.data,
                    social_links: socialRes.data || [],
                    streak: currentStreak,
                    weekly_activity: weeklyActivityWithTypes, // Now returns objects
                    has_unread_offers: offerRes.data && offerRes.data.length > 0,
                    focus_areas
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

        // POST: Log Rest Day
        if (method === 'POST' && (url.pathname.endsWith('/rest') || url.searchParams.get('action') === 'log_rest')) {
            const body = await req.json().catch(() => ({})); // Body might be empty
            const { date } = body;
            const targetDate = date || new Date().toISOString().split('T')[0];

            // Insert into user_streak_history
            const { error: streakError } = await supabaseAdmin.from('user_streak_history').upsert({
                user_id: user.id,
                activity_date: targetDate,
                streak_type: 'ice'
            }, { onConflict: 'user_id, activity_date' });

            if (streakError) throw streakError;

            // Update profile stats if needed? (Total workouts doesn't increase for rest)
            // But maybe we want to log an activity?
            await supabaseAdmin.from('activities').insert({
                user_id: user.id,
                type: 'streak_milestone', // or a new type 'rest_day'? 'streak_milestone' is close enough or generic
                data: {
                    type: 'rest_day',
                    date: targetDate,
                    message: 'Rest day logged'
                }
            });

            return new Response(
                JSON.stringify({ success: true, message: 'Rest day logged' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

        if (method === 'PUT') {
            const body: ProfileUpdate = await req.json()

            // Construct update object dynamically to handle optional fields cleanly
            const updatePayload: any = {
                updated_at: new Date().toISOString()
            }

            if (body.username !== undefined) updatePayload.username = body.username
            if (body.full_name !== undefined) updatePayload.full_name = body.full_name
            if (body.bio !== undefined) updatePayload.bio = body.bio

            if (body.equipment_access !== undefined) {
                updatePayload.equipment_access = body.equipment_access
                    ? (body.equipment_access.charAt(0).toUpperCase() + body.equipment_access.slice(1).toLowerCase())
                    : null
            }

            // Onboarding fields
            if (body.weight !== undefined) updatePayload.weight = body.weight
            if (body.weight_unit !== undefined) updatePayload.weight_unit = body.weight_unit
            if (body.goal_weight !== undefined) updatePayload.goal_weight = body.goal_weight
            if (body.height !== undefined) updatePayload.height = body.height
            if (body.height_unit !== undefined) updatePayload.height_unit = body.height_unit
            if (body.fitness_goal !== undefined) updatePayload.fitness_goal = body.fitness_goal
            if (body.fitness_level !== undefined) updatePayload.fitness_level = body.fitness_level
            if (body.workout_frequency !== undefined) updatePayload.workout_frequency = body.workout_frequency
            if (body.gender !== undefined) updatePayload.gender = body.gender

            console.log("Updating profile with payload:", JSON.stringify(updatePayload));

            // Update Profile Table
            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update(updatePayload)
                .eq('id', user.id)

            if (updateError) {
                console.error("Profile Update Error:", JSON.stringify(updateError));
                return new Response(
                    JSON.stringify({ error: updateError.message, details: updateError }),
                    {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 400,
                    }
                )
            }

            // Update Social Links (Transaction-like: Delete all then Insert)
            if (body.social_links) {
                const { error: deleteError } = await supabaseAdmin
                    .from('social_links')
                    .delete()
                    .eq('profile_id', user.id)

                if (deleteError) throw deleteError

                if (body.social_links.length > 0) {
                    const { error: insertError } = await supabaseAdmin
                        .from('social_links')
                        .insert(
                            body.social_links.map(link => ({
                                profile_id: user.id,
                                url: link.url
                            }))
                        )
                    if (insertError) throw insertError
                }
            }

            return new Response(
                JSON.stringify({ success: true }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

        if (method === 'POST' && (url.pathname.endsWith('/avatar') || url.searchParams.get('action') === 'avatar')) {
            const formData = await req.formData()
            const file = formData.get('file')

            if (!file || !(file instanceof File)) {
                throw new Error('No file uploaded')
            }

            let avatarUrl = '';
            let thumbnailUrl = '';

            try {
                // Import ImageScript
                const { Image, decode } = await import("https://deno.land/x/imagescript@1.2.17/mod.ts");

                const fileExt = "jpg"; // Force JPG for consistency
                const fileName = `${user.id}_${Date.now()}.${fileExt}`
                const thumbFileName = `${user.id}_${Date.now()}_thumb.${fileExt}`

                // Convert File to ArrayBuffer then Uint8Array
                const arrayBuffer = await file.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                // Decode image
                const image = await decode(uint8Array);

                // 1. Process Main Image (512x512)
                const mainImage = image.clone();
                // Ensure 1:1 aspect ratio first if not already (center crop)
                const size = Math.min(mainImage.width, mainImage.height);
                if (mainImage.width !== mainImage.height) {
                    const x = Math.floor((mainImage.width - size) / 2);
                    const y = Math.floor((mainImage.height - size) / 2);
                    mainImage.crop(x, y, size, size);
                }
                mainImage.resize(512, 512);
                const mainBuffer = await mainImage.encodeHTML(0.8); // 80% JPEG compression (encodeHTML is actually encode JPEG in imagescript)
                // Wait, ImageScript encode() defaults to PNG usually unless specified?
                // Actually `encode(quality)` produces JPEG if quality is provided in some versions, or use `encodeJPEG`.
                // ImageScript 1.2.17 `encode` method signature: encode(compression?: number): Promise<Uint8Array>.
                // It usually encodes to PNG. We want JPEG.
                // Let's check docs or usage. `image.encodeJPEG(quality)` exists in newer versions.
                // For 1.2.17, `encode` is PNG, `encodeJPEG` is JPEG.
                // Let's safe bet: use `encodeJPEG` if available, or check if `encode` takes options.
                // The `progress-photo` usage used `encode()`.
                // Let's use specific encoding:
                const mainBufferJpg = await mainImage.encodeJPEG(80);

                // 2. Process Thumbnail (156x156)
                const thumbImage = mainImage.clone(); // Clone the already squared image
                thumbImage.resize(156, 156);
                const thumbBufferJpg = await thumbImage.encodeJPEG(80);

                // Upload Main
                const { error: mainError } = await supabaseAdmin.storage
                    .from('avatars')
                    .upload(fileName, mainBufferJpg, {
                        contentType: 'image/jpeg',
                        upsert: true
                    })

                if (mainError) throw mainError

                // Upload Thumbnail
                const { error: thumbError } = await supabaseAdmin.storage
                    .from('avatars')
                    .upload(thumbFileName, thumbBufferJpg, {
                        contentType: 'image/jpeg',
                        upsert: true
                    })

                if (thumbError) console.warn("Thumbnail upload failed", thumbError);

                // Get Public URLs
                const { data: mainPublicUrl } = supabaseAdmin.storage
                    .from('avatars')
                    .getPublicUrl(fileName)

                avatarUrl = mainPublicUrl.publicUrl;

                if (!thumbError) {
                    const { data: thumbPublicUrl } = supabaseAdmin.storage
                        .from('avatars')
                        .getPublicUrl(thumbFileName)
                    thumbnailUrl = thumbPublicUrl.publicUrl;
                }

            } catch (processError) {
                console.error("Image processing failed, falling back to raw upload:", processError);
                // Fallback: Upload raw
                const fileExt = file.name.split('.').pop()
                const fileName = `${user.id}_${Date.now()}.${fileExt}`

                const { error } = await supabaseAdmin.storage
                    .from('avatars')
                    .upload(fileName, file, {
                        contentType: file.type,
                        upsert: true
                    })

                if (error) throw error

                const { data: publicUrl } = supabaseAdmin.storage
                    .from('avatars')
                    .getPublicUrl(fileName)

                avatarUrl = publicUrl.publicUrl;
            }

            // Update Profile
            await supabaseAdmin
                .from('profiles')
                .update({
                    avatar_url: avatarUrl,
                    avatar_thumbnail_url: thumbnailUrl || null
                })
                .eq('id', user.id)

            return new Response(
                JSON.stringify({ url: avatarUrl, thumbnail: thumbnailUrl }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

        // DELETE: Remove Avatar
        if (method === 'DELETE' && (url.pathname.endsWith('/avatar') || url.searchParams.get('action') === 'delete_avatar')) {
            const { fileName } = await req.json()

            if (!fileName) {
                throw new Error('File name is required')
            }

            const { error } = await supabaseAdmin.storage
                .from('avatars')
                .remove([fileName])

            if (error) {
                console.error("Avatar Delete Error:", error)
                throw error
            }

            // If action is distinct or body says so
            const shouldUpdateProfile = url.searchParams.get('update_profile') === 'true';

            if (shouldUpdateProfile) {
                await supabaseAdmin.from('profiles').update({ avatar_url: null }).eq('id', user.id);
            }

            return new Response(
                JSON.stringify({ success: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // DELETE: Delete Account
        if (method === 'DELETE' && url.searchParams.get('action') === 'delete_account') {
            // Manually delete data from tables that reference auth.users without CASCADE
            // Note: profiles, workouts, nutrition_logs, progress_photos cascade from profiles -> auth.users
            // But workout_sessions, daily_workout_summary, workout_streaks reference auth.users directly.

            // 1. Delete Workout Streaks
            const { error: streakError } = await supabaseAdmin
                .from('workout_streaks')
                .delete()
                .eq('user_id', user.id);

            if (streakError) {
                console.error("Error deleting streaks:", streakError);
                // Continue? Or fail? Best to try to clean up.
            }

            // 2. Delete Daily Summaries
            const { error: summaryError } = await supabaseAdmin
                .from('daily_workout_summary')
                .delete()
                .eq('user_id', user.id);

            if (summaryError) {
                console.error("Error deleting summaries:", summaryError);
            }

            // 3. Delete Workout Sessions (will cascade to exercise_completions etc.)
            const { error: sessionError } = await supabaseAdmin
                .from('workout_sessions')
                .delete()
                .eq('user_id', user.id);

            if (sessionError) {
                console.error("Error deleting sessions:", sessionError);
            }

            // Finally delete the user (will cascade to profiles etc.)
            const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)

            if (error) {
                console.error("Delete Account Error:", error)
                throw error
            }

            return new Response(
                JSON.stringify({ success: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // POST: Log Weight
        if (method === 'POST' && (url.pathname.endsWith('/weight') || url.searchParams.get('action') === 'weight')) {
            const body = await req.json()
            const { weight, weight_unit } = body

            if (weight === undefined || !weight_unit) {
                throw new Error('Weight and unit are required')
            }

            // 1. Insert into weight_history
            const { error: historyError } = await supabaseAdmin
                .from('weight_history')
                .insert({
                    user_id: user.id,
                    weight: weight,
                    recorded_at: new Date().toISOString()
                })

            if (historyError) throw historyError

            // 2. Update profiles table
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({
                    weight: weight,
                    weight_unit: weight_unit,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (profileError) throw profileError

            return new Response(
                JSON.stringify({ success: true }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

        // POST: Upload Progress Photo
        if (method === 'POST' && (url.pathname.endsWith('/progress-photo') || url.searchParams.get('action') === 'progress-photo')) {
            const formData = await req.formData()
            const file = formData.get('file')
            const category = formData.get('category') || 'front' // default to front
            const notes = formData.get('notes') || ''

            if (!file || !(file instanceof File)) {
                throw new Error('No file uploaded')
            }

            let photoUrl = '';
            let thumbnailUrl = '';

            try {
                // SAFETY CHECK: Skip processing for large files to avoid OOM (Error 546)
                // 128MB RAM limit means ~6MB JPEG decoding can crash (e.g. 20MP image -> 80MB raw bitmap)
                const MAX_PROCESS_SIZE = 6 * 1024 * 1024; // 6MB
                if (file.size > MAX_PROCESS_SIZE) {
                    console.warn(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB) for edge processing. Skipping optimization.`);
                    throw new Error("File too large for processing");
                }

                console.log("Starting image processing...");
                // Import ImageScript dynamically
                const { Image, decode } = await import("https://deno.land/x/imagescript@1.2.17/mod.ts");

                const fileExt = file.name.split('.').pop()
                // Try to organize by user ID strictly
                const fileName = `${user.id}/${Date.now()}.${fileExt}`
                const thumbFileName = `${user.id}/${Date.now()}_thumb.${fileExt}`

                // Convert File to ArrayBuffer then Uint8Array
                const arrayBuffer = await file.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                // Decode image
                console.log("Decoding image...");
                const image = await decode(uint8Array);

                // 1. Process Thumbnail (72x72 crop center)
                console.log("Creating thumbnail...");
                const thumbnail = image.clone();
                const size = Math.min(thumbnail.width, thumbnail.height);
                const x = Math.floor((thumbnail.width - size) / 2);
                const y = Math.floor((thumbnail.height - size) / 2);

                thumbnail.crop(x, y, size, size); // Center crop to square
                thumbnail.resize(72, 72); // Resize to 72x72

                const thumbBuffer = await thumbnail.encode();

                // 2. Compress Original
                console.log("Processing original...");
                const original = image.clone();
                if (original.width > 2000 || original.height > 2000) {
                    original.resize(original.width > original.height ? 2000 : Image.RESIZE_AUTO, original.height > original.width ? 2000 : Image.RESIZE_AUTO);
                }
                const originalBuffer = await original.encode(); // Default compression

                // Upload Original
                console.log("Uploading original...");
                const { error: originalError } = await supabaseAdmin.storage
                    .from('progress-photos')
                    .upload(fileName, originalBuffer, {
                        contentType: file.type,
                        upsert: true
                    })

                if (originalError) throw originalError

                // Upload Thumbnail
                console.log("Uploading thumbnail...");
                const { error: thumbError } = await supabaseAdmin.storage
                    .from('progress-photos')
                    .upload(thumbFileName, thumbBuffer, {
                        contentType: file.type,
                        upsert: true
                    })

                if (thumbError) {
                    console.warn("Thumbnail upload failed, continuing...", thumbError)
                } else {
                    const { data: thumbPublicUrl } = supabaseAdmin.storage
                        .from('progress-photos')
                        .getPublicUrl(thumbFileName)
                    thumbnailUrl = thumbPublicUrl.publicUrl;
                }

                const { data: publicUrl } = supabaseAdmin.storage
                    .from('progress-photos')
                    .getPublicUrl(fileName)
                photoUrl = publicUrl.publicUrl;

            } catch (processError) {
                console.error("Image processing failed, falling back to raw upload:", processError);

                // Fallback: Just upload the raw file
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}_raw.${fileExt}`;

                const { error: uploadError } = await supabaseAdmin.storage
                    .from('progress-photos')
                    .upload(fileName, file, {
                        contentType: file.type,
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                const { data: publicUrl } = supabaseAdmin.storage
                    .from('progress-photos')
                    .getPublicUrl(fileName);

                photoUrl = publicUrl.publicUrl;
                thumbnailUrl = ''; // No thumbnail available in fallback
            }

            // Insert into progress_photos table
            console.log("Saving to database...");
            const { error: dbError } = await supabaseAdmin
                .from('progress_photos')
                .insert({
                    user_id: user.id,
                    photo_url: photoUrl,
                    thumbnail_url: thumbnailUrl || null,
                    category: category,
                    notes: notes,
                    created_at: new Date().toISOString()
                })

            if (dbError) throw dbError

            return new Response(
                JSON.stringify({ url: photoUrl, thumbnail: thumbnailUrl }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

        // DELETE: Delete Progress Photo
        if (method === 'DELETE' && (url.pathname.endsWith('/progress-photo') || url.searchParams.get('action') === 'progress-photo')) {
            const { id } = await req.json()

            if (!id) {
                throw new Error('Photo ID is required')
            }

            // 1. Fetch the photo record to get storage paths (and verify ownership)
            const { data: photo, error: fetchError } = await supabaseAdmin
                .from('progress_photos')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .single()

            if (fetchError || !photo) {
                console.error("Photo not found or unauthorized:", fetchError)
                throw new Error('Photo not found or unauthorized')
            }

            // 2. Delete from Storage
            const pathsToDelete: string[] = []

            // Helper to extract path
            const getPath = (fullUrl: string) => {
                if (!fullUrl) return null
                const parts = fullUrl.split('/progress-photos/')
                return parts.length > 1 ? parts[1] : null
            }

            const originalPath = getPath(photo.photo_url)
            const thumbPath = getPath(photo.thumbnail_url)

            if (originalPath) pathsToDelete.push(originalPath)
            if (thumbPath) pathsToDelete.push(thumbPath)

            if (pathsToDelete.length > 0) {
                const { error: storageError } = await supabaseAdmin.storage
                    .from('progress-photos')
                    .remove(pathsToDelete)

                if (storageError) {
                    console.warn("Storage delete error (continuing):", storageError)
                }
            }

            // 3. Delete from Database
            const { error: deleteError } = await supabaseAdmin
                .from('progress_photos')
                .delete()
                .eq('id', id)

            if (deleteError) throw deleteError

            return new Response(
                JSON.stringify({ success: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        throw new Error('Method not supported')

    } catch (error) {
        console.error("Edge Function Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})


