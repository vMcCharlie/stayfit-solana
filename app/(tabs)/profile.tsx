import React, { useState, useEffect, useCallback, useRef } from "react";
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
  NativeSyntheticEvent,
  NativeScrollEvent,
  Modal,
  Pressable,
  Linking,
} from "react-native";
import { Connection, PublicKey } from "@solana/web3.js";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useTheme } from "../../src/context/theme";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useCustomAlert } from "../../src/hooks/useCustomAlert";
import CustomAlert from "../components/CustomAlert";
import { SettingsIcon, FacebookIcon, InstagramIcon, YoutubeIcon, LinkIcon, PencilIcon, TikTokIcon, ClockIcon, BadgesIcon, FireIcon, GymIcon } from "../components/TabIcons";
import Settings from "../components/settings";
import { supabase } from "../../src/lib/supabase";
import ProfileCalendar from "../components/ProfileCalendar";
import AchievementModal from "../components/AchievementModal";
import ScreenHeader from "../components/ScreenHeader";
import NavWalletButton from "../components/NavWalletButton";
import SkrTiersModal from "../components/SkrTiersModal";
import AchievementsList from "../../src/components/achievements/AchievementsList";
import { getLocalYYYYMMDD } from "../../src/utils/date";

import { Svg, Polygon, Line, Text as SvgText } from "react-native-svg";
import { useAuth } from "../../src/context/auth";
import { api } from "../../src/services/api";
import { Database } from "../../src/types/database.types"; // Add DB type import
import { LinearGradient } from "expo-linear-gradient";
import { ThemeBackground } from "../components/ThemeBackground";

type Achievement = Database['public']['Tables']['achievements']['Row'];

const PROFILE_SIZE = 200;
const SOCIAL_ICON_SIZE = 40;
const SKR_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";

type SocialLinkType =
  | "facebook"
  | "instagram"
  | "twitter"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "web";

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
}

interface Exercise {
  gif_url: string;
}

interface ExerciseCompletion {
  exercise_id: string;
  exercises: Exercise;
}

interface WorkoutRoutine {
  id: string;
  name: string;
  image_url: string;
}

interface WorkoutSessionData {
  id: string;
  started_at: string;
  completed_at: string;
  total_duration: number;
  total_calories_burned: number;
  routine_id: string;
  workout_routines: WorkoutRoutine;
}

interface WorkoutSession {
  id: string;
  started_at: string;
  completed_at: string;
  routine_id: string;
  routine_name: string;
  routine_image: string;
  total_duration: number;
  total_calories_burned: number;
}

interface FocusAreaStat {
  area: string;
  times_targeted: number;
  avg_intensity: number;
}

interface UserStats {
  total_workouts: number;
  total_duration: number;
  total_calories: number;
  focus_areas: FocusAreaStat[];
}

interface FocusAreaRecord {
  intensity_score: number;
  exercise_focus_areas: {
    area: string;
  }[];
}

interface CalorieBurnData {
  workout_date: string;
  total_calories: number;
}

const formatDate = (dateInput: string | Date) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  const formattedHours = hours % 12 || 12;

  return `${month} ${day}, ${year} • ${formattedHours}:${minutes}${ampm}`;
};

const formatRangeDate = (date: Date) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

const formatTotalTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { isDarkMode, selectedPalette } = useTheme();
  const { alertProps, showAlert } = useCustomAlert();
  const { profileUpdated, user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [hasUnreadOffers, setHasUnreadOffers] = useState(false);
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

  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const rotation = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const [skrBalanceLocal, setSkrBalanceLocal] = useState<number | null>(null); // Keep for local animation if needed, but primary is from auth
  const { skrBalance, skrTier, triggerProfileRefresh } = useAuth();
  const [showSkrModal, setShowSkrModal] = useState(false);
  const scrollY = useSharedValue(0);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [selectedTab, setSelectedTab] = useState("achievements");
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [historyEndDate, setHistoryEndDate] = useState(new Date());

  const isCurrentWeek = new Date(historyEndDate).toDateString() === new Date().toDateString();
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [monthlyCalorieBurnData, setMonthlyCalorieBurnData] = useState<
    CalorieBurnData[]
  >([]);
  const [imageVersion, setImageVersion] = useState<number>(Date.now());


  const toggleSettings = () => {
    rotation.value = withTiming(showSettings ? 0 : 1, {
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    setShowSettings(!showSettings);
  };

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(rotation.value, [0, 1], [0, 135])}deg`,
        },
      ],
    };
  });

  const colors = {
    background: isDarkMode
      ? selectedPalette.dark.background
      : selectedPalette.light.background,
    surface: isDarkMode
      ? selectedPalette.dark.surface
      : selectedPalette.light.surface,
    surfaceSecondary: isDarkMode
      ? `${selectedPalette.primary}20` // Increased opacity for better visibility
      : `${selectedPalette.primary}15`,
    text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
    textSecondary: isDarkMode
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(0, 0, 0, 0.6)",
    border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
  };

  const shouldFetchFromDatabase = () => {
    const now = Date.now();
    const cacheDuration = 5 * 60 * 1000; // 5 minutes

    // Force refresh if profileUpdated timestamp changed
    if (profileUpdated > lastFetchTime) {
      console.log("Profile was updated, forcing refresh");
      return true;
    }

    return now - lastFetchTime > cacheDuration;
  };

  const getSocialTypeFromUrl = (url: string): SocialLinkType => {
    const domain = url.toLowerCase();
    if (domain.includes("facebook.com")) return "facebook";
    if (domain.includes("instagram.com")) return "instagram";
    if (domain.includes("tiktok.com")) return "tiktok";
    if (domain.includes("twitter.com")) return "twitter";
    if (domain.includes("linkedin.com")) return "linkedin";
    if (domain.includes("youtube.com") || domain.includes("youtu.be"))
      return "youtube";
    return "web";
  };

  const getSocialIcon = (url: string) => {
    const type = getSocialTypeFromUrl(url);
    const size = 24;
    switch (type) {
      case "facebook":
        return <FacebookIcon size={size} color="#1877F2" />;
      case "instagram":
        return <InstagramIcon size={size} color="#E4405F" />;
      case "tiktok":
        return <TikTokIcon size={size} color={isDarkMode ? "#FFFFFF" : "#000000"} />;
      case "youtube":
        return <YoutubeIcon size={size} color="#FF0000" />;
      case "twitter":
        return <Ionicons name="logo-twitter" size={size} color="#1DA1F2" />;
      case "linkedin":
        return <Ionicons name="logo-linkedin" size={size} color="#0A66C2" />;
      default:
        return <LinkIcon size={size} color={selectedPalette.primary} />;
    }
  };

  const fetchUserProfile = async (forceFetch = false) => {
    try {
      const needsRefresh = forceFetch || shouldFetchFromDatabase();

      if (!needsRefresh) {
        // console.log("Using cached profile data");
        return;
      }

      // Only show full loading state if we don't have profile data yet
      if (!profile.username) {
        setLoading(true);
      }
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        router.replace("/onboarding/gender-selection");
        return;
      }

      const loggedInUserId = session.user.id;

      // Fetch profile data from API
      // We pass 'true' to force various caching layers (like api.ts internal cache) to refresh
      // if we determined that we need a refresh based on our local criteria.
      const profileData = await api.getProfile(true);

      // Ensure avatar_url is undefined when null or empty string
      const avatarUrl =
        profileData.profile?.avatar_url && profileData.profile.avatar_url.trim() !== ""
          ? profileData.profile.avatar_url
          : undefined;

      setProfile((prev) => ({
        ...prev,
        id: loggedInUserId,
        username: profileData.profile.username || "",
        full_name: profileData.profile.full_name || "",
        calories_burned: profileData.profile.total_calories_burned || 0,
        workouts_completed: profileData.profile.total_workouts_completed || 0,
        following: "0",
        bio: profileData.profile.bio || "",
        social_links: profileData.social_links || [],
        subscription: (profileData.profile.subscription as any) || null, // Cast or default to null
        avatar_url: avatarUrl,
        total_time_taken: profileData.profile.total_time_taken || 0,
        focus_areas: profileData.focus_areas || [],
        wallet_address: profileData.profile.wallet_address || null,
      }));


      if (profileData.has_unread_offers !== undefined) {
        setHasUnreadOffers(profileData.has_unread_offers);
      }

      setLastFetchTime(Date.now());
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const checkUnreadOffers = async () => {
      try {
        const { data, error } = await supabase
          .from("offers")
          .select("id")
          .eq("is_read", false)
          .limit(1);

        if (error) throw error;
        setHasUnreadOffers(data && data.length > 0);
      } catch (error) {
        console.error("Error checking unread offers:", error);
      }
    };

    checkUnreadOffers();

    const subscription = supabase
      .channel("offers")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "offers",
        },
        () => {
          checkUnreadOffers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchHistoryWorkouts = async () => {
    try {
      setLoadingWorkouts(true);
      // api.getWorkoutHistory handles fetching.
      const endDate = new Date(historyEndDate);
      endDate.setHours(23, 59, 59, 999);

      const startDate = new Date(historyEndDate);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      const historyData = await api.getWorkoutHistory(startDate, endDate);

      console.log(`Fetched ${historyData?.length} workouts from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      const formattedWorkouts: WorkoutSession[] = historyData.map((workout) => {
        return {
          id: workout.id,
          started_at: workout.started_at,
          completed_at: workout.completed_at,
          routine_id: workout.routine_id,
          routine_name: workout.workout_routines?.name || "Unknown",
          routine_image:
            workout.workout_routines?.image_url ||
            workout.workout_routines?.image_url_male ||
            workout.workout_routines?.image_url_female ||
            "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop",
          total_duration: workout.total_duration,
          total_calories_burned: workout.total_calories_burned,
        };
      });

      setRecentWorkouts(formattedWorkouts);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      setLoadingWorkouts(false);
    }
  };

  useEffect(() => {
    if (selectedTab === "history") {
      fetchHistoryWorkouts();
    }
  }, [selectedTab, historyEndDate]);

  const handlePrevWeek = () => {
    const newDate = new Date(historyEndDate);
    newDate.setDate(newDate.getDate() - 7);
    setHistoryEndDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(historyEndDate);
    newDate.setDate(newDate.getDate() + 7);
    const today = new Date();
    if (newDate > today) {
      setHistoryEndDate(today);
    } else {
      setHistoryEndDate(newDate);
    }
  };

  const fetchMonthlyCalorieBurn = async (forceRefresh = false) => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;

      const stats = await api.getMonthlyStats(month, now.getFullYear(), forceRefresh);

      const dailyCalories: { [key: string]: number } = {};
      stats.forEach((session: any) => {
        const date = getLocalYYYYMMDD(new Date(session.completed_at));
        dailyCalories[date] = (dailyCalories[date] || 0) + (session.total_calories_burned || 0);
      });

      const processedData: CalorieBurnData[] = Object.entries(dailyCalories).map(([date, calories]) => ({
        workout_date: date,
        total_calories: calories,
      }));

      setMonthlyCalorieBurnData(processedData);
    } catch (error) {
      console.error("Error fetching monthly calorie burn:", error);
    }
  };

  useEffect(() => {
    fetchMonthlyCalorieBurn();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Update image version to force reload of image
    setImageVersion(Date.now());
    await Promise.all([
      fetchUserProfile(true),
      fetchMonthlyCalorieBurn(true),
      triggerProfileRefresh()
    ]);
    setRefreshing(false);
  }, [fetchUserProfile, fetchMonthlyCalorieBurn, triggerProfileRefresh]);

  // Use useFocusEffect to check for updates whenever the screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      fetchMonthlyCalorieBurn();
    }, [profileUpdated, lastFetchTime])
  );

  const renderSocialIcons = () => {
    return (
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
    );
  };



  const renderActionButtons = () => {
    return (
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: selectedPalette.primary },
          ]}
          onPress={() => router.push("/edit-profile")}
        >
          <PencilIcon size={20} color="white" />
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderActivityGraph = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const currentMonth = now.toLocaleString("default", { month: "long" });
    const currentYear = now.getFullYear();

    // Generate 5 weeks x 7 days grid data
    const generateGridData = () => {
      const today = new Date();
      const gridData = [];

      // Get first day of current month
      const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
      // Get last day of current month
      const lastDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      );

      // Calculate total days in month
      const totalDays = lastDayOfMonth.getDate();
      // Map for O(1) calorie lookup by date string
      const calorieMap = new Map(monthlyCalorieBurnData.map(d => [d.workout_date, d.total_calories]));

      // Get the day of week the month starts on (0-6)
      const startDayOffset = firstDayOfMonth.getDay();

      // Find max calories for intensity calculation
      const maxCalories = monthlyCalorieBurnData.reduce(
        (max, curr) => Math.max(max, curr.total_calories),
        0
      );

      let currentDay = 1;

      // Create 5 weeks
      for (let week = 0; week < 5; week++) {
        const weekData = [];
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
          // Calculate if this position should show a day from current month
          const isValidDay =
            week * 7 + dayOfWeek >= startDayOffset && currentDay <= totalDays;

          if (isValidDay) {
            const date = new Date(
              today.getFullYear(),
              today.getMonth(),
              currentDay
            );
            const isFutureDate = date > today;
            const dateStr = getLocalYYYYMMDD(date);
            const calories = calorieMap.get(dateStr) || 0;

            // Calculate intensity based on calories burned
            // If no workout on this day, intensity will be 0
            // Otherwise, normalize between 0.3 and 1 based on max calories
            const intensity =
              calories === 0 ? 0 : 0.3 + 0.7 * (calories / maxCalories);

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
            // Push empty day
            weekData.push({
              date: null,
              dayNumber: null,
              isCurrentMonth: false,
              isActive: false,
              intensity: 0,
              calories: 0,
            });
          }
        }
        gridData.push(weekData);
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
              <Text
                style={[styles.graphSubtitle, { color: colors.textSecondary }]}
              >
                {currentMonth} {currentYear}
              </Text>
            </View>

            <View style={styles.graphGrid}>
              {/* Day labels */}
              <View style={styles.dayLabels}>
                {days.map((day) => (
                  <Text
                    key={day}
                    style={[styles.gridLabel, { color: colors.textSecondary }]}
                  >
                    {day.charAt(0)}
                  </Text>
                ))}
              </View>

              {/* Activity grid */}
              <View style={styles.gridContainer}>
                {gridData.map((week, weekIndex) => (
                  <View key={`week-${weekIndex}`} style={styles.weekRow}>
                    {week.map((day, dayIndex) => (
                      <TouchableOpacity
                        key={`day-${weekIndex}-${dayIndex}`}
                        onPress={() => {
                          if (day.calories > 0) {
                            // Show calories in a toast or alert
                            showAlert("Daily Burn", `Calories burned: ${Math.round(day.calories)}`);
                          }
                        }}
                        disabled={!day.isCurrentMonth || day.calories === 0}
                      >
                        <View
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
                            },
                          ]}
                        >
                          {/* Background with opacity */}
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
                                  opacity: 1, // Always full opacity for text
                                  zIndex: 1,
                                },
                              ]}
                            >
                              {day.dayNumber}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
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
                <Text
                  style={[styles.legendText, { color: colors.textSecondary }]}
                >
                  Less
                </Text>
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
                <Text
                  style={[styles.legendText, { color: colors.textSecondary }]}
                >
                  More
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  };

  const handleAchievementPress = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowAchievementModal(true);
  };

  const renderAchievements = () => {
    return (
      <View style={{ flex: 1 }}>
        <AchievementsList userId={user?.id} />
      </View>
    );
  };

  const renderTabs = () => {
    return (
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
                  selectedTab === "history" ? "Outfit-Bold" : "Outfit-Medium",
              },
            ]}
          >
            HISTORY
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWorkoutList = () => {
    if (loadingWorkouts) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={selectedPalette.primary} />
        </View>
      );
    }

    if (recentWorkouts.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <GymIcon
            size={48}
            color={colors.textSecondary}
            focused={false}
          />
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            No completed workouts in this period
          </Text>
        </View>
      );
    }

    // Group workouts by date
    const groupedWorkouts: { [key: string]: WorkoutSession[] } = {};
    recentWorkouts.forEach((workout) => {
      const dateKey = new Date(workout.completed_at).toDateString();
      if (!groupedWorkouts[dateKey]) {
        groupedWorkouts[dateKey] = [];
      }
      groupedWorkouts[dateKey].push(workout);
    });

    return (
      <View style={styles.workoutListContainer}>
        {Object.entries(groupedWorkouts).map(([date, workouts]) => (
          <View key={date}>
            <Text style={[styles.dateHeader, { color: colors.text }]}>
              {new Date(workouts[0].completed_at).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </Text>
            {workouts.map((workout) => (
              <View
                key={workout.id}
                style={[
                  styles.workoutCard,
                  { padding: 0, overflow: 'hidden', backgroundColor: 'transparent' },
                ]}
              >
                <LinearGradient
                  colors={isDarkMode ? ['#252525', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{ padding: 12 }}
                >
                  <View style={styles.historyCardContent}>
                    <View style={styles.historyImageContainer}>
                      <Image
                        source={{ uri: workout.routine_image }}
                        style={styles.historyImage}
                      />
                    </View>

                    <View style={styles.historyInfo}>
                      <Text
                        style={[styles.historyTitle, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {workout.routine_name}
                      </Text>

                      <View style={styles.historyStatsRow}>
                        <View style={styles.historyStat}>
                          <ClockIcon
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.historyStatText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {formatTotalTime(workout.total_duration)}
                          </Text>
                        </View>
                        <View style={styles.historyStat}>
                          <FireIcon
                            size={14}
                            color={selectedPalette.primary}
                          />
                          <Text
                            style={[
                              styles.historyStatText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {Math.round(workout.total_calories_burned)} kcal
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.viewWorkoutButton,
                          { backgroundColor: selectedPalette.primary },
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: "../components/routine",
                            params: {
                              routineId: workout.routine_id,
                              coverImage: workout.routine_image,
                            },
                          })
                        }
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
        ))}
      </View>
    );
  };

  /* Removed renderStats as data is shown at top */

  // Refresh on focus (when navigating back to this screen)
  useFocusEffect(
    useCallback(() => {
      const checkAndRefresh = async () => {
        if (shouldFetchFromDatabase()) {
          console.log("Screen focused, refreshing profile data");
          // Update image version to force reload
          setImageVersion(Date.now());
          await fetchUserProfile(true);
        }
      };

      checkAndRefresh();
    }, [profileUpdated]) // Add profileUpdated as a dependency
  );

  // Add an effect to reset image cache when profileUpdated changes
  useEffect(() => {
    if (profileUpdated > 0) {
      console.log("Profile updated, resetting image cache");
      setImageVersion(Date.now());
    }
  }, [profileUpdated]);



  return (
    <ThemeBackground style={styles.container}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScreenHeader
          title={profile.username ? profile.username.toLowerCase() : "Stay Fit"}
          rightAction={
            <View style={styles.headerActions}>
              <NavWalletButton />
              <TouchableOpacity onPress={toggleSettings} style={styles.settingsToggle}>
                <Animated.View style={iconAnimatedStyle}>
                  <View style={styles.iconContainer}>
                    {showSettings ? (
                      <Ionicons name="close-outline" size={26} color={colors.text} />
                    ) : (
                      <SettingsIcon size={26} color={colors.text} />
                    )}
                    {hasUnreadOffers && (
                      <View
                        style={[
                          styles.notificationDot,
                          { backgroundColor: selectedPalette.primary },
                        ]}
                      />
                    )}
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </View>
          }
        />
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[selectedPalette.primary]}
              tintColor={colors.text}
            />
          }
        >
          {
            loading ? (
              <View style={styles.loadingContainer} >
                <ActivityIndicator size="large" color={selectedPalette.primary} />
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: colors.text }]}>
                  {error}
                </Text>
                <TouchableOpacity
                  onPress={() => fetchUserProfile(true)}
                  style={[
                    styles.retryButton,
                    { backgroundColor: selectedPalette.primary },
                  ]}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
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

                <Text style={[styles.fullName, { color: colors.text }]}>
                  {profile.full_name}
                </Text>

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {profile.calories_burned.toLocaleString()}
                    </Text>
                    <Text
                      style={[styles.statLabel, { color: colors.textSecondary }]}
                    >
                      Calories Burned
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {profile.workouts_completed}
                    </Text>
                    <Text
                      style={[styles.statLabel, { color: colors.textSecondary }]}
                    >
                      Workouts
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {formatTotalTime(profile.total_time_taken)}
                    </Text>
                    <Text
                      style={[styles.statLabel, { color: colors.textSecondary }]}
                    >
                      Total Time
                    </Text>
                  </View>
                </View>

                <View style={styles.rankContainer}>
                  <View style={styles.rankWrapper}>
                    {skrBalance !== null && (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setShowSkrModal(true)}
                        style={[styles.subscriptionBadge, { backgroundColor: selectedPalette.primary, flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                      >
                        <Ionicons name="wallet-outline" size={16} color="white" />
                        <Text style={{ color: 'white', fontFamily: 'Outfit-Bold' }}>
                          {skrBalance.toLocaleString()} SKR
                        </Text>
                      </TouchableOpacity>
                    )}
                    {profile.subscription && (profile.subscription === "PRO" || profile.subscription === "PLUS") && (
                      <Text
                        style={[
                          styles.subscriptionBadge,
                          {
                            backgroundColor: selectedPalette.primary,
                            opacity: profile.subscription === "PRO" ? 1 : 0.8,
                          },
                        ]}
                      >
                        {profile.subscription}
                      </Text>
                    )}
                  </View>
                </View>

                <Text style={[styles.bio, { color: colors.textSecondary }]}>
                  {profile.bio}
                </Text>

                {renderSocialIcons()}
                {renderActionButtons()}
                {renderActivityGraph()}

                {/* Calendar View */}
                {/* Calendar View */}
                <View
                  style={[
                    styles.calendarContainer,
                    { padding: 0, overflow: 'hidden', backgroundColor: 'transparent' },
                  ]}
                >
                  <LinearGradient
                    colors={isDarkMode ? ['#252525', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ padding: 16 }}
                  >
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Progress
                    </Text>
                    <ProfileCalendar userId={user?.id} />
                  </LinearGradient>
                </View>

                {renderTabs()}
                <View style={styles.tabContent}>
                  {selectedTab === "history" && (
                    <View style={styles.tabContentSection}>
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
                      {renderWorkoutList()}
                    </View>
                  )}
                  {selectedTab === "achievements" && (
                    <View style={styles.tabContentSection}>
                      {renderAchievements()}
                    </View>
                  )}
                </View>
              </View>
            )}
        </ScrollView >

        <Settings
          visible={showSettings}
          onClose={toggleSettings}
          colors={colors}
        />

        <AchievementModal
          visible={showAchievementModal}
          achievement={selectedAchievement}
          onClose={() => setShowAchievementModal(false)}
          colors={colors}
          isDarkMode={isDarkMode}
          selectedPalette={selectedPalette}
          formatDate={formatDate}
        />

        <SkrTiersModal
          visible={showSkrModal}
          onClose={() => setShowSkrModal(false)}
          balance={skrBalance || 0}
        />

        <CustomAlert {...alertProps} />
      </SafeAreaView >
    </ThemeBackground >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsToggle: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  headerUsername: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  profileImageContainer: {
    width: PROFILE_SIZE,
    height: PROFILE_SIZE,
    borderRadius: PROFILE_SIZE / 2,
    marginBottom: 16,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  fullName: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    marginBottom: 4,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
    textAlign: "center",
  },
  rankContainer: {
    marginBottom: 16,
  },
  rankWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subscriptionBadge: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
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
    justifyContent: "center",
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
  activityGraph: {
    width: "100%",
    marginBottom: 24,
  },
  activityGraphCard: {
    width: "100%",
    borderRadius: 16,
    padding: 16,
  },
  calendarContainer: {
    width: "100%",
    marginBottom: 24,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    marginBottom: 16,
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
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
  dayNumber: {
    fontSize: 8,
    fontFamily: "Outfit-Regular",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24, // Matches index.tsx spacing
    // paddingHorizontal removed to match parent padding (profileSection already has padding)
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  tabText: {
    fontSize: 12,
    fontFamily: "Outfit-Bold",
    marginLeft: 8,
  },
  tabContent: {
    flex: 1,
    width: "100%",
  },
  tabContentSection: {
    paddingVertical: 16, // Only vertical padding
    minHeight: 400,
  },
  tabContentText: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
  },
  workoutListContainer: {
    width: "100%",
    gap: 16,
    // Removed paddingHorizontal to use parent's padding
  },
  workoutCard: {
    width: "100%",
    borderRadius: 16,
    marginBottom: 16,
    padding: 12,
  },
  historyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
    // Removed paddingHorizontal to align with other elements
  },
  dateRangeText: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },
  navButton: {
    padding: 8,
  },
  emptyStateContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
    textAlign: "center",
  },
  statsSection: {
    gap: 16,
    paddingBottom: 32,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  dateHeader: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    marginTop: 8,
    marginBottom: 12,
  },
  achievementsContainer: {
    paddingBottom: 20,
    gap: 24,
  },
  achievementCategory: {
    gap: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontFamily: "Outfit-Bold",
    marginBottom: 8,
    opacity: 0.7,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  achievementItem: {
    width: "30%",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  lockedAchievement: {
    opacity: 0.5,
  },
  achievementIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 12,
    fontFamily: "Outfit-Medium",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: "center",
    minHeight: 400,
  },
  modalHeader: {
    marginBottom: 24,
  },
  modalIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    textAlign: "center",
    marginBottom: 24,
  },
  modalFooter: {
    width: "100%",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.03)",
    marginBottom: 24,
  },
  unlockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  unlockedText: {
    fontSize: 14,
    fontFamily: "Outfit-Bold",
    color: "#4CAF50",
  },
  lockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  lockedText: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
  },
  closeButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },
  workoutHistoryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
  },
  historyStatItem: {
    alignItems: "center",
    flex: 1,
  },
  historyStatValue: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    marginVertical: 8,
  },
  historyStatLabel: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
    textAlign: "center",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
