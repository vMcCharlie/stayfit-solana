import React, { useState, useEffect, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, TouchableOpacity, StyleSheet, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../src/context/theme";
import PublicProfileView from "../../components/PublicProfileView";
import ScreenHeader from "../../components/ScreenHeader";
import { supabase } from "../../../src/lib/supabase";

// Interfaces moved/copied from View
interface SocialLink {
    id?: string;
    url: string;
}

interface FocusAreaStat {
    area: string;
    times_targeted: number;
    avg_intensity: number;
}

export interface Profile {
    username: string;
    full_name: string;
    calories_burned: number;
    workouts_completed: number;
    following: string;
    bio: string;
    social_links: SocialLink[];
    avatar_url?: string;
    subscription: "PLUS" | "PRO" | "FREE" | null;
    focus_areas?: FocusAreaStat[];
    total_time_taken: number;
    calendar_data?: ActivityDay[];
}

export interface ActivityDay {
    date: string;
    total_calories_burned: number;
    total_duration: number;
}

export default function PublicProfileScreen() {
    const { userId } = useLocalSearchParams<{ userId: string }>();
    const router = useRouter();
    const { isDarkMode, selectedPalette } = useTheme();

    // State lifted from PublicProfileView
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<Profile>({
        username: "",
        full_name: "",
        calories_burned: 0,
        workouts_completed: 0,
        following: "0",
        bio: "",
        social_links: [],
        subscription: null,
        total_time_taken: 0,
    });

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loadingFollow, setLoadingFollow] = useState(false);
    const [showUnfollowState, setShowUnfollowState] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const colors = {
        background: isDarkMode ? selectedPalette.dark.background : selectedPalette.light.background,
        text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
        surfaceSecondary: isDarkMode ? `${selectedPalette.primary}20` : `${selectedPalette.primary}15`,
    };

    const fetchUserProfile = async () => {
        if (!userId) return;
        try {
            setLoading(true);
            setError(null);

            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;

            const loggedInId = session?.user?.id;
            setCurrentUserId(loggedInId || null);

            // Fetch profile data for TARGET user via Edge Function
            const { data: profileResponse, error: profileError } = await supabase.functions.invoke(`activity-feed?action=get_profile&target_id=${userId}`, {
                method: 'GET'
            });

            if (profileError) throw profileError;
            if (!profileResponse || !profileResponse.profile) throw new Error("User not found");

            const profileData = profileResponse.profile;

            // Check follow status (already updated to use edge function below, but let's keep it clean)
            if (loggedInId) {
                const { data: followData, error: followError } = await supabase.functions.invoke(`activity-feed?action=check_follow&target_id=${userId}`, {
                    method: 'GET'
                });

                if (!followError && followData) {
                    setIsFollowing(followData.is_following);
                    if (followData.is_following) setShowUnfollowState(true);
                }
            }

            setProfile({
                username: profileData.username || "",
                full_name: profileData.full_name || "",
                calories_burned: profileData.total_calories_burned || 0,
                workouts_completed: profileData.total_workouts_completed || 0,
                following: "0",
                bio: profileData.bio || "",
                social_links: profileData.social_links || [],
                subscription: profileData.subscription,
                avatar_url: profileData.avatar_url,
                total_time_taken: profileData.total_time_taken || 0,
                focus_areas: profileData.focus_areas || [],
                calendar_data: profileData.calendar_data || [],
            });

        } catch (err) {
            console.error("Error fetching public profile:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!currentUserId || !userId) return;

        setLoadingFollow(true);
        try {
            if (isFollowing) {
                // Unfollow
                const { error } = await supabase.functions.invoke(`activity-feed?action=unfollow`, {
                    method: 'POST',
                    body: {
                        target_id: userId
                    }
                });

                if (error) throw error;
                setIsFollowing(false);
                setShowUnfollowState(false);
            } else {
                // Follow
                const { error } = await supabase.functions.invoke(`activity-feed?action=follow`, {
                    method: 'POST',
                    body: {
                        target_id: userId
                    }
                });

                if (error) throw error;
                setIsFollowing(true);
                // After 2 seconds, switch to "Unfollow" visual state
                setTimeout(() => {
                    setShowUnfollowState(true);
                }, 2000);
            }
        } catch (err) {
            console.error("Error toggling follow:", err);
        } finally {
            setLoadingFollow(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchUserProfile();
        setRefreshing(false);
    }, [userId]);

    useEffect(() => {
        fetchUserProfile();
    }, [userId]);

    if (!userId) {
        router.back();
        return null;
    }

    const renderFollowButton = () => {
        if (loading || error || !currentUserId || currentUserId === userId) return null;

        const isUnfollowMode = isFollowing && showUnfollowState;
        const buttonText = loadingFollow ? "" : (isUnfollowMode ? "Unfollow" : (isFollowing ? "Following" : "Follow"));

        // Compact styling for header button
        const backgroundColor = (!isFollowing || (isFollowing && !showUnfollowState))
            ? selectedPalette.primary
            : colors.surfaceSecondary;

        const textColor = (!isFollowing || (isFollowing && !showUnfollowState))
            ? "white"
            : selectedPalette.primary;

        const iconName = isUnfollowMode
            ? "person-remove-outline"
            : isFollowing
                ? "checkmark-outline"
                : "person-add-outline";

        return (
            <TouchableOpacity
                style={[styles.headerFollowButton, { backgroundColor }]}
                onPress={handleFollowToggle}
                disabled={loadingFollow}
            >
                {loadingFollow ? (
                    <ActivityIndicator size="small" color={textColor} />
                ) : (
                    <>
                        <Ionicons name={iconName} size={16} color={textColor} />
                        <Text style={[styles.headerFollowText, { color: textColor }]}>{buttonText}</Text>
                    </>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScreenHeader
                title={profile.username || "Profile"}
                leftAction={
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                }
                rightAction={renderFollowButton()}
            />
            <PublicProfileView
                userId={userId}
                profile={profile}
                loading={loading}
                error={error}
                onRefresh={onRefresh}
                refreshing={refreshing}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerFollowButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 4,
    },
    headerFollowText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 12,
    }
});
