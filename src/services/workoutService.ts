import { supabase } from '../lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalYYYYMMDD } from '../utils/date';

// --- Types ---

export interface UserProfile {
    id: string;
    username: string | null;
    full_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    avatar_thumbnail_url?: string | null;
    weight?: number;
    weight_unit?: string;
    height?: number;
    height_unit?: string;
    total_workouts_completed?: number;
    total_calories_burned?: number;
    total_time_taken?: number;
    fitness_goal?: string;
    fitness_level?: string;
    workout_frequency?: number;
    gender?: string;
    subscription?: string;
    premium_status?: boolean;
    goal_weight?: number;
    equipment_access?: string;
    // ... other fields
}

export interface SocialLink {
    url: string;
}

export interface ProfileResponse {
    profile: UserProfile;
    social_links: SocialLink[];
    streak: number;
    weekly_activity: { date: string; type: 'fire' | 'ice' }[];
    monthly_stats?: {
        completed_at: string;
        total_calories_burned: number;
    }[];
    history?: any[];
    focus_areas?: {
        area: string;
        times_targeted: number;
        avg_intensity: number;
    }[];
    has_unread_offers?: boolean;
}

export interface Routine {
    id: string;
    name: string;
    created_at: string;
    image_url: string | null;
    image_url_male: string | null;
    image_url_female: string | null;
    level: string;
    category: string;
    place: string;
    exercise_count: number;
    total_duration?: number;
}

export interface Challenge {
    id: string;
    name: string;
    description: string;
    duration_days: number;
    image_url: string | null;
}

export interface UserChallenge {
    id: string;
    challenge_id: string;
    user_id: string;
    status: 'active' | 'completed' | 'abandoned';
    current_day_index: number;
    start_date: string;
    user_challenge_logs: {
        day_number: number;
        completed_at: string;
    }[];
}

export interface ChallengeDay {
    id: string;
    challenge_id: string;
    day_number: number;
    is_rest_day: boolean;
    routine_id: string | null;
    instructions: string | null;
    workout_routines?: {
        id: string;
        name: string;
        image_url?: string;
        level?: string;
        estimated_duration?: number;
    };
}

export interface RoutineDetails extends Routine {
    exercises: any[]; // refine type as needed
}


interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiry: number;
}

const CACHE_PREFIX = 'api_cache_';
const DEFAULT_CACHE_TTL = 1000 * 60 * 60; // 1 hour

// --- API Service ---


class ApiService {
    /**
     * Helper to invoke functions with standard error handling
     */
    private async invoke<T>(functionName: string, options?: any): Promise<T> {
        const { data, error } = await supabase.functions.invoke(functionName, options);

        if (error) {
            console.error(`Edge Function '${functionName}' failed:`, error);
            // Attempt to read body if it's a FunctionsHttpError with context
            if ('context' in error) {
                const ctx = (error as any).context;
                if (ctx && typeof ctx.json === 'function') {
                    try {
                        const body = await ctx.json();
                        console.error(`Edge Function '${functionName}' response body:`, body);
                    } catch (e) { /* ignore */ }
                }
            }
            throw error;
        }

        return data as T;
    }

