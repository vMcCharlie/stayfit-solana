import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    TextInput,
    FlatList,
    Image,
    Keyboard,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../src/context/theme";
import { ThemeBackground } from "../../components/ThemeBackground";
import ScreenHeader from "../../components/ScreenHeader";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../../src/lib/supabase";
import { useRouter } from "expo-router";
import { formatDistanceToNow } from "date-fns";
import { getAchievementAsset } from "../../../src/assets/achievements";
import { FilterIcon, SearchIcon } from "../../components/TabIcons";
// Challenge imports removed
import { useFocusEffect } from "expo-router";

const SEARCH_HISTORY_KEY = "search_history";
const PAGE_SIZE = 10;
const LOAD_MORE_THRESHOLD = 0.7; // Load more when 70% scrolled (around item 7 of 10)

// Simple in-memory cache for prefetched profile images
const imageCache = new Set<string>();

// Cached Avatar Component - prefetches and caches profile images
const CachedAvatar = React.memo(({
    uri,
    size = 44,
    fallbackInitial,
    fallbackColor
}: {
    uri?: string | null;
    size?: number;
    fallbackInitial: string;
    fallbackColor: string;
}) => {
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [imageError, setImageError] = React.useState(false);

    React.useEffect(() => {
        if (uri && !imageCache.has(uri)) {
            // Prefetch and cache the image
            Image.prefetch(uri)
                .then(() => {
                    imageCache.add(uri);
                    setImageLoaded(true);
                })
                .catch(() => {
                    setImageError(true);
                });
        } else if (uri && imageCache.has(uri)) {
            setImageLoaded(true);
        }
    }, [uri]);

    if (!uri || imageError) {
        return (
            <View style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: fallbackColor,
                    justifyContent: 'center',
                    alignItems: 'center',
                }
            ]}>
                <Text style={{
                    color: '#FFFFFF',
                    fontSize: size * 0.4,
                    fontFamily: 'Outfit-Bold'
                }}>
                    {fallbackInitial.toUpperCase()}
                </Text>
            </View>
        );
    }

    return (
        <Image
            source={{ uri, cache: 'force-cache' }}
            style={{
                width: size,
                height: size,
                borderRadius: size / 2
            }}
            onError={() => setImageError(true)}
        />
    );
});

interface UserProfile {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
    avatar_thumbnail_url?: string;
}

interface ActivityItem {
    id: string;
    type: 'workout_completed' | 'achievement_unlocked' | 'streak_milestone' | 'weekly_goal_met';
    created_at: string;
    data: any;
    user_id: string;
    profiles: {
        username: string;
        full_name: string;
        avatar_url: string | null;
        avatar_thumbnail_url: string | null;
    };
}

type ActivityType = 'all' | 'workout_completed' | 'achievement_unlocked' | 'streak_milestone' | 'weekly_goal_met';

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
    'all': 'All Activities',
    'workout_completed': 'Workouts',
    'achievement_unlocked': 'Achievements',
    'streak_milestone': 'Streaks',
    'weekly_goal_met': 'Goals',
};

