import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  LayoutChangeEvent,
  Alert,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { FireActiveIcon, HomeSelectorIcon, GymIcon, IcicleIcon } from "../components/TabIcons";
import { useTheme } from "../../src/context/theme";
import ChallengeSection from "../components/ChallengeSection";
import PopularGoalsSection from "../components/PopularGoalsSection";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useRouter, useFocusEffect } from "expo-router";
import { useCustomAlert } from "../../src/hooks/useCustomAlert";
import CustomAlert from "../components/CustomAlert";
import { supabase } from "../../src/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../src/context/auth";
import { api } from "../../src/services/api";
import { workoutPersistenceService, SavedWorkoutState } from "../../src/services/workoutPersistenceService";

import { LinearGradient } from "expo-linear-gradient";
import { ThemeBackground } from "../components/ThemeBackground";
import ScreenHeader from "../components/ScreenHeader";
import NavWalletButton from "../components/NavWalletButton";
import { getLocalYYYYMMDD } from "../../src/utils/date";

import { cache } from "../../src/utils/cache";

// Constants for profile preferences storage
const EQUIPMENT_ACCESS_KEY = "user_equipment_access";
const ROUTINES_CACHE_KEY = "cached_workout_routines_list";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32; // Full width minus padding


interface Exercise {
  id: string;
  name: string;
  duration?: number;
  reps?: number;
  sets?: number;
  order_position: number;
}

// Update Interface
interface WorkoutRoutine {
  id: string;
  name: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  created_at: string;
  exercise_count: number;
  total_duration?: number;
  exercises?: Exercise[];
  image_url?: string | null;
  image_url_male?: string | null;
  image_url_female?: string | null;
  place?: string;
  created_by?: string | null;
  is_explore?: boolean;
}

