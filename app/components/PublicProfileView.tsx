import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    Linking, // Add Linking
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/theme";
import { useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import ProfileCalendar from "../components/ProfileCalendar";
import { Svg, Polygon, Line, Text as SvgText } from "react-native-svg";
import { api } from "../../src/services/api";
import AchievementsList from "../../src/components/achievements/AchievementsList";
import { FacebookIcon, InstagramIcon, YoutubeIcon, LinkIcon, TikTokIcon, BadgesIcon, ClockIcon, FireIcon } from "./TabIcons";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    interpolate,
    Easing,
} from "react-native-reanimated";

const PROFILE_SIZE = 200;
const SOCIAL_ICON_SIZE = 40;

interface SocialLink {
    id?: string;
    url: string;
}

interface Profile {
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


const formatRangeDate = (date: Date) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getDate()}`;
};

interface FocusAreaStat {
    area: string;
    times_targeted: number;
    avg_intensity: number;
    intensity?: number; // Optional as it might be used in mapping
}

const formatTotalTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

interface PublicProfileViewProps {
    userId: string;
    profile: Profile;
    loading: boolean;
    error: string | null;
    onRefresh: () => void;
    refreshing: boolean;
    onProfileLoaded?: (profile: Profile) => void;
}

export default function PublicProfileView({
    userId,
    profile,
    loading,
    error,
    onRefresh,
    refreshing
}: PublicProfileViewProps) {
    const { isDarkMode, selectedPalette } = useTheme();
    const router = useRouter();
    const [imageVersion, setImageVersion] = useState<number>(Date.now());
    const [selectedTab, setSelectedTab] = useState("achievements");
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyEndDate, setHistoryEndDate] = useState(new Date());
    const isCurrentWeek = new Date(historyEndDate).toDateString() === new Date().toDateString();

    const handlePrevWeek = () => {
        const newDate = new Date(historyEndDate);
        newDate.setDate(newDate.getDate() - 7);
        setHistoryEndDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(historyEndDate);
        newDate.setDate(newDate.getDate() + 7);
        if (newDate > new Date()) {
            setHistoryEndDate(new Date());
        } else {
            setHistoryEndDate(newDate);
        }
    };

    useEffect(() => {
        if (selectedTab === 'history') {
            fetchHistory();
        }
    }, [selectedTab, userId, historyEndDate]);

    const fetchHistory = async () => {
        try {
            setLoadingHistory(true);
            const endDate = new Date(historyEndDate);
            endDate.setHours(23, 59, 59, 999);

            const startDate = new Date(historyEndDate);
            startDate.setDate(startDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);

            // Fetch history for the specific user
            const history = await api.getWorkoutHistory(startDate, endDate, userId);
            setHistoryData(history || []);
        } catch (error) {
            console.error("Error fetching public history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const colors = {
        background: isDarkMode
            ? selectedPalette.dark.background
            : selectedPalette.light.background,
        surface: isDarkMode
            ? selectedPalette.dark.surface
            : selectedPalette.light.surface,
        surfaceSecondary: isDarkMode
            ? `${selectedPalette.primary}20`
            : `${selectedPalette.primary}15`,
        text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
        textSecondary: isDarkMode
            ? "rgba(255, 255, 255, 0.7)"
            : "rgba(0, 0, 0, 0.6)",
        border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    };

    const getSocialTypeFromUrl = (url: string) => {
        const domain = url.toLowerCase();
        if (domain.includes("facebook.com")) return "facebook";
        if (domain.includes("instagram.com")) return "instagram";
        if (domain.includes("tiktok.com")) return "tiktok";
        if (domain.includes("twitter.com")) return "twitter";
        if (domain.includes("linkedin.com")) return "linkedin";
        if (domain.includes("youtube.com") || domain.includes("youtu.be")) return "youtube";
        return "web";
    };

    const renderFocusAreaChart = () => {
        if (!profile.focus_areas || profile.focus_areas.length === 0) return null;

        const centerX = 150;
        const centerY = 150;
        const radius = 100; // Slightly smaller for profile view
        const numPoints = profile.focus_areas.length;
        const maxIntensity = 10;

        const getPoint = (index: number, intensity: number) => {
            const angle = (index * 2 * Math.PI) / numPoints - Math.PI / 2;
            const distance = (intensity / maxIntensity) * radius;
            return {
                x: centerX + distance * Math.cos(angle),
                y: centerY + distance * Math.sin(angle),
            };
        };

        const points = profile.focus_areas
            .map((data, index) => {
                const point = getPoint(index, data.intensity || data.avg_intensity || 0); // Handle varying field names
                return `${point.x},${point.y}`;
            })
            .join(" ");

        const backgroundLevels = [0.2, 0.4, 0.6, 0.8, 1];
        const backgroundWebs = backgroundLevels.map((level) => {
            return Array.from({ length: numPoints }, (_, i) => {
                const point = getPoint(i, maxIntensity * level);
                return `${point.x},${point.y}`;
            }).join(" ");
        });

        return (
            <View
                style={[
                    styles.card,
                    {
                        backgroundColor: 'transparent',
                        borderColor: colors.border,
                        padding: 0,
                        overflow: 'hidden',
                    },
                ]}
            >
                <LinearGradient
                    colors={isDarkMode ? ['#252525', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ padding: 16 }}
                >
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Focus Areas</Text>
                    </View>
                    <View style={{ alignItems: 'center', marginVertical: 10 }}>
                        <Svg width={300} height={300}>
                            {backgroundWebs.map((points, i) => (
                                <Polygon
                                    key={`web-${i}`}
                                    points={points}
                                    fill="none"
                                    stroke={colors.border}
                                    strokeWidth="0.5"
                                />
                            ))}

                            {profile.focus_areas.map((_, i) => {
                                const point = getPoint(i, maxIntensity);
                                return (
                                    <Line
                                        key={`axis-${i}`}
                                        x1={centerX}
                                        y1={centerY}
                                        x2={point.x}
                                        y2={point.y}
                                        stroke={colors.border}
                                        strokeWidth="0.5"
                                    />
                                );
                            })}

                            <Polygon
                                points={points}
                                fill={`${selectedPalette.primary}40`}
                                stroke={selectedPalette.primary}
                                strokeWidth="2"
                            />

                            {profile.focus_areas.map((data, i) => {
                                const point = getPoint(i, maxIntensity + 0.5); // reduced padding
                                // Adjust label position based on angle to avoid overlap
                                const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
                                const labelX = centerX + (radius + 20) * Math.cos(angle);
                                const labelY = centerY + (radius + 20) * Math.sin(angle);

                                return (
                                    <View key={`label-${i}`}>
                                        <SvgText
                                            x={labelX}
                                            y={labelY}
                                            fill={colors.textSecondary}
                                            fontSize="12"
                                            fontWeight="500"
                                            textAnchor="middle"
                                            alignmentBaseline="middle"
                                            fontFamily="Outfit-Regular"
                                        >
                                            {data.area}
                                        </SvgText>
                                    </View>
                                );
                            })}
                        </Svg>
                    </View>
                </LinearGradient>
            </View>
        );
    };

    const [currentCalorieDate, setCurrentCalorieDate] = useState(new Date());

    const renderActivityGraph = () => {
        const days = ["S", "M", "T", "W", "T", "F", "S"];
        const currentMonth = currentCalorieDate.toLocaleString("default", { month: "long" });
        const currentYear = currentCalorieDate.getFullYear();

        const handlePrevMonth = () => {
            const newDate = new Date(currentCalorieDate);
            newDate.setMonth(newDate.getMonth() - 1);
            setCurrentCalorieDate(newDate);
        };

        const handleNextMonth = () => {
            const newDate = new Date(currentCalorieDate);
            newDate.setMonth(newDate.getMonth() + 1);
            setCurrentCalorieDate(newDate);
        };

        const generateGridData = () => {
            const gridData = [];
            const firstDayOfMonth = new Date(currentCalorieDate.getFullYear(), currentCalorieDate.getMonth(), 1);
            const lastDayOfMonth = new Date(currentCalorieDate.getFullYear(), currentCalorieDate.getMonth() + 1, 0);
            const totalDays = lastDayOfMonth.getDate();
            const startDayOffset = firstDayOfMonth.getDay();
            const maxCalories = (profile.calendar_data || []).reduce((max, curr) => Math.max(max, curr.total_calories_burned), 0) || 800; // fallback

            let currentDay = 1;

            for (let week = 0; week < 6; week++) { // Allow 6 weeks to cover all overlap
                const weekData = [];
                let hasDayInWeek = false;
                for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                    // Calculate linear index
                    const dayIndex = week * 7 + dayOfWeek;

                    if (dayIndex >= startDayOffset && currentDay <= totalDays) {
                        hasDayInWeek = true;
                        const date = new Date(currentCalorieDate.getFullYear(), currentCalorieDate.getMonth(), currentDay);
                        const isFutureDate = date.setHours(0, 0, 0, 0) > new Date().setHours(0, 0, 0, 0);

                        const y = date.getFullYear();
                        const m = String(date.getMonth() + 1).padStart(2, '0');
                        const dStr = String(date.getDate()).padStart(2, '0');
                        const dateStr = `${y}-${m}-${dStr}`;

                        const dayData = (profile.calendar_data || []).find(
                            (d) => d.date === dateStr
                        );
                        const calories = dayData?.total_calories_burned || 0;
                        const intensity = calories === 0 ? 0 : 0.3 + 0.7 * (calories / maxCalories);

                        weekData.push({
                            date,
                            dayNumber: currentDay,
                            isCurrentMonth: true,
                            isActive: !isFutureDate,
                            intensity,
                            calories,
                        });
                        currentDay++;
                    } else {
                        weekData.push({ date: null, dayNumber: null, isCurrentMonth: false, isActive: false, intensity: 0, calories: 0 });
                    }
                }
                if (hasDayInWeek || week === 0) { // always show at least one week, otherwise stop if week is empty
                    if (hasDayInWeek) gridData.push(weekData);
                }
            }
            return gridData;
        };

        const gridData = generateGridData();

        return (
            <View style={styles.activityGraph}>
                <View
                    style={[
                        styles.activityGraphCard,
                        { padding: 0, overflow: 'hidden', backgroundColor: 'transparent' },
                    ]}
                >
                    <LinearGradient
                        colors={isDarkMode ? ['#252525', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{ padding: 16 }}
                    >
                        <View style={styles.graphHeader}>
                            <Text style={[styles.graphTitle, { color: colors.text }]}>
                                Calorie Burn
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                {/* Navigation Arrows if desired, or just date. User asked for "option to go back and forth" */}
                                <TouchableOpacity onPress={handlePrevMonth}>
                                    <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <Text style={[styles.graphSubtitle, { color: colors.textSecondary }]}>
                                    {currentMonth} {currentYear}
                                </Text>
                                <TouchableOpacity onPress={handleNextMonth}>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.graphGrid}>
                            <View style={styles.dayLabels}>
                                {days.map((day, i) => (
                                    <Text
                                        key={i}
                                        style={[styles.gridLabel, { color: colors.textSecondary }]}
                                    >
                                        {day}
                                    </Text>
                                ))}
                            </View>

                            <View style={styles.gridContainer}>
                                {gridData.map((week, weekIndex) => (
                                    <View key={`week-${weekIndex}`} style={styles.weekRow}>
                                        {week.map((day, dayIndex) => (
                                            <View
                                                key={`day-${weekIndex}-${dayIndex}`}
                                                style={[
                                                    styles.activitySquare,
                                                    {
                                                        borderColor: isDarkMode
                                                            ? "rgba(255, 255, 255, 0.1)"
                                                            : "rgba(0, 0, 0, 0.1)",
                                                        borderWidth:
                                                            day.isCurrentMonth &&
                                                                (!day.isActive || day.intensity === 0)
                                                                ? 1
                                                                : 0,
                                                        opacity: day.isCurrentMonth ? 1 : 0
                                                    },
                                                ]}
                                            >
                                                {day.isActive &&
                                                    day.isCurrentMonth &&
                                                    day.intensity > 0 && (
                                                        <View
                                                            style={[
                                                                StyleSheet.absoluteFill,
                                                                {
                                                                    backgroundColor: selectedPalette.primary,
                                                                    opacity: day.intensity,
                                                                    borderRadius: 4,
                                                                },
                                                            ]}
                                                        />
                                                    )}

                                                {day.isCurrentMonth && (
                                                    <Text
                                                        style={[
                                                            styles.dayNumber,
                                                            {
                                                                color:
                                                                    day.intensity > 0.5
                                                                        ? "#FFFFFF"
                                                                        : colors.textSecondary,
                                                                opacity: 1,
                                                                width: '100%',
                                                                textAlign: 'center'
                                                            },
                                                        ]}
                                                    >
                                                        {day.dayNumber}
                                                    </Text>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.graphLegend}>
                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                                Daily calorie burn activity
                            </Text>
                            <View style={styles.legendScale}>
                                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Less</Text>
                                {Array(4)
                                    .fill(0)
                                    .map((_, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.legendSquare,
                                                {
                                                    backgroundColor:
                                                        i === 0 ? "transparent" : selectedPalette.primary,
                                                    opacity: i === 0 ? 1 : 0.3 + ((i - 1) * 0.7) / 2,
                                                    borderWidth: 1,
                                                    borderColor: isDarkMode
                                                        ? "rgba(255, 255, 255, 0.1)"
                                                        : "rgba(0, 0, 0, 0.1)",
                                                },
                                            ]}
                                        />
                                    ))}
                                <Text style={[styles.legendText, { color: colors.textSecondary }]}>More</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </View>
        );
    };

    const getSocialIcon = (url: string) => {
        const type = getSocialTypeFromUrl(url);
        const size = 24;
        switch (type) {
            case "facebook": return <FacebookIcon size={size} color="#1877F2" />;
            case "instagram": return <InstagramIcon size={size} color="#E4405F" />;
            case "tiktok": return <TikTokIcon size={size} color={isDarkMode ? "#FFFFFF" : "#000000"} />;
            case "youtube": return <YoutubeIcon size={size} color="#FF0000" />;
            case "twitter": return <Ionicons name="logo-twitter" size={size} color="#1DA1F2" />;
            case "linkedin": return <Ionicons name="logo-linkedin" size={size} color="#0A66C2" />;
            case "web": default: return <LinkIcon size={size} color={selectedPalette.primary} />;
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={selectedPalette.primary} />
            </View>
        )
    }

    if (error) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text }}>User not found or error loading profile.</Text>
                <TouchableOpacity onPress={onRefresh} style={{ marginTop: 20, padding: 10, backgroundColor: selectedPalette.primary, borderRadius: 8 }}>
                    <Text style={{ color: 'white' }}>Retry</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={selectedPalette.primary} />
                }
            >
                <View style={styles.headerSpacer} />

                {/* Profile Info Section */}
                <View style={styles.profileSection}>
                    <View
                        style={[
                            styles.profileImageContainer,
                            { backgroundColor: selectedPalette.primary },
                        ]}
                    >
                        {profile.avatar_url ? (
                            <Image
                                key={`profile-image-${imageVersion}`}
                                source={{
                                    uri: profile.avatar_url.includes("?")
                                        ? `${profile.avatar_url}&t=${imageVersion}`
                                        : `${profile.avatar_url}?t=${imageVersion}`,
                                    cache: "reload",
                                }}
                                style={styles.profileImage}
                            />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: selectedPalette.primary }]}>
                                <Text style={{ color: "#FFFFFF", fontSize: 60, fontFamily: "Outfit-Bold" }}>
                                    {(profile.full_name || profile.username || "?").charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text style={[styles.name, { color: colors.text }]}>
                        {profile.full_name}
                    </Text>


                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {profile.calories_burned}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                Kcal Burned
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {profile.workouts_completed}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                Workouts
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {formatTotalTime(profile.total_time_taken)}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                Total Time
                            </Text>
                        </View>
                    </View>

                    {/* Rank/Subscription */}
                    <View style={styles.rankContainer}>
                        <View style={styles.rankWrapper}>
                            <Text style={[styles.rankText, { backgroundColor: selectedPalette.primary }]}>
                                #1
                            </Text>
                            {profile.subscription && profile.subscription !== "FREE" && (
                                <Text style={[
                                    styles.subscriptionBadge,
                                    { backgroundColor: selectedPalette.primary, opacity: profile.subscription === "PRO" ? 1 : 0.8 }
                                ]}>
                                    {profile.subscription}
                                </Text>
                            )}
                        </View>
                    </View>

                    <Text style={[styles.bio, { color: colors.textSecondary }]}>
                        {profile.bio}
                    </Text>

                    {/* Social Links */}
                    <View style={styles.socialIconsContainer}>
                        {profile.social_links.map((link, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.socialIcon,
                                    { backgroundColor: colors.surfaceSecondary },
                                ]}
                                onPress={() => {
                                    if (link.url) {
                                        Linking.openURL(link.url).catch(err => console.error("Couldn't load page", err));
                                    }
                                }}
                            >
                                {getSocialIcon(link.url)}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Calorie Activity Graph */}
                    {renderActivityGraph()}

                    {/* Focus Area Radar Chart */}
                    {renderFocusAreaChart()}

                    {/* Calendar View */}
                    <View style={[styles.calendarContainer, { padding: 0, overflow: 'hidden', backgroundColor: 'transparent' }]}>
                        <LinearGradient
                            colors={isDarkMode ? ['#252525', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={{ padding: 16 }}
                        >
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Progress
                            </Text>
                            <ProfileCalendar userId={userId} />
                        </LinearGradient>
                    </View>

                    {/* Tabs UI */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                selectedTab === "achievements" && {
                                    backgroundColor: colors.surfaceSecondary,
                                },
                            ]}
                            onPress={() => setSelectedTab("achievements")}
                        >
                            <BadgesIcon
                                size={18}
                                color={
                                    selectedTab === "achievements"
                                        ? selectedPalette.primary
                                        : colors.textSecondary
                                }
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    {
                                        color:
                                            selectedTab === "achievements"
                                                ? selectedPalette.primary
                                                : colors.textSecondary,
                                        fontFamily:
                                            selectedTab === "achievements"
                                                ? "Outfit-Bold"
                                                : "Outfit-Medium",
                                    },
                                ]}
                            >
                                ACHIEVEMENTS
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.tab,
                                selectedTab === "history" && {
                                    backgroundColor: colors.surfaceSecondary,
                                },
                            ]}
                            onPress={() => setSelectedTab("history")}
                        >
                            <ClockIcon
                                size={18}
                                color={
                                    selectedTab === "history"
                                        ? selectedPalette.primary
                                        : colors.textSecondary
                                }
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    {
                                        color:
                                            selectedTab === "history"
                                                ? selectedPalette.primary
                                                : colors.textSecondary,
                                        fontFamily:
                                            selectedTab === "history"
                                                ? "Outfit-Bold"
                                                : "Outfit-Medium",
                                    },
                                ]}
                            >
                                HISTORY
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content for Tabs */}
                    <View style={[styles.tabContent, { width: '100%', minHeight: 200 }]}>
                        {selectedTab === 'achievements' ? (
                            <View style={{ flex: 1 }}>
                                <AchievementsList userId={userId} isPublicView={true} />
                            </View>
                        ) : (
                            <View style={{ width: '100%' }}>
                                <View style={styles.dateNavigation}>
                                    <TouchableOpacity onPress={handlePrevWeek} style={styles.navButton}>
                                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                                    </TouchableOpacity>
                                    <Text style={[styles.dateRangeText, { color: colors.text }]}>
                                        {(() => {
                                            const start = new Date(historyEndDate);
                                            start.setDate(start.getDate() - 6);
                                            return `${formatRangeDate(start)} - ${formatRangeDate(historyEndDate)}`;
                                        })()}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={handleNextWeek}
                                        style={[styles.navButton, isCurrentWeek && { opacity: 0.3 }]}
                                        disabled={isCurrentWeek}
                                    >
                                        <Ionicons name="chevron-forward" size={24} color={colors.text} />
                                    </TouchableOpacity>
                                </View>

                                {loadingHistory ? (
                                    <ActivityIndicator size="small" color={selectedPalette.primary} style={{ marginTop: 20 }} />
                                ) : historyData.length > 0 ? (
                                    Object.entries(historyData.reduce((acc: any, workout: any) => {
                                        const dateKey = new Date(workout.completed_at).toDateString();
                                        if (!acc[dateKey]) acc[dateKey] = [];
                                        acc[dateKey].push(workout);
                                        return acc;
                                    }, {})).map(([date, workouts]: [string, any]) => (
                                        <View key={date}>
                                            <Text style={[styles.dateHeader, { color: colors.text }]}>
                                                {new Date((workouts[0] as any).completed_at).toLocaleDateString("en-US", {
                                                    weekday: "long",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </Text>
                                            {(workouts as any[]).map((workout: any, index: number) => (
                                                <View key={index} style={[styles.workoutCard, { padding: 0, overflow: 'hidden', backgroundColor: 'transparent' }]}>
                                                    <LinearGradient
                                                        colors={isDarkMode ? ['#252525', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 0, y: 1 }}
                                                        style={{ padding: 12 }}
                                                    >
                                                        <View style={styles.historyCardContent}>
                                                            <View style={styles.historyImageContainer}>
                                                                <Image
                                                                    source={{ uri: workout.workout_routines?.image_url || "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop" }}
                                                                    style={styles.historyImage}
                                                                />
                                                            </View>

                                                            <View style={styles.historyInfo}>
                                                                <Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={1}>
                                                                    {workout.workout_routines?.name || "Workout Session"}
                                                                </Text>

                                                                <View style={styles.historyStatsRow}>
                                                                    <View style={styles.historyStat}>
                                                                        <ClockIcon size={14} color={colors.textSecondary} />
                                                                        <Text style={[styles.historyStatText, { color: colors.textSecondary }]}>
                                                                            {formatTotalTime(workout.total_duration)}
                                                                        </Text>
                                                                    </View>
                                                                    <View style={styles.historyStat}>
                                                                        <FireIcon size={14} color={selectedPalette.primary} />
                                                                        <Text style={[styles.historyStatText, { color: colors.textSecondary }]}>
                                                                            {workout.total_calories_burned} kcal
                                                                        </Text>
                                                                    </View>
                                                                </View>

                                                                <TouchableOpacity
                                                                    style={[
                                                                        styles.viewWorkoutButton,
                                                                        { backgroundColor: selectedPalette.primary },
                                                                    ]}
                                                                    onPress={() => {
                                                                        if (workout.routine_id) {
                                                                            const routerPath = "/components/routine";
                                                                            router.push({
                                                                                pathname: routerPath as any,
                                                                                params: {
                                                                                    routineId: workout.routine_id,
                                                                                    coverImage: workout.workout_routines?.image_url,
                                                                                },
                                                                            });
                                                                        }
                                                                    }}
                                                                >
                                                                    <Text style={styles.viewWorkoutButtonText}>
                                                                        View Workout
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    </LinearGradient>
                                                </View>
                                            ))}
                                        </View>
                                    ))
                                ) : (
                                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                        <Text style={{ color: colors.textSecondary }}>No recent workout history found.</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView >
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerSpacer: {
        height: 20,
    },
    profileSection: {
        alignItems: "center",
        paddingHorizontal: 16,
    },
    profileImageContainer: {
        width: PROFILE_SIZE,
        height: PROFILE_SIZE,
        borderRadius: PROFILE_SIZE / 2,
        padding: 6,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    profileImage: {
        width: "100%",
        height: "100%",
        borderRadius: PROFILE_SIZE / 2,
        backgroundColor: "#f0f0f0",
    },
    avatarPlaceholder: {
        width: "100%",
        height: "100%",
        borderRadius: PROFILE_SIZE / 2,
        backgroundColor: "#ccc",
        justifyContent: "center",
        alignItems: "center",
    },
    name: {
        fontSize: 28,
        fontFamily: "Outfit-Bold",
        marginBottom: 4,
        textAlign: "center",
    },
    username: {
        fontSize: 16,
        fontFamily: "Outfit-Medium",
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginBottom: 16,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statValue: {
        fontSize: 20,
        fontFamily: "Outfit-Bold",
        marginBottom: 4,
        textAlign: "center",
    },
    statLabel: {
        fontSize: 12,
        fontFamily: "Outfit-Regular",
        textTransform: "uppercase",
        textAlign: "center",
    },
    statDivider: {
        width: 1,
        height: 30,
    },
    rankContainer: {
        marginBottom: 20,
    },
    rankWrapper: {
        flexDirection: "row",
        gap: 8,
    },
    rankText: {
        color: "#FFFFFF",
        fontFamily: "Outfit-Bold",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        overflow: "hidden",
        fontSize: 16,
    },
    subscriptionBadge: {
        color: "#FFFFFF",
        fontFamily: "Outfit-Bold",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        overflow: "hidden",
        fontSize: 16,
    },
    bio: {
        fontSize: 14,
        fontFamily: "Outfit-Regular",
        textAlign: "center",
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    socialIconsContainer: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 24,
    },
    socialIcon: {
        width: SOCIAL_ICON_SIZE,
        height: SOCIAL_ICON_SIZE,
        borderRadius: SOCIAL_ICON_SIZE / 2,
        justifyContent: "center",
        alignItems: "center",
    },
    actionButtonsContainer: {
        flexDirection: "row",
        gap: 12,
        width: "100%",
        paddingHorizontal: 16,
        marginBottom: 24,
        justifyContent: 'center',
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
        minWidth: 140,
    },
    actionButtonText: {
        fontSize: 16,
        fontFamily: "Outfit-Bold",
        color: "white",
    },
    calendarContainer: {
        width: "100%",
        padding: 16,
        borderRadius: 24,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: "Outfit-Bold",
        marginBottom: 16,
    },
    tabContainer: {
        flexDirection: "row",
        padding: 4,
        gap: 8,
        marginBottom: 16,
        width: "100%",
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    tabText: {
        fontSize: 14,
        fontFamily: "Outfit-Bold",
    },
    tabContent: {
        width: "100%",
    },
    workoutCard: {
        width: "100%",
        borderRadius: 16,
        marginBottom: 12,
        padding: 12,
    },
    workoutImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: "#ccc",
    },
    workoutInfo: {
        flex: 1,
        marginLeft: 12,
    },
    workoutTitle: {
        fontSize: 16,
        fontFamily: "Outfit-Bold",
        marginBottom: 4,
    },
    workoutDate: {
        fontSize: 14,
        fontFamily: "Outfit-Regular",
    },
    workoutStats: {
        alignItems: "flex-end",
    },
    caloriesText: {
        fontSize: 14,
        fontFamily: "Outfit-Bold",
    },
    viewWorkoutButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    viewWorkoutButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: "Outfit-Bold",
    },
    // Styles from reports.tsx for Card
    card: {
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 20,
        borderWidth: 1,
        width: '100%',
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontFamily: "Outfit-Bold",
        marginBottom: 16,
    },
    // Styles from profile.tsx for Graph
    activityGraph: {
        width: "100%",
        marginBottom: 24,
    },
    activityGraphCard: {
        width: "100%",
        borderRadius: 16,
        padding: 16,
    },
    graphHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    graphTitle: {
        fontSize: 18,
        fontFamily: "Outfit-Bold",
    },
    graphSubtitle: {
        fontSize: 14,
        fontFamily: "Outfit-Medium",
    },
    graphGrid: {
        marginBottom: 16,
    },
    dayLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    gridLabel: {
        fontSize: 12,
        fontFamily: "Outfit-Regular",
        width: 20,
        textAlign: "center",
    },
    gridContainer: {
        gap: 4,
    },
    weekRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    activitySquare: {
        width: 20,
        height: 20,
        borderRadius: 4,
        justifyContent: "center",
        alignItems: "center",
    },
    dayNumber: {
        fontSize: 8, // Smaller font for 20x20
        fontFamily: "Outfit-Medium",
    },
    graphLegend: {
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 8,
    },
    legendText: {
        fontSize: 12,
        fontFamily: "Outfit-Regular",
    },
    legendScale: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    legendSquare: {
        width: 16,
        height: 16,
        borderRadius: 4,
    },
    historyCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        width: '100%',
    },
    historyImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 16,
        overflow: 'hidden',
    },
    historyImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    historyInfo: {
        flex: 1,
        justifyContent: 'space-between',
        gap: 6,
    },
    historyTitle: {
        fontSize: 16,
        fontFamily: "Outfit-Bold",
    },
    historyStatsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    historyStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    historyStatText: {
        fontSize: 14,
        fontFamily: "Outfit-Medium",
    },
    viewWorkoutButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    viewWorkoutButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: "Outfit-Bold",
    },
    dateNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    dateRangeText: {
        fontSize: 16,
        fontFamily: "Outfit-Bold",
    },
    navButton: {
        padding: 8,
    },
    dateHeader: {
        fontSize: 16,
        fontFamily: "Outfit-Bold",
        marginTop: 8,
        marginBottom: 12,
    },
});