    /**
     * Helper to handle caching for GET requests
     */
    private async withCache<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl: number = DEFAULT_CACHE_TTL
    ): Promise<T> {
        const cacheKey = `${CACHE_PREFIX}${key}`;

        // Try to get from cache first
        try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                const item: CacheItem<T> = JSON.parse(cached);
                const now = Date.now();

                // If valid, return it immediately (stale-while-revalidate strategy could be applied here too)
                // For now, we return cached data if it exists, but we can also check for expiry
                // to trigger a background refresh? 
                // Let's implement a simple "return cached if not expired" first, 
                // OR "return cached, then update" requires a stream/callback. 
                // Standard offline-first: return cached if available (even if expired? maybe not).
                // Let's allow returning "stale" data if network fails?

                // Current strategy: 
                // 1. If valid cache => return. 
                // 2. If expired/no cache => fetch. 
                // 3. If fetch fails => return expired cache if available.

                if (now < item.expiry) {
                    console.log(`[API] Cache hit for ${key}`);
                    return item.data;
                }
            }
        } catch (e) {
            console.warn(`[API] Error reading cache for ${key}`, e);
        }

        // Fetch fresh data
        try {
            const data = await fetcher();

            // Save to cache
            const cacheItem: CacheItem<T> = {
                data,
                timestamp: Date.now(),
                expiry: Date.now() + ttl
            };
            AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem)).catch(e =>
                console.warn(`[API] Error writing cache for ${key}`, e)
            );

            return data;
        } catch (error) {
            console.warn(`[API] Network request failed for ${key}, trying fallback`, error);
            // If network fails, try to return stale cache
            try {
                const cached = await AsyncStorage.getItem(cacheKey);
                if (cached) {
                    const item: CacheItem<T> = JSON.parse(cached);
                    console.log(`[API] Returning stale cache for ${key}`);
                    return item.data;
                }
            } catch (e) { /* ignore */ }

            throw error;
        }
    }

    // --- Profile ---

    async getProfile(forceRefresh = false): Promise<ProfileResponse> {
        const localDate = getLocalYYYYMMDD();
        try {
            const fetcher = () => this.invoke<ProfileResponse>(`profile-manager?local_date=${localDate}`, { method: 'GET' });

            if (forceRefresh) {
                // Bypass cache read, but still update cache after
                const data = await fetcher();
                const cacheKey = `${CACHE_PREFIX}profile`;
                const cacheItem: CacheItem<ProfileResponse> = {
                    data,
                    timestamp: Date.now(),
                    expiry: Date.now() + DEFAULT_CACHE_TTL
                };
                AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem)).catch(console.error);
                return data;
            }

            return await this.withCache('profile', fetcher);
        } catch (error) {
            console.error("API: getProfile error", error);
            throw error;
        }
    }

    async getWorkoutHistory(startDate: Date, endDate: Date, userId?: string): Promise<any[]> {
        const params = new URLSearchParams({
            action: 'history',
            start: startDate.toISOString(),
            end: endDate.toISOString()
        });

        if (userId) {
            params.append('user_id', userId);
        }

        const query = params.toString();

        const { history } = await this.invoke<{ history: any[] }>(`profile-manager?${query}`, { method: 'GET' });
        return history;
    }

    async getMonthlyStats(month?: number, year?: number, forceRefresh = false): Promise<any[]> {
        const fetcher = async () => {
            const params = new URLSearchParams({ action: 'monthly_stats' });
            if (month) params.append('month', month.toString());
            if (year) params.append('year', year.toString());

            const { stats } = await this.invoke<{ stats: any[] }>(`profile-manager?${params.toString()}`, { method: 'GET' });
            return stats;
        };

        const cacheKey = `monthly_stats_${month || 'current'}_${year || 'current'}`;

        if (forceRefresh) {
            const data = await fetcher();
            const fullCacheKey = `${CACHE_PREFIX}${cacheKey}`;
            const cacheItem: CacheItem<any[]> = {
                data,
                timestamp: Date.now(),
                expiry: Date.now() + DEFAULT_CACHE_TTL
            };
            AsyncStorage.setItem(fullCacheKey, JSON.stringify(cacheItem)).catch(console.error);
            return data;
        }

        return await this.withCache(cacheKey, fetcher);
    }

    async getExerciseDetails(exerciseId: string): Promise<any> {
        const { exercise } = await this.invoke<{ exercise: any }>(`workout-manager?exerciseId=${exerciseId}`, { method: 'GET' });

        // Edge function now returns exercise_animations, no need to fetch manually.
        return exercise;
    }

    async updateProfile(updates: Partial<UserProfile> & { social_links?: { url: string }[] }): Promise<void> {
        await this.invoke('profile-manager', {
            method: 'PUT',
            body: updates,
        });

        // Invalidate profile cache so next fetch gets fresh data
        const cacheKey = `${CACHE_PREFIX}profile`;
        await AsyncStorage.removeItem(cacheKey).catch(console.warn);

        // Also invalidate routine caches since they might contain gender-specific assets
        try {
            const keys = await AsyncStorage.getAllKeys();
            const routineKeys = keys.filter(key => key.startsWith('routine_cache_'));
            if (routineKeys.length > 0) {
                await AsyncStorage.multiRemove(routineKeys);
            }
        } catch (e) {
            console.warn('Failed to clear routine cache', e);
        }
    }

    async uploadAvatar(uri: string): Promise<string> {
        const formData = new FormData();

        // React Native specific file handling
        const filename = uri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        // @ts-ignore: React Native FormData signature
        formData.append('file', { uri, name: filename, type });

        const { url } = await this.invoke<{ url: string }>('profile-manager?action=avatar', {
            method: 'POST',
            body: formData,
            // Note: invoke helper automatically sets headers for FormData? 
            // Actually Supabase client might handle boundary if passed as body directly?
            // Usually passing FormData to invoke works.
        });

        return url;
    }

    async logWeight(weight: number, unit: 'kg' | 'lbs'): Promise<void> {
        await this.invoke('profile-manager?action=weight', {
            method: 'POST',
            body: { weight, weight_unit: unit }
        });

        // Invalidate weight history cache so Reports page fetches fresh data
        try {
            const keys = await AsyncStorage.getAllKeys();
            const weightCacheKeys = keys.filter(key => key.startsWith(`${CACHE_PREFIX}weight_history_`));
            if (weightCacheKeys.length > 0) {
                await AsyncStorage.multiRemove(weightCacheKeys);
                console.log(`[API] Invalidated ${weightCacheKeys.length} weight history cache entries`);
            }
        } catch (e) {
            console.warn('[API] Error invalidating weight cache:', e);
        }
    }

    async logRestDay(date?: string): Promise<void> {
        await this.invoke('profile-manager?action=log_rest', {
            method: 'POST',
            body: { date }
        });

        // Invalidate profile cache so dashboard refreshes
        const cacheKey = `${CACHE_PREFIX}profile`;
        await AsyncStorage.removeItem(cacheKey).catch(console.warn);

        // Also invalidate monthly stats cache as valid days changed
        try {
            const keys = await AsyncStorage.getAllKeys();
            const monthlyStatsKeys = keys.filter(key => key.startsWith(`${CACHE_PREFIX}monthly_stats_`));
            if (monthlyStatsKeys.length > 0) {
                await AsyncStorage.multiRemove(monthlyStatsKeys);
            }
        } catch (e) {
            console.warn('[API] Error invalidating monthly stats cache:', e);
        }
    }

    async uploadProgressPhoto(uri: string, category: string = 'front', notes: string = ''): Promise<string> {
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        // @ts-ignore: React Native FormData signature
        formData.append('file', { uri, name: filename, type });
        formData.append('category', category);
        formData.append('notes', notes);

        const { url } = await this.invoke<{ url: string }>('profile-manager?action=progress-photo', {
            method: 'POST',
            body: formData,
        });

        return url;
    }

    async getWeightHistory(days: number = 30, forceRefresh = false): Promise<{ weight: number; recorded_at: string }[]> {
        const fetcher = async () => {
            const query = new URLSearchParams({
                action: 'weight_history',
                days: days.toString()
            }).toString();

            const { weight_history } = await this.invoke<{ weight_history: any[] }>(`profile-manager?${query}`, { method: 'GET' });
            return weight_history;
        };

        if (forceRefresh) {
            const data = await fetcher();
            const cacheKey = `${CACHE_PREFIX}weight_history_${days}`;
            const cacheItem: CacheItem<any> = {
                data,
                timestamp: Date.now(),
                expiry: Date.now() + DEFAULT_CACHE_TTL
            };
            AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem)).catch(console.error);
            return data;
        }

        return await this.withCache(`weight_history_${days}`, fetcher);
    }

    async deleteAvatar(fileName: string, updateProfile: boolean = true): Promise<void> {
        await this.invoke('profile-manager?action=delete_avatar', {
            method: 'DELETE',
            body: { fileName },
            // Pass update_profile query param if needed, or handle in body if we refactored it. 
            // My edge function code checks query param `url.searchParams.get('update_profile')`.
            // So:
        });

        // Wait, I need to pass query param for update_profile.
        // Let's modify the invoke string.
        const query = `action=delete_avatar&update_profile=${updateProfile}`;
        await this.invoke(`profile-manager?${query}`, {
            method: 'DELETE',
            body: { fileName }
        });
    }

    async getFocusStats(days: number = 30, forceRefresh = false): Promise<any[]> {
        const fetcher = async () => {
            const query = new URLSearchParams({
                action: 'focus_stats',
                days: days.toString()
            }).toString();

            const { focus_stats } = await this.invoke<{ focus_stats: any[] }>(`profile-manager?${query}`, { method: 'GET' });
            return focus_stats;
        };

        if (forceRefresh) {
            const data = await fetcher();
            const cacheKey = `${CACHE_PREFIX}focus_stats_${days}`;
            const cacheItem: CacheItem<any> = {
                data,
                timestamp: Date.now(),
                expiry: Date.now() + DEFAULT_CACHE_TTL
            };
            AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem)).catch(console.error);
            return data;
        }

        return await this.withCache(`focus_stats_${days}`, fetcher);
    }

    // --- Challenges ---

    async getChallenges(): Promise<Challenge[]> {
        // We can cache this heavily
        const fetcher = async () => {
            const { data, error } = await supabase
                .from('challenges')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Challenge[];
        };

        return await this.withCache('challenges_list', fetcher, DEFAULT_CACHE_TTL * 24); // Cache for 24h
    }

    async joinChallenge(challengeId: string): Promise<UserChallenge> {
        await this.ensureAuth();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        console.log(`[API] Joining challenge ${challengeId} with token: ${token ? 'PRESENT' : 'MISSING'}`);

        const result = await this.invoke<{ data: UserChallenge }>('challenge-operations', {
            method: 'POST',
            body: { action: 'join_challenge', challenge_id: challengeId },
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return result.data;
    }

    async getChallengeStatus(challengeId: string): Promise<UserChallenge | null> {
        const fetcher = async () => {
            try {
                const result = await this.invoke<{ data: UserChallenge }>('challenge-operations', {
                    method: 'POST',
                    body: { action: 'get_challenge_status', challenge_id: challengeId }
                });
                return result.data;
            } catch (e) {
                // Return null if not found/joined
                return null;
            }
        };
        // Shorter cache or no cache? No cache for status as it changes often
        return await fetcher();
    }

    async getChallengeDays(challengeId: string): Promise<ChallengeDay[]> {
        const fetcher = async () => {
            const { data, error } = await supabase
                .from('challenge_days')
                .select(`
                    *,
                    workout_routines (
                        id, name, level, image_url
                    )
                `)
                .eq('challenge_id', challengeId)
                .order('day_number', { ascending: true });

            if (error) throw error;
            return data as any[];
        };

        return await this.withCache(`challenge_days_${challengeId}`, fetcher, DEFAULT_CACHE_TTL * 24);
    }

    async completeChallengeDay(userChallengeId: string, dayNumber: number, type: 'workout' | 'rest' = 'workout'): Promise<void> {
        await this.ensureAuth();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        await this.invoke('challenge-operations', {
            method: 'POST',
            body: {
                action: 'complete_day',
                user_challenge_id: userChallengeId,
                day_number: dayNumber,
                type
            },
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
    }

    // --- Workouts ---


    async getWorkoutRoutines(): Promise<Routine[]> {
        // Updated to support user routines potentially returned by updated edge function
        const { routines } = await this.invoke<{ routines: any[] }>('workout-manager', { method: 'GET' });

        // Map response to domain model if necessary (e.g., flatten count)
        return routines.map((r: any) => ({
            ...r,
            exercise_count: r.routine_exercises?.[0]?.count || 0
        }));
    }

    async getAllExercises(): Promise<any[]> {
        const { exercises } = await this.invoke<{ exercises: any[] }>('workout-manager?action=exercises', { method: 'GET' });
        return exercises;
    }

    async createRoutine(routineData: { name: string; category: string; level: string; exercises: any[] }): Promise<any> {
        const result = await this.invoke<{ success: boolean; routine: any }>('workout-manager', {
            method: 'POST',
            body: routineData
        });

        // Invalidate cache
        await AsyncStorage.removeItem('cached_workout_routines_list').catch(console.warn);

        return result.routine;
    }

    async getRoutineDetails(id: string): Promise<RoutineDetails> {
        try {
            // We use query param for ID as per new edge function design
            // Note: URL search params need to be appended to the invoke URL if the client supported it easily,
            // but Supabase invoke helper sends body/headers. 
            // We might need to handle query params in the function via Body or custom headers if invoke doesn't support query params easily.
            // Actually, supabase-js invoke DOES NOT easily support query params on the URL.
            // Let's check how the function parses it. Function expects `url.searchParams.get('id')`.
            // We can pass it in the body since it's a GET request? NO, GET request with body is weird.
            // The standard way is to modify the function to accept body props OR use query params.
            // Re-reading usage: The function checks `match?.pathname.groups.id` OR `url.searchParams.get('id')`.
            // To query a URL param via `functions.invoke` is tricky. 
            // We will TRY passing it via body if the function supports it, OR we change function to POST for details.
            // BUT, for now, let's append it to the body or assume we can hack the URL?
            // Wait, standard invoke: invoke('func-name', { body: ... })
            // A better pattern for GET requests in Edge Functions via Client is often just expecting body if method is POST, 
            // or using `invoke('workout-manager?id=xyz')` <-- This is NOT supported directly by the library name arg usually.

            // CORRECTION: existing workout-manager supports `req.json()` if getting body.
            // But for GET /routines/:id, it acts on URL. 
            // Let's simple use a POST for fetching details to avoid URL encoding issues in the client wrapper, 
            // OR rely on the fact we can pass `query` to `invoke` in some versions??? No.

            // ALTERNATIVE: Use the `workout-manager` logic modification to accept body even for GET? No body in GET.
            // We will try invoking with query parameters in the function name string if Supabase client allows it? 
            // `supabase.functions.invoke('workout-manager?id=' + id)` -> This works in many versions.

            // However, if that fails, we might need to update the edge function to accept POST for retrieval too.
            // Let's assume the query param approach works for now.

            // Implementation:
            const { routine, exercises } = await this.invoke<{ routine: any, exercises: any[] }>(`workout-manager?id=${id}`, {
                method: 'GET',
            });

            return {
                ...routine,
                exercises
            };
        } catch (e) {
            // Fallback or re-throw
            throw e;
        }
    }

    async startWorkoutSession(routineId: string): Promise<{ session_id: string }> {
        console.log(`[API] Starting workout session for routine: ${routineId}`);
        const { data, error } = await supabase.functions.invoke('workout-tracker?action=start', {
            method: 'POST',
            body: { routine_id: routineId }
        });

        if (error) {
            console.error("[API] Failed to start workout session:", error);
            // Log body if available (sometimes error object has details)
            if ('context' in error) console.error("[API] Error context:", (error as any).context);
            throw error;
        }

        console.log("[API] Workout session started:", data);
        return data;
    }

    async completeWorkoutSession(sessionData: any): Promise<{ success: boolean; error?: any }> {
        console.log("[API] Completing workout session with payload:", JSON.stringify(sessionData, null, 2));
        const { data, error } = await supabase.functions.invoke('workout-tracker?action=complete', {
            method: 'POST',
            body: sessionData
        });

        if (error) {
            console.error("[API] Failed to complete workout session:", error);
            return { success: false, error };
        }

        // Invalidate monthly stats cache so Profile heatmap refreshes
        try {
            const keys = await AsyncStorage.getAllKeys();
            const monthlyStatsKeys = keys.filter(key => key.startsWith(`${CACHE_PREFIX}monthly_stats_`));
            if (monthlyStatsKeys.length > 0) {
                await AsyncStorage.multiRemove(monthlyStatsKeys);
                console.log(`[API] Invalidated ${monthlyStatsKeys.length} monthly stats cache entries`);
            }
        } catch (e) {
            console.warn('[API] Error invalidating monthly stats cache:', e);
        }

        console.log("[API] Workout session completed successfully:", data);
        return data;
    }

    async deleteAccount(): Promise<void> {
        await this.invoke('profile-manager?action=delete_account', {
            method: 'DELETE'
        });
    }

    // --- AI Assistant ---

    async sendMessage(message: string, enabledOptions: string[]): Promise<{ text: string }> {
        return await this.invoke<{ text: string }>('ai-assistant', {
            method: 'POST',
            body: { message, enabledOptions }
        });
    }

    async clearApiCache(): Promise<void> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
            if (cacheKeys.length > 0) {
                await AsyncStorage.multiRemove(cacheKeys);
                console.log(`[API] Cleared ${cacheKeys.length} cache items`);
            }
        } catch (error) {
            console.error('[API] Error clearing cache:', error);
        }
    }

    /**
     * Ensures we have a valid session before making a request that requires auth.
     * Tries to refresh session if missing.
     */
    private async ensureAuth(): Promise<void> {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!session || error) {
            console.log("[API] Session missing or check failed, attempting refresh...");
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError || !refreshedSession) {
                console.error("[API] Failed to refresh session:", refreshError);
                throw new Error("You must be logged in to perform this action. Please restart the app or log in again.");
            }
            console.log("[API] Session refreshed successfully");
        }
    }
}

export const api = new ApiService();