export default function Index() {
  const { isDarkMode, selectedPalette } = useTheme();
  // ... rest of component
  const router = useRouter();
  const { user, skrTier, skrBalance } = useAuth();
  const [activeSession, setActiveSession] = useState<SavedWorkoutState | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [weeklyActivity, setWeeklyActivity] = useState<{ date: string; type: 'fire' | 'ice' }[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutRoutine | null>(null);
  const [workoutRoutines, setWorkoutRoutines] = useState<WorkoutRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<"home" | "gym">("home");
  const [selectedCategory, setSelectedCategory] = useState<string>("Arms");
  const [userGender, setUserGender] = useState<"male" | "female">("male");
  const [loadingUserPrefs, setLoadingUserPrefs] = useState(true);

  // Add ref for the horizontal ScrollView
  const categoryScrollViewRef = useRef<ScrollView>(null);
  const flatListRef = useRef<FlatList>(null);
  const [containerHeight, setContainerHeight] = useState<number>(300); // Default height
  const [exploreCategory, setExploreCategory] = useState<"All Routines" | "My Routines">("All Routines");
  const categories = ["Arms", "Chest", "Abs", "Shoulder & Back", "Legs"];

  const animatedHeightStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(containerHeight, { duration: 300 }),
    };
  });

  // Load data using Edge Functions
  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      if (!user) return;
      setLoading(true);
      setLoadingUserPrefs(true);

      // 1. Fetch Profile (Prefs + Streak + Activity) - Always fresh
      const profilePromise = api.getProfile(forceRefresh);

      // 2. Fetch Routines
      const routinesPromise = (async () => {
        if (!forceRefresh) {
          const cachedRoutines = await cache.load<WorkoutRoutine[]>(ROUTINES_CACHE_KEY);
          if (cachedRoutines) return cachedRoutines;
        }
        return await api.getWorkoutRoutines();
      })();

      let [profileResponse, routinesRaw] = await Promise.all([
        profilePromise,
        routinesPromise,
      ]);

      const { profile, streak, weekly_activity } = profileResponse;
      const userProfile = profile as any;
      if (userProfile) {
        let equipmentAccess: "home" | "gym" = "home";
        if (userProfile.equipment_access && (userProfile.equipment_access.toLowerCase() === "gym" || userProfile.equipment_access === "full_gym")) {
          equipmentAccess = "gym";
        }
        setSelectedEquipment(equipmentAccess);
        await AsyncStorage.setItem(EQUIPMENT_ACCESS_KEY, equipmentAccess);

        if (userProfile.gender) {
          const g = userProfile.gender.toLowerCase();
          setUserGender(g === "female" || g === "woman" ? "female" : "male");
        }
      }

      setCurrentStreak(streak);
      setWeeklyActivity(weekly_activity);

      const processedRoutines = routinesRaw.map((routine: any) => {
        const level = routine.level || (routine.name.toLowerCase().includes("intermediate")
          ? "Intermediate"
          : routine.name.toLowerCase().includes("advanced")
            ? "Advanced"
            : "Beginner");

        let category = routine.category;
        if (!category) {
          const nameLower = routine.name.toLowerCase();
          if (nameLower.includes("abs") || nameLower.includes("core")) category = "Abs";
          else if (nameLower.includes("full body")) category = "Full Body";
          else if (nameLower.includes("upper body")) category = "Upper Body";
          else if (nameLower.includes("lower body")) category = "Lower Body";
          else if (nameLower.includes("cardio")) category = "Cardio";
          else if (nameLower.includes("arm")) category = "Arms";
          else if (nameLower.includes("chest")) category = "Chest";
          else if (nameLower.includes("back")) category = "Back";
          else if (nameLower.includes("shoulder")) category = "Shoulders";
          else if (nameLower.includes("leg")) category = "Legs";
          else category = "Other";
        }
        const place = routine.place || (routine.name.toLowerCase().includes("gym") ? "Gym" : "Home");

        return {
          ...routine,
          level: level as "Beginner" | "Intermediate" | "Advanced",
          category,
          place,
          total_duration: routine.name.includes("5-Minute") ? 5 : (routine.exercise_count || 0) * 1.5,
        };
      });

      setWorkoutRoutines(processedRoutines);

      if (!forceRefresh) {
        const cached = await cache.load(ROUTINES_CACHE_KEY);
        if (!cached) {
          await cache.save(ROUTINES_CACHE_KEY, processedRoutines);
        }
      } else {
        await cache.save(ROUTINES_CACHE_KEY, processedRoutines);
      }

    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data");

    } finally {
      setLoading(false);
      setLoadingUserPrefs(false);
      setRefreshing(false);
    }
  }, [user]);

  // Colors definition
  const colors = {
    background: isDarkMode
      ? selectedPalette.dark?.background ?? "#000"
      : selectedPalette.light?.background ?? "#FFF",
    surface: isDarkMode
      ? selectedPalette.dark?.surface ?? "#111"
      : selectedPalette.light?.surface ?? "#f5f5f5",
    surfaceSecondary: isDarkMode
      ? "rgba(255, 255, 255, 0.05)"
      : "rgba(0, 0, 0, 0.02)",
    text: isDarkMode ? selectedPalette.dark?.text ?? "#FFF" : selectedPalette.light?.text ?? "#000",
    textSecondary: isDarkMode
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(0, 0, 0, 0.6)",
    border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    inactive: isDarkMode ? "#404040" : "#E0E0E0",
  };

  const { alertProps, showAlert } = useCustomAlert();


  const handleLogRest = async () => {
    try {
      // Check rest days in last 7 days
      const last7Days = weeklyActivity.filter(a => {
        const activityDate = new Date(a.date);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return a.type === 'ice' && activityDate >= sevenDaysAgo;
      });

      if (last7Days.length >= 2 && (skrTier === "None" || skrTier === "Bronze")) {
        showAlert(
          "Silver Tier Required",
          `You have used your 2 free rest days this week. Silver tier is required for additional rest days. Your balance: ${skrBalance.toLocaleString()} SKR`,
          [{ text: "OK" }]
        );
        return;
      }

      setLoading(true);
      await api.logRestDay();
      await loadData(true); // Refresh to show the ice icon
      showAlert("Rest Day Logged", "Your streak has been frozen for today! Enjoy your recovery.", [{ text: "OK" }]);
    } catch (error) {
      console.error("Error logging rest:", error);
      showAlert("Error", "Failed to log rest day. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const WeeklyGoalIndicator = () => {
    // Get current date
    const today = new Date();
    const todayDateStr = getLocalYYYYMMDD(today);

    // Check if today has activity
    const todayActivity = weeklyActivity.find(a => a.date === todayDateStr);
    const hasActivityToday = !!todayActivity;

    // Generate array of dates: 3 days before today, today, and 3 days after
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + (i - 3));
      return date;
    });

    return (
      <View>
        <View style={styles.weekContainer}>
          {weekDates.map((date, index) => {
            const dateStr = getLocalYYYYMMDD(date);
            const isToday = index === 3;
            const isFutureDay = date > today && dateStr !== todayDateStr;

            // Find entry in history
            const activity = weeklyActivity.find(a => a.date === dateStr);
            const hasFire = activity?.type === 'fire'; // Active workout
            const hasIce = activity?.type === 'ice';   // Rest day

            return (
              <View
                key={index}
                style={[
                  styles.dayIndicator,
                  {
                    backgroundColor: hasFire
                      ? '#FFB800' // Golden/orange for active days with fire
                      : hasIce
                        ? (isDarkMode ? '#1E293B' : '#E2E8F0') // Icy blue/grey for frozen
                        : isToday
                          ? colors.surfaceSecondary + '80'
                          : colors.inactive,
                    borderColor: isToday && !hasFire && !hasIce ? selectedPalette.primary : 'transparent',
                    borderWidth: isToday && !hasFire && !hasIce ? 1 : 0,
                    overflow: 'hidden',
                  },
                ]}
              >
                {hasFire ? (
                  <View style={{ justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                    <FireActiveIcon size={14} color="#FF4500" />
                  </View>
                ) : hasIce ? (
                  <View style={{ justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                    <IcicleIcon size={16} color={isDarkMode ? "#93C5FD" : "#3B82F6"} />
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.dayNumber,
                      {
                        color: isToday
                          ? colors.text
                          : colors.textSecondary,
                        opacity: isFutureDay ? 0.5 : 1,
                      },
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Rest Button - Only show if today has NO activity */}
        {!hasActivityToday && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleLogRest}
              style={{
                marginTop: 12,
                marginBottom: 4,
                borderRadius: 12,
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.05,
                shadowRadius: 3.84,
                elevation: 2,
              }}
            >
              <LinearGradient
                colors={isDarkMode ? ['#252525', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{
                  marginRight: 8,
                  backgroundColor: isDarkMode ? 'rgba(147, 197, 253, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                  borderRadius: 20,
                  padding: 4
                }}>
                  <IcicleIcon size={18} color={isDarkMode ? "#93C5FD" : "#3B82F6"} />
                </View>
                <Text style={{
                  fontFamily: 'Outfit-Medium',
                  fontSize: 14,
                  color: isDarkMode ? "#93C5FD" : "#3B82F6"
                }}>
                  Tap to Freeze Streak (Rest Date)
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    );
  };

  // Filter routines by Category and location (home/gym)
  const getFilteredRoutines = (categoryToFilter: string = selectedCategory) => {
    return workoutRoutines.filter((routine) => {
      // Special case for "My Routines"
      if (categoryToFilter === "My Routines") {
        // We identify user routines by checking created_by. 
        // In loadData, we haven't explicitly exposed created_by in the mapped object yet?
        // The edge function returns it. 
        // AND 'api.getWorkoutRoutines' passes it through?
        // processedRoutines maps: { ...routine, ... } so yes, created_by is there.
        // However, for strictness, we should check:
        return routine.created_by && routine.created_by === user?.id;
      }

      // Default to "Other" if category is missing
      const routineCategory = (routine.category || "Other").toLowerCase();
      const selected = categoryToFilter.toLowerCase();

      let matchesCategory = false;

      // Direct match
      if (routineCategory === selected) {
        matchesCategory = true;
      }
      // Hande Singular/Plural mismatches
      else if (selected === 'legs' && routineCategory === 'leg') {
        matchesCategory = true;
      }
      else if (selected === 'arms' && routineCategory === 'arm') {
        matchesCategory = true;
      }
      // Handle Combined Categories (e.g. "Shoulder & Back")
      else if (selected === 'shoulder & back') {
        if (routineCategory.includes('shoulder') || routineCategory.includes('back')) {
          matchesCategory = true;
        }
      }
      // Handle "Other" / "Custom" mapping
      else if (selected === 'other' && routineCategory === 'custom') {
        matchesCategory = true;
      }

      // Use explicit place field if available, otherwise fallback to name check (for legacy/sample data)
      let isGymWorkout = false;
      if (routine.place) {
        isGymWorkout = routine.place.toLowerCase() === 'gym';
      } else {
        isGymWorkout = routine.name.toLowerCase().includes("gym");
      }

      const matchesEquipment =
        (selectedEquipment === "gym" && isGymWorkout) ||
        (selectedEquipment === "home" && !isGymWorkout);

      return matchesCategory && matchesEquipment;
    });
  };

  // Calculate height based on content
  const calculateContentHeight = (category: string) => {
    const routines = getFilteredRoutines(category);

    if (routines.length === 0) {
      return 200; // Empty state height
    }

    // Card dimensions estimation:
    const CARD_HEIGHT = 240;
    const HEADER_PADDING = 110;

    return (routines.length * CARD_HEIGHT) + HEADER_PADDING;
  };

  // Function to handle category selection and ensure it's visible
  const handleCategorySelect = (category: string) => {
    const index = categories.indexOf(category);
    if (index !== -1) {
      setSelectedCategory(category);
      flatListRef.current?.scrollToIndex({ index, animated: true });

      // Calculate and set height immediately
      const newHeight = calculateContentHeight(category);
      setContainerHeight(newHeight);
    }
  };

  const renderCategoryPage = ({ item: category }: { item: string }) => {
    const filteredRoutines = getFilteredRoutines(category).sort((a, b) => {
      const difficultyOrder = { "Beginner": 1, "Intermediate": 2, "Advanced": 3 };
      const levelA = difficultyOrder[a.level] || 99;
      const levelB = difficultyOrder[b.level] || 99;
      return levelA - levelB;
    });

    return (
      <View
        style={{ width: width, paddingHorizontal: 16, paddingBottom: 80 }} // Use screen width to match paging
      >
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
          {category}{" "}
          {selectedEquipment.charAt(0).toUpperCase() +
            selectedEquipment.slice(1)}{" "}
          Workouts
        </Text>

        {filteredRoutines.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text
              style={[styles.emptyStateText, { color: colors.textSecondary }]}
            >
              No {category} {selectedEquipment} workouts found
            </Text>
          </View>
        ) : (
          <View style={styles.workoutList}>
            {filteredRoutines.map((routine) => {
              const displayImage =
                userGender === "female" && routine.image_url_female
                  ? routine.image_url_female
                  : routine.image_url_male || routine.image_url;

              return (
                <TouchableOpacity
                  key={routine.id}
                  style={[
                    styles.workoutCard,
                    {
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: "../components/routine",
                      params: {
                        routineId: routine.id,
                        coverImage: displayImage,
                      },
                    })
                  }
                >
                  <LinearGradient
                    colors={isDarkMode ? ['#252525', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  >
                    <ExpoImage
                      source={{
                        uri: displayImage || undefined,
                      }}
                      style={styles.workoutCardImage}
                      contentFit="cover"
                    />
                    <View style={styles.workoutInfo}>
                      <Text style={[styles.workoutTitle, { color: colors.text }]}>
                        {routine.name.toUpperCase()}
                      </Text>
                      <Text
                        style={[styles.workoutDetails, { color: colors.textSecondary }]}
                      >
                        {Math.round(routine.total_duration || 0)} MINS •{" "}
                        {routine.exercise_count} EXERCISES
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // Recalculate height when data or filter changes
  useEffect(() => {
    if (!loading && !loadingUserPrefs) {
      const height = calculateContentHeight(selectedCategory);
      setContainerHeight(height);
    }
  }, [workoutRoutines, selectedEquipment, selectedCategory, loading, loadingUserPrefs]);

  // Check for active session on focus
  useFocusEffect(
    useCallback(() => {
      const onFocus = async () => {
        const session = await workoutPersistenceService.getState();
        setActiveSession(session);
        // Refresh data to catch any profile updates (e.g. gender change)
        loadData();
      };
      onFocus();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(true);
  }, [loadData]);

  useEffect(() => {
    const updateStoredPreferences = async () => {
      try {
        await AsyncStorage.setItem(EQUIPMENT_ACCESS_KEY, selectedEquipment);
        if (user) {
          await api.updateProfile({
            equipment_access: selectedEquipment
          } as any);
        }
      } catch (error) {
        console.error("Error saving preferences:", error);
      }
    };
    updateStoredPreferences();
  }, [selectedEquipment, user]);

  return (
    <ThemeBackground style={styles.container}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: 'transparent' }]}
        edges={['top']}
      >
        <ScreenHeader rightAction={<NavWalletButton />} />

        {/* Equipment Type Tabs - Always visible below header */}
        <View style={[styles.tabSectionContainer, { backgroundColor: 'transparent' }]}>
          <View style={styles.equipmentTabsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.equipmentTab,
                { backgroundColor: colors.surfaceSecondary },
                selectedEquipment === "home" && {
                  backgroundColor: selectedPalette.primary,
                },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => setSelectedEquipment("home")}
            >
              <HomeSelectorIcon
                size={18}
                color={selectedEquipment === "home" ? "#FFFFFF" : colors.text}
              />
              <Text
                style={[
                  styles.equipmentTabText,
                  {
                    color:
                      selectedEquipment === "home" ? "#FFFFFF" : colors.text,
                  },
                ]}
              >
                HOME
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.equipmentTab,
                { backgroundColor: colors.surfaceSecondary },
                selectedEquipment === "gym" && {
                  backgroundColor: selectedPalette.primary,
                },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => setSelectedEquipment("gym")}
            >
              <GymIcon
                size={18}
                color={selectedEquipment === "gym" ? "#FFFFFF" : colors.text}
                focused={false}
              />
              <Text
                style={[
                  styles.equipmentTabText,
                  {
                    color:
                      selectedEquipment === "gym" ? "#FFFFFF" : colors.text,
                  },
                ]}
              >
                GYM
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[selectedPalette.primary]} // Android
              tintColor={selectedPalette.primary} // iOS
              title="Pull to refresh" // iOS
              titleColor={colors.text} // iOS
            />
          }
        >
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={styles.header}
          >
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={24} color="#FF4B4B" />
              <Text style={[styles.streakText, { color: colors.text }]}>
                {currentStreak} day streak!
              </Text>
            </View>

            <Text
              style={[styles.weeklyGoalTitle, { color: colors.textSecondary }]}
            >
              Weekly goal
            </Text>
            <WeeklyGoalIndicator />
          </Animated.View>



          {/* Resume Banner - Moved here */}
          {activeSession && (
            <Animated.View
              entering={FadeInDown.duration(300).delay(100)}
              style={{ paddingHorizontal: 16, marginBottom: 24 }}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  router.push({
                    pathname: "../components/routine",
                    params: {
                      routineId: activeSession.routineId,
                      resume: 'true'
                    }
                  });
                }}
              >
                <LinearGradient
                  colors={[selectedPalette.primary, '#4a90e2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 16,
                    padding: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    shadowColor: selectedPalette.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <View>
                    <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 18, color: 'white', marginBottom: 4 }}>
                      Resume Workout
                    </Text>
                    <Text style={{ fontFamily: 'Outfit-Medium', fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
                      {activeSession.routineName}
                    </Text>
                  </View>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Ionicons name="play" size={20} color="white" style={{ marginLeft: 2 }} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}




          {/* Challenge Section - Moved here */}
          <ChallengeSection gender={userGender} />

          {/* Body Focus Header */}
          <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginTop: 24, marginBottom: 16, color: colors.text }]}>Body Focus</Text>

          {/* Category Tabs - Moved here */}
          <Animated.View entering={FadeInDown.duration(300).delay(250)} style={{ marginBottom: 8 }}>
            <ScrollView
              ref={categoryScrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.levelTabsScrollView}
              contentContainerStyle={[styles.levelTabsContainer, { paddingHorizontal: 16 }]}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.levelTab,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.border,
                    },
                    selectedCategory === category && {
                      borderColor: selectedPalette.primary,
                      backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : colors.surfaceSecondary,
                    },
                  ]}
                  onPress={() => handleCategorySelect(category)}
                >
                  <Text
                    style={[
                      styles.levelTabText,
                      { color: colors.textSecondary },
                      selectedCategory === category && {
                        color: selectedPalette.primary,
                        fontFamily: "Outfit-Bold",
                      },
                    ]}
                  >
                    {category.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {loading || loadingUserPrefs ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={selectedPalette.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading workouts...
              </Text>
            </View>
          ) : (
            <Animated.View
              entering={FadeInDown.duration(300).delay(200)}
              style={styles.workoutListContainer}
            >
              <Animated.View style={[animatedHeightStyle]}>
                <FlatList
                  ref={flatListRef}
                  data={categories}
                  extraData={[workoutRoutines, selectedEquipment]}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item}
                  renderItem={renderCategoryPage}
                  initialNumToRender={1}
                  onMomentumScrollEnd={(event) => {
                    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
                    const newCategory = categories[newIndex];
                    if (newCategory && newCategory !== selectedCategory) {
                      setSelectedCategory(newCategory);
                      const newHeight = calculateContentHeight(newCategory);
                      setContainerHeight(newHeight);
                    }
                  }}
                  getItemLayout={(data, index) => (
                    { length: width, offset: width * index, index }
                  )}
                />
              </Animated.View>


            </Animated.View>
          )}


          {/* Popular Goals Section */}
          <PopularGoalsSection routines={workoutRoutines} userGender={userGender} />

          {/* My Routines Section */}
          <View style={{ marginBottom: 40, paddingHorizontal: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Routines</Text>
            {workoutRoutines.filter(r => r.created_by === user?.id).length === 0 ? (
              <View style={[styles.emptyStateContainer, { padding: 20, backgroundColor: colors.surfaceSecondary, borderRadius: 16 }]}>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  You haven't created any routines yet.
                </Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/more')} style={{ marginTop: 10 }}>
                  <Text style={{ color: selectedPalette.primary, fontFamily: 'Outfit-Bold' }}>Go to More to Create</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {workoutRoutines.filter(r => r.created_by === user?.id).map(routine => {
                  const displayImage = userGender === "female" && routine.image_url_female ? routine.image_url_female : routine.image_url_male || routine.image_url;
                  return (
                    <TouchableOpacity
                      key={routine.id}
                      style={{ width: 280, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}
                      onPress={() => router.push({ pathname: "../components/routine", params: { routineId: routine.id, coverImage: displayImage } })}
                    >
                      <ExpoImage source={{ uri: displayImage || undefined }} style={{ width: '100%', height: 140 }} contentFit="cover" />
                      <LinearGradient
                        colors={isDarkMode ? ['#252525', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
                        style={{ padding: 12 }}
                      >
                        <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 16, color: colors.text }} numberOfLines={1}>{routine.name}</Text>
                        <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 13, color: colors.textSecondary }}>{routine.exercise_count} Exercises • {routine.level}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </ScrollView>
      </SafeAreaView >
    </ThemeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8, // Reduced padding
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
  },
  headerActions: {
    flexDirection: "row",
    gap: 16,
  },
  headerButton: {
    padding: 8,
  },
  header: {
    padding: 16,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  streakText: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    marginLeft: 8,
  },
  weeklyGoalTitle: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
    marginBottom: 8,
  },
  weekContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dayIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  dayNumber: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
  },
  tabSectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 4,
    zIndex: 10,
  },
  equipmentTabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  equipmentTab: {
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
  equipmentTabText: {
    fontSize: 14,
    fontFamily: "Outfit-Bold",
    marginLeft: 8,
  },
  levelTabsScrollView: {
    flexGrow: 0,
  },
  levelTabsContainer: {
    paddingVertical: 4,
  },
  levelTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  levelTabText: {
    fontSize: 12,
    fontFamily: "Outfit-Medium",
  },
  workoutListContainer: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    marginBottom: 16,
  },
  workoutList: {
    gap: 12,
  },
  workoutCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  workoutCardImage: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  workoutInfo: {
    padding: 16,
  },
  workoutTitle: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    marginBottom: 4,
  },
  workoutDetails: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: "Outfit-Medium",
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

});