export default function ActivityScreen() {
    const { isDarkMode, selectedPalette } = useTheme();
    const router = useRouter();
    const inputRef = useRef<TextInput>(null);

    // View Mode: 'feed' or 'search'
    const [viewMode, setViewMode] = useState<'feed' | 'search'>('feed');

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasPerformedSearch, setHasPerformedSearch] = useState(false);

    // Feed State
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loadingFeed, setLoadingFeed] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);

    // Filter State (temporary - resets on tab visit)
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filterType, setFilterType] = useState<ActivityType>('all');
    const [filterUserId, setFilterUserId] = useState<string | null>(null);

    const [followedUsers, setFollowedUsers] = useState<UserProfile[]>([]);

    // Challenge State removed

    const colors = {
        background: isDarkMode
            ? selectedPalette.dark.background
            : selectedPalette.light.background,
        surface: isDarkMode
            ? selectedPalette.dark.surface
            : selectedPalette.light.surface,
        surfaceSecondary: isDarkMode
            ? `${selectedPalette.primary}15`
            : `${selectedPalette.primary}10`,
        text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
        textSecondary: isDarkMode
            ? "rgba(255, 255, 255, 0.6)"
            : "rgba(0, 0, 0, 0.5)",
        border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        inputBackground: isDarkMode ? "#2A2A2A" : "#F5F5F5",
        cardBackground: isDarkMode ? "#1E1E1E" : "#FFFFFF",
    };

    useEffect(() => {
        loadSearchHistory();
        fetchActivities(true);
        fetchFollowedUsers();
    }, []);

    // Reset filters when tab loses focus (handled by resetting state on mount)
    useEffect(() => {
        // Reset filters when component mounts (user visits tab)
        setFilterType('all');
        setFilterUserId(null);
    }, []);

    const fetchFollowedUsers = async () => {
        try {
            const { data, error } = await supabase.functions.invoke('activity-feed?action=get_following', {
                method: 'GET',
            });

            if (error) throw error;

            if (data && data.following) {
                setFollowedUsers(data.following);

                // Prefetch avatars for followed users
                data.following.forEach((user: UserProfile) => {
                    if (user.avatar_url && !imageCache.has(user.avatar_url)) {
                        Image.prefetch(user.avatar_url).then(() => {
                            imageCache.add(user.avatar_url!);
                        }).catch(() => { });
                    }
                });
            }
        } catch (error) {
            console.error("Error fetching followed users:", error);
        }
    };

    const fetchActivities = async (reset: boolean = false) => {
        if (reset) {
            setLoadingFeed(true);
            setOffset(0);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const currentOffset = reset ? 0 : offset;
            let url = `activity-feed?limit=${PAGE_SIZE}&offset=${currentOffset}`;

            // Add filters
            if (filterType !== 'all') {
                url += `&type=${filterType}`;
            }
            if (filterUserId) {
                url += `&user_id=${filterUserId}`;
            }

            const { data, error } = await supabase.functions.invoke(url, {
                method: 'GET',
            });

            if (error) throw error;

            if (data && data.activities) {
                if (reset) {
                    setActivities(data.activities);
                } else {
                    setActivities(prev => {
                        const existingIds = new Set(prev.map(item => item.id));
                        const newActivities = data.activities.filter((item: ActivityItem) => !existingIds.has(item.id));
                        return [...prev, ...newActivities];
                    });
                }

                // Prefetch profile photos for caching
                data.activities.forEach((activity: ActivityItem) => {
                    const profile = Array.isArray(activity.profiles) ? activity.profiles[0] : activity.profiles;
                    if (profile?.avatar_url && !imageCache.has(profile.avatar_url)) {
                        Image.prefetch(profile.avatar_url).then(() => {
                            imageCache.add(profile.avatar_url);
                        }).catch(() => { });
                    }
                });

                // Check if there are more items
                setHasMore(data.activities.length === PAGE_SIZE);
                setOffset(currentOffset + data.activities.length);
            }
        } catch (error) {
            console.error("Error fetching activities:", error);
        } finally {
            setLoadingFeed(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchActivities(true);
    }, [filterType, filterUserId]);

    const loadMoreActivities = () => {
        if (!loadingMore && hasMore && !loadingFeed) {
            fetchActivities(false);
        }
    };

    const applyFilters = () => {
        setShowFilterModal(false);
        fetchActivities(true);
    };

    const clearFilters = () => {
        setFilterType('all');
        setFilterUserId(null);
        setShowFilterModal(false);
        // Fetch with cleared filters after state update
        setTimeout(() => fetchActivities(true), 0);
    };

    const isFilterActive = filterType !== 'all' || filterUserId !== null;

    const loadSearchHistory = async () => {
        try {
            const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
            if (history) {
                setRecentSearches(JSON.parse(history));
            }
        } catch (e) {
            console.error("Failed to load search history", e);
        }
    };

    const saveSearchHistory = async (newHistory: string[]) => {
        try {
            await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
            setRecentSearches(newHistory);
        } catch (e) {
            console.error("Failed to save search history", e);
        }
    };

    const addToHistory = (query: string) => {
        const cleanQuery = query.trim();
        if (!cleanQuery) return;

        let newHistory = recentSearches.filter(item => item.toLowerCase() !== cleanQuery.toLowerCase());
        newHistory.unshift(cleanQuery);
        if (newHistory.length > 10) newHistory = newHistory.slice(0, 10);

        saveSearchHistory(newHistory);
    };

    const removeFromHistory = (query: string) => {
        const newHistory = recentSearches.filter(item => item !== query);
        saveSearchHistory(newHistory);
    };

    const clearHistory = () => {
        saveSearchHistory([]);
    };

    const handleSearch = async (queryOverride?: string) => {
        const term = typeof queryOverride === 'string' ? queryOverride : searchQuery;

        if (!term.trim()) return;

        if (typeof queryOverride === 'string') {
            setSearchQuery(queryOverride);
        }

        Keyboard.dismiss();
        setIsSearching(true);
        setHasPerformedSearch(true);
        setSearchResults([]);

        addToHistory(term);

        try {
            const { data, error } = await supabase.functions.invoke('activity-feed', {
                method: 'GET',
                headers: {
                    // Pass params via query string for GET in edge functions usually, but invoke options support 'body'.
                    // However, standard GET doesn't have body. Supabase invoke wraps fetch.
                    // Ideally we use query params for GET.
                },
                // invoke doesn't easily support query params in the URL directly via a dedicated 'params' object property in all versions,
                // but we can append to the function name/url if needed or use body if we change method to POST.
                // But my function expects GET for search.
                // Let's rely on standard practice: append query params to the function name? No, invoke handles 'body'.
                // Actually, supabase-js `invoke` allows body for POST. For GET, it's trickier to pass query params cleanly 
                // without manually constructing the URL if the client library doesn't support a 'params' object.
                // But wait, my function reads `url.searchParams`.
                // I can pass query params in the function name argument? e.g. 'activity-feed?action=search&query=...'
            });

            // To be safe and cleaner, let's use the explicit query string in the first argument.
            const { data: searchData, error: searchError } = await supabase.functions.invoke(`activity-feed?action=search&query=${encodeURIComponent(term.trim())}`, {
                method: 'GET'
            });

            if (searchError) throw searchError;

            if (searchData && searchData.results) {
                setSearchResults(searchData.results);
            }
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const switchToSearch = () => {
        setViewMode('search');
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleBackToFeed = () => {
        setViewMode('feed');
        setSearchQuery("");
        setSearchResults([]);
        setHasPerformedSearch(false);
        Keyboard.dismiss();
    };

    // Helper to format time using date-fns
    const formatTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch (e) {
            return new Date(dateString).toLocaleDateString();
        }
    };

    // Helper to format achievement codes nicely (remove underscores, capitalize)
    const formatAchievementName = (code: string) => {
        if (!code) return 'Achievement';
        return code
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Helper to format duration in minutes
    const formatDuration = (seconds: number) => {
        if (!seconds) return '0 min';
        const mins = Math.round(seconds / 60);
        return `${mins} min`;
    };

    const navigateToProfile = (userId: string) => {
        router.push({ pathname: "/(tabs)/activity/public-profile", params: { userId } });
    };

    // Helper to get achievement asset name from code and tier/level
    const getAchievementAssetName = (code: string, tier?: string, level?: number) => {
        const normalizedCode = code.toLowerCase();
        let tierSuffix = '_bronze';

        // Use tier if provided, otherwise derive from level
        if (tier) {
            tierSuffix = `_${tier.toLowerCase()}`;
        } else if (level) {
            switch (level) {
                case 1: tierSuffix = '_bronze'; break;
                case 2: tierSuffix = '_silver'; break;
                case 3: tierSuffix = '_gold'; break;
                case 4: tierSuffix = '_purple'; break;
                default: tierSuffix = '_bronze';
            }
        }

        return `${normalizedCode}${tierSuffix}`;
    };

    const renderActivityItem = ({ item }: { item: ActivityItem }) => {
        let actionText = "";
        let details = "";
        let subDetails = "";
        let thumbnailSource: any = null;
        let showThumbnail = false;

        // Handle potential array return from Supabase
        const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
        const username = profile?.username || 'User';

        switch (item.type) {
            case 'workout_completed':
                actionText = "completed";
                details = item.data.routine_name || 'Workout';
                const timeStr = new Date(item.data.completed_at || item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                subDetails = `${formatDuration(item.data.duration)} • ${Math.round(item.data.calories) || 0} kcal • ${timeStr}`;
                // Show routine cover image if available
                if (item.data.routine_image) {
                    thumbnailSource = { uri: item.data.routine_image };
                    showThumbnail = true;
                }
                break;
            case 'achievement_unlocked':
                actionText = "unlocked";
                const tierName = item.data.tier || 'bronze';
                details = `${formatAchievementName(item.data.achievement_code)} (${tierName.charAt(0).toUpperCase() + tierName.slice(1)})`;
                // Use local achievement assets - prioritize tier, fallback to level
                const assetName = getAchievementAssetName(
                    item.data.achievement_code,
                    item.data.tier,
                    item.data.level
                );
                thumbnailSource = getAchievementAsset(assetName);
                showThumbnail = true;
                break;
            case 'streak_milestone':
                actionText = "is on fire!";
                details = `${item.data.streak}-Day Streak`;
                subDetails = "Consistency is key!";
                // Use streak master asset for streak milestones
                thumbnailSource = getAchievementAsset('streak_master_gold');
                showThumbnail = true;
                break;
            case 'weekly_goal_met':
                actionText = "crushed their weekly goal";
                details = `${item.data.goal} Workouts This Week`;
                subDetails = "Goal achieved!";
                break;
            default:
                actionText = "did something";
        }

        const handleBodyPress = () => {
            if (item.type === 'workout_completed' && item.data.routine_id) {
                router.push({
                    pathname: "../components/routine",
                    params: {
                        routineId: item.data.routine_id,
                        coverImage: item.data.routine_image
                    }
                });
            } else {
                navigateToProfile(item.user_id);
            }
        };

        return (
            <View style={styles.activityCardWrapper}>
                <LinearGradient
                    colors={isDarkMode ? ['#252525', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
                    style={[styles.activityCard, { borderColor: colors.border, borderWidth: 1 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                >
                    {/* Header: User & Time - Clickable -> Profile */}
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => navigateToProfile(item.user_id)}
                        style={styles.cardHeader}
                    >
                        <View style={styles.headerUserRow}>
                            <View style={styles.avatarContainer}>
                                <CachedAvatar
                                    uri={profile?.avatar_thumbnail_url || profile?.avatar_url}
                                    size={36}
                                    fallbackInitial={username.charAt(0)}
                                    fallbackColor={selectedPalette.primary}
                                />
                            </View>
                            <View>
                                <View style={styles.activityTextRow}>
                                    <Text style={[styles.activityUser, { color: selectedPalette.primary }]}>
                                        @{username}
                                    </Text>
                                    <Text style={[styles.activityAction, { color: colors.textSecondary }]}>
                                        {" " + actionText}
                                    </Text>
                                </View>
                                <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                                    {formatTime(item.created_at)}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Content Body - Clickable -> Workout or Profile */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleBodyPress}
                        style={styles.cardBody}
                    >
                        <View style={styles.cardContentLeft}>
                            <Text style={[styles.routineTitle, { color: colors.text }]} numberOfLines={2}>
                                {details}
                            </Text>

                            {item.type === 'workout_completed' && (
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Ionicons name="time-outline" size={14} color={selectedPalette.primary} />
                                        <Text style={[styles.statText, { color: colors.textSecondary }]}>
                                            {formatDuration(item.data.duration)}
                                        </Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Ionicons name="flame-outline" size={14} color={selectedPalette.primary} />
                                        <Text style={[styles.statText, { color: colors.textSecondary }]}>
                                            {Math.round(item.data.calories) || 0} kcal
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Sub details for other types */}
                            {item.type !== 'workout_completed' && subDetails ? (
                                <Text style={[styles.activitySubDetails, { color: colors.textSecondary, marginTop: 4 }]} numberOfLines={1}>
                                    {subDetails}
                                </Text>
                            ) : null}
                        </View>

                        {/* Right Image */}
                        {showThumbnail && thumbnailSource && (
                            <View style={[styles.thumbnailContainerLarge, { backgroundColor: colors.surfaceSecondary }]}>
                                <Image
                                    source={thumbnailSource}
                                    style={[
                                        styles.activityThumbnailLarge,
                                        item.type === 'achievement_unlocked' || item.type === 'streak_milestone'
                                            ? styles.achievementThumbnail
                                            : null
                                    ]}
                                    resizeMode={item.type === 'workout_completed' ? 'cover' : 'contain'}
                                />
                            </View>
                        )}
                    </TouchableOpacity>
                </LinearGradient>
            </View>
        );
    };

    // ActiveChallengeCard removed

    const renderSearchHeader = () => (
        <View style={styles.searchHeaderContainer}>
            <TouchableOpacity onPress={handleBackToFeed} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={[styles.searchInputContainer, { backgroundColor: colors.inputBackground }]}>
                <TextInput
                    ref={inputRef}
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search people..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={() => handleSearch()}
                    returnKeyType="search"
                    autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                        <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const renderMainHeader = () => (
        <ScreenHeader
            title="Activity"
            rightAction={
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => setShowFilterModal(true)}
                        style={styles.headerActionButton}
                    >
                        <FilterIcon
                            size={22}
                            color={isFilterActive ? selectedPalette.primary : colors.text}
                        />
                        {isFilterActive && (
                            <View style={[styles.filterBadge, { backgroundColor: selectedPalette.primary }]} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={switchToSearch} style={styles.headerActionButton}>
                        <SearchIcon size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
            }
        />
    );

    const renderFilterModal = () => {
        // Icons for activity types
        const typeIcons: Record<ActivityType, string> = {
            'all': 'grid-outline',
            'workout_completed': 'barbell-outline',
            'achievement_unlocked': 'trophy-outline',
            'streak_milestone': 'flame-outline',
            'weekly_goal_met': 'checkmark-circle-outline',
        };

        return (
            <Modal
                visible={showFilterModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.filterModalOverlay}>
                    <TouchableOpacity
                        style={styles.filterModalBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowFilterModal(false)}
                    />
                    <View style={[styles.filterModalContainer, { backgroundColor: colors.surface }]}>
                        {/* Close Button */}
                        <TouchableOpacity
                            style={styles.filterCloseButton}
                            onPress={() => setShowFilterModal(false)}
                        >
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.filterScrollContent}
                        >
                            {/* Activity Type Section */}
                            <Text style={[styles.filterSectionLabel, { color: colors.text }]}>
                                Activity Type
                            </Text>
                            <View style={styles.filterChipsContainer}>
                                {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((type) => {
                                    const isSelected = filterType === type;
                                    return (
                                        <TouchableOpacity
                                            key={type}
                                            style={[
                                                styles.filterPill,
                                                isSelected && styles.filterPillSelected,
                                                {
                                                    borderColor: isSelected
                                                        ? selectedPalette.primary
                                                        : colors.border,
                                                    backgroundColor: isSelected
                                                        ? `${selectedPalette.primary}15`
                                                        : 'transparent',
                                                }
                                            ]}
                                            onPress={() => setFilterType(type)}
                                            activeOpacity={0.7}
                                        >
                                            {isSelected && (
                                                <View style={[styles.filterPillCheck, { backgroundColor: selectedPalette.primary }]}>
                                                    <Ionicons name="checkmark" size={12} color="#FFF" />
                                                </View>
                                            )}
                                            <Text style={[
                                                styles.filterPillText,
                                                { color: isSelected ? selectedPalette.primary : colors.text }
                                            ]}>
                                                {ACTIVITY_TYPE_LABELS[type]}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* User Section */}
                            <Text style={[styles.filterSectionLabel, { color: colors.text, marginTop: 28 }]}>
                                From User
                            </Text>
                            <View style={styles.filterChipsContainer}>
                                {/* All Users Option */}
                                <TouchableOpacity
                                    style={[
                                        styles.filterPill,
                                        filterUserId === null && styles.filterPillSelected,
                                        {
                                            borderColor: filterUserId === null
                                                ? selectedPalette.primary
                                                : colors.border,
                                            backgroundColor: filterUserId === null
                                                ? `${selectedPalette.primary}15`
                                                : 'transparent',
                                        }
                                    ]}
                                    onPress={() => setFilterUserId(null)}
                                    activeOpacity={0.7}
                                >
                                    {filterUserId === null && (
                                        <View style={[styles.filterPillCheck, { backgroundColor: selectedPalette.primary }]}>
                                            <Ionicons name="checkmark" size={12} color="#FFF" />
                                        </View>
                                    )}
                                    <Text style={[
                                        styles.filterPillText,
                                        { color: filterUserId === null ? selectedPalette.primary : colors.text }
                                    ]}>
                                        Everyone
                                    </Text>
                                </TouchableOpacity>

                                {/* Individual Users */}
                                {followedUsers.map((user) => {
                                    const isSelected = filterUserId === user.id;
                                    return (
                                        <TouchableOpacity
                                            key={user.id}
                                            style={[
                                                styles.filterPillWithAvatar,
                                                isSelected && styles.filterPillSelected,
                                                {
                                                    borderColor: isSelected
                                                        ? selectedPalette.primary
                                                        : colors.border,
                                                    backgroundColor: isSelected
                                                        ? `${selectedPalette.primary}15`
                                                        : 'transparent',
                                                }
                                            ]}
                                            onPress={() => setFilterUserId(user.id)}
                                            activeOpacity={0.7}
                                        >
                                            {isSelected ? (
                                                <View style={[styles.filterPillCheck, { backgroundColor: selectedPalette.primary }]}>
                                                    <Ionicons name="checkmark" size={12} color="#FFF" />
                                                </View>
                                            ) : (
                                                user.avatar_url || user.avatar_thumbnail_url ? (
                                                    <Image
                                                        source={{ uri: user.avatar_thumbnail_url || user.avatar_url }}
                                                        style={styles.filterPillAvatar}
                                                    />
                                                ) : (
                                                    <View style={[styles.filterPillAvatarPlaceholder, { backgroundColor: selectedPalette.primary }]}>
                                                        <Text style={styles.filterPillAvatarText}>
                                                            {(user.username || '?').charAt(0).toUpperCase()}
                                                        </Text>
                                                    </View>
                                                )
                                            )}
                                            <Text style={[
                                                styles.filterPillText,
                                                { color: isSelected ? selectedPalette.primary : colors.text }
                                            ]}>
                                                @{user.username}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        {/* Show Results Button */}
                        <View style={styles.filterButtonContainer}>
                            {isFilterActive && (
                                <TouchableOpacity
                                    style={[styles.filterResetButton, { borderColor: colors.border }]}
                                    onPress={clearFilters}
                                >
                                    <Ionicons name="refresh-outline" size={20} color={colors.text} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[
                                    styles.filterShowButton,
                                    { backgroundColor: selectedPalette.primary },
                                    !isFilterActive && { flex: 1 }
                                ]}
                                onPress={applyFilters}
                            >
                                <Text style={styles.filterShowButtonText}>
                                    Show Results
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    const renderUserResult = ({ item }: { item: UserProfile }) => (
        <TouchableOpacity
            style={[styles.userCard, { backgroundColor: colors.surface }]}
            onPress={() => {
                router.push({
                    pathname: "/(tabs)/activity/public-profile",
                    params: { userId: item.id }
                });
            }}
        >
            <CachedAvatar
                uri={item.avatar_thumbnail_url || item.avatar_url}
                size={50}
                fallbackInitial={(item.full_name || item.username || "?").charAt(0)}
                fallbackColor={selectedPalette.primary}
            />
            <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>{item.full_name}</Text>
                <Text style={[styles.userHandle, { color: colors.textSecondary }]}>@{item.username}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    const renderHistoryItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={styles.historyItem}
            onPress={() => handleSearch(item)}
        >
            <View style={styles.historyLeft}>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.historyText, { color: colors.text }]}>{item}</Text>
            </View>
            <TouchableOpacity onPress={() => removeFromHistory(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    // Main Content Renderer
    const renderContent = () => {
        if (viewMode === 'search') {
            if (isSearching) {
                return (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={selectedPalette.primary} />
                    </View>
                );
            }

            if (hasPerformedSearch && searchQuery.trim() !== "") {
                if (searchResults.length > 0) {
                    return (
                        <FlatList
                            data={searchResults}
                            renderItem={renderUserResult}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                        />
                    );
                } else {
                    return (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                No user found "{searchQuery}"
                            </Text>
                        </View>
                    );
                }
            }

            if (recentSearches.length > 0) {
                return (
                    <View style={styles.historyContainer}>
                        <View style={styles.historyHeader}>
                            <Text style={[styles.historyTitle, { color: colors.text }]}>Recent</Text>
                            <TouchableOpacity onPress={clearHistory}>
                                <Text style={[styles.clearText, { color: selectedPalette.primary }]}>Clear all</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={recentSearches}
                            renderItem={renderHistoryItem}
                            keyExtractor={(item) => item}
                            keyboardShouldPersistTaps="handled"
                        />
                    </View>
                );
            }

            return (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        Find friends to follow
                    </Text>
                </View>
            );
        }

        // FEED VIEW
        if (loadingFeed && !refreshing) { // Only show full spinner if not pull-to-refresh
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={selectedPalette.primary} />
                </View>
            );
        }

        if (activities.length === 0) {
            // Different empty state based on whether filters are active
            if (isFilterActive) {
                return (
                    <ScrollView
                        contentContainerStyle={{ flex: 1 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={selectedPalette.primary} />
                        }
                    >
                        <View style={styles.emptyContainer}>
                            <Ionicons name="funnel-outline" size={80} color={colors.surfaceSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                No matching activities
                            </Text>
                            <Text style={[styles.subEmptyText, { color: colors.textSecondary }]}>
                                Try adjusting your filters to see more results
                            </Text>
                            <TouchableOpacity
                                style={[styles.findFriendsButton, { backgroundColor: selectedPalette.primary }]}
                                onPress={() => {
                                    clearFilters();
                                }}
                            >
                                <Text style={styles.findFriendsButtonText}>Clear Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                );
            }

            return (
                <ScrollView
                    contentContainerStyle={{ flex: 1 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={selectedPalette.primary} />
                    }
                >
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={80} color={colors.surfaceSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No recent activity
                        </Text>
                        <Text style={[styles.subEmptyText, { color: colors.textSecondary }]}>
                            Follow people to see their updates here!
                        </Text>
                        <TouchableOpacity
                            style={[styles.findFriendsButton, { backgroundColor: selectedPalette.primary }]}
                            onPress={switchToSearch}
                        >
                            <Text style={styles.findFriendsButtonText}>Find Friends</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            );
        }

        return (
            <FlatList
                data={activities}
                renderItem={renderActivityItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={selectedPalette.primary} />
                }
                onEndReached={loadMoreActivities}
                onEndReachedThreshold={LOAD_MORE_THRESHOLD}
                ListFooterComponent={
                    loadingMore ? (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator size="small" color={selectedPalette.primary} />
                        </View>
                    ) : null
                }
                ListHeaderComponent={
                    <View>
                        {viewMode === 'feed' && (
                            <View style={{ marginTop: 10 }}>
                                {/* Challenge card removed */}
                            </View>
                        )}
                        {isFilterActive ? (
                            <View style={[styles.activeFilterBanner, { backgroundColor: `${selectedPalette.primary}15` }]}>
                                <Text style={[styles.activeFilterText, { color: selectedPalette.primary }]}>
                                    Filters active: {filterType !== 'all' ? ACTIVITY_TYPE_LABELS[filterType] : ''}
                                    {filterUserId ? ` • ${followedUsers.find(u => u.id === filterUserId)?.username || 'User'}` : ''}
                                </Text>
                                <TouchableOpacity onPress={clearFilters}>
                                    <Text style={[styles.clearFilterText, { color: selectedPalette.primary }]}>Clear</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>
                }
            />
        );
    };

    return (
        <ThemeBackground style={{ flex: 1 }}>
            <SafeAreaView
                style={[styles.container, { backgroundColor: 'transparent' }]}
                edges={['top']}
            >
                {viewMode === 'search' ? renderSearchHeader() : renderMainHeader()}
                {renderContent()}
                {renderFilterModal()}
            </SafeAreaView>
        </ThemeBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchHeaderContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        minHeight: 64,
    },
    backButton: {
        padding: 4,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 24,
        paddingHorizontal: 16,
        height: 48,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: "Outfit-Regular",
        marginRight: 8,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: "Outfit-Medium",
        textAlign: "center",
        marginTop: 16,
    },
    subEmptyText: {
        fontSize: 14,
        fontFamily: "Outfit-Regular",
        textAlign: "center",
        marginTop: 8,
        opacity: 0.7,
        marginBottom: 24,
    },
    findFriendsButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    findFriendsButtonText: {
        color: 'white',
        fontFamily: 'Outfit-Bold',
        fontSize: 16,
    },
    listContent: {
        padding: 16,
    },
    // Activity Card Styles
    activityCardWrapper: {
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    activityCard: {
        borderRadius: 16,
        padding: 16,
        overflow: 'hidden',
    },
    cardHeader: {
        marginBottom: 12,
    },
    headerUserRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        marginRight: 10,
    },
    activityTextRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    activityUser: {
        fontSize: 14,
        fontFamily: "Outfit-Bold",
    },
    activityAction: {
        fontSize: 14,
        fontFamily: "Outfit-Regular",
    },
    activityTime: {
        fontSize: 11,
        fontFamily: "Outfit-Regular",
        marginTop: 2,
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardContentLeft: {
        flex: 1,
        marginRight: 12,
    },
    routineTitle: {
        fontSize: 18,
        fontFamily: "Outfit-Bold",
        marginBottom: 8,
        lineHeight: 24,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 13,
        fontFamily: "Outfit-Medium",
    },
    activitySubDetails: {
        fontSize: 13,
        fontFamily: "Outfit-Regular",
    },
    thumbnailContainerLarge: {
        width: 70,
        height: 70,
        borderRadius: 12,
        overflow: 'hidden',
    },
    activityThumbnailLarge: {
        width: '100%',
        height: '100%',
    },
    achievementThumbnail: {
        backgroundColor: 'transparent',
    },
    activityThumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },

    // Search & History Styles
    historyContainer: {
        flex: 1,
        padding: 16,
    },
    historyHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    historyTitle: {
        fontSize: 18,
        fontFamily: "Outfit-Bold",
    },
    clearText: {
        fontSize: 14,
        fontFamily: "Outfit-Medium",
    },
    historyItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
    },
    historyLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    historyText: {
        fontSize: 16,
        fontFamily: "Outfit-Regular",
    },
    userCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarInitial: {
        color: "#FFFFFF",
        fontSize: 24,
        fontFamily: "Outfit-Bold",
    },
    userInfo: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        fontSize: 16,
        fontFamily: "Outfit-Bold",
    },
    userHandle: {
        fontSize: 14,
        fontFamily: "Outfit-Regular",
    },
    // Header Actions
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerActionButton: {
        padding: 4,
        position: 'relative',
    },
    filterBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    // Filter Modal Styles - Clean Chip Design
    filterModalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterModalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    filterModalContainer: {
        width: '90%',
        maxWidth: 400,
        maxHeight: '80%',
        borderRadius: 20,
        paddingTop: 16,
        paddingBottom: 20,
        paddingHorizontal: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
    },
    filterCloseButton: {
        alignSelf: 'flex-start',
        padding: 4,
        marginBottom: 8,
    },
    filterScrollContent: {
        paddingBottom: 16,
    },
    filterSectionLabel: {
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
        marginBottom: 16,
    },
    filterChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 50,
        borderWidth: 1.5,
        gap: 6,
    },
    filterPillWithAvatar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingLeft: 6,
        paddingRight: 14,
        borderRadius: 50,
        borderWidth: 1.5,
        gap: 8,
    },
    filterPillSelected: {
        // Additional styles applied inline
    },
    filterPillCheck: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterPillText: {
        fontSize: 14,
        fontFamily: 'Outfit-Medium',
    },
    filterPillAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    filterPillAvatarPlaceholder: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterPillAvatarText: {
        color: '#FFF',
        fontSize: 12,
        fontFamily: 'Outfit-Bold',
    },
    filterButtonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    filterResetButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterShowButton: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterShowButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
    },
    // Loading and Active Filter Banner
    loadingMore: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    activeFilterBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    activeFilterText: {
        fontSize: 14,
        fontFamily: 'Outfit-Medium',
        flex: 1,
    },
    clearFilterText: {
        fontSize: 14,
        fontFamily: 'Outfit-Bold',
    },
});
