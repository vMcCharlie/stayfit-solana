
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, Edge } from "react-native-safe-area-context";
import { useTheme } from "../../src/context/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  SlideInDown,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { supabase } from "../../src/lib/supabase";
import { api } from "../../src/services/api";
import ReplaceExerciseModal from "./ReplaceExerciseModal";
import ExerciseImage, { preloadSvgs, isSvgUrl } from "./ExerciseImage";



const { height } = Dimensions.get("window");

interface FocusArea {
  name: string;
  intensity: number; // 0 to 1
}

interface ExerciseAnimation {
  gender: 'male' | 'female';
  frame_urls: string[];
  frame_count: number;
}

interface ExerciseDetails {
  id: string;
  name: string;
  gif_url: string;
  instructions: string;
  exercise_type: string;
  avg_time_per_rep: number;
  place: string;
  equipments: string[];
  exercise_focus_areas: any[];
  exercise_mistakes: any[];
  exercise_tips: any[];
  exercise_animations?: ExerciseAnimation[];
  focusAreas: FocusArea[];
  mistakes: string[];
  tips: string[];
  is_per_side?: boolean;
  image_url_male?: string;
  image_url_female?: string;
}

// Cache for storing exercise data to avoid repeated fetches
interface ExerciseCache {
  [key: string]: ExerciseDetails;
}

interface RoutineExerciseProps {
  onClose?: () => void;
  onBack?: () => void;
  currentIndex?: number;
  totalExercises?: number;
  onNext?: () => void;
  onPrevious?: () => void;
  exerciseId: string;
  // Optional props for preloading
  nextExerciseId?: string;
  prevExerciseId?: string;
  allExerciseIds?: string[];
  // For tracking changes
  onExerciseSettingsChange?: (
    exerciseId: string,
    changes: { reps?: number; duration?: number }
  ) => void;
  initialReps?: number;
  initialDuration?: number;
  // Preloaded exercise data from parent
  preloadedExerciseData?: ExerciseDetails;
  onReplace?: (oldExerciseId: string, newExercise: any) => void;
  // Cache from parent to avoid fetches
  exercisesCache?: { [key: string]: ExerciseDetails };
}

// Create a global cache that persists between component renders
const exerciseCache: ExerciseCache = {};

export default function RoutineExercise({
  onClose,
  onBack,
  currentIndex = 1,
  totalExercises = 1,
  onNext,
  onPrevious,
  exerciseId,
  nextExerciseId,
  prevExerciseId,
  allExerciseIds,
  onExerciseSettingsChange,
  initialReps,
  initialDuration,
  preloadedExerciseData,
  onReplace,
  exercisesCache: parentCache,
}: RoutineExerciseProps) {
  const { isDarkMode, selectedPalette } = useTheme();
  const [isReplaceModalVisible, setIsReplaceModalVisible] = useState(false);
  const [duration, setDuration] = useState<number | undefined>(initialDuration);
  const [reps, setReps] = useState<number | undefined>(initialReps);
  const [isTimeBased, setIsTimeBased] = useState(true);
  const [exerciseDetails, setExerciseDetails] =
    useState<ExerciseDetails | null>(null);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [commonMistakes, setCommonMistakes] = useState<string[]>([]);
  const [breathingTips, setBreathingTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(preloadedExerciseData ? false : true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);

  // Track which exercise IDs are currently being loaded
  const loadingExerciseIds = useRef<Set<string>>(new Set());

  // Add debugging log on component mount
  useEffect(() => {
    console.log("RoutineExercise mounted with props:", {
      exerciseId,
      initialReps,
      initialDuration,
      hasPreloadedData: !!preloadedExerciseData,
    });

    if (preloadedExerciseData) {
      console.log(
        "Preloaded exercise data keys:",
        Object.keys(preloadedExerciseData)
      );
      if (preloadedExerciseData.is_per_side !== undefined) {
        console.log(
          "is_per_side value from preloaded data:",
          preloadedExerciseData.is_per_side
        );
      }
    }
  }, []);

  // Process exercise data from API into component state
  const processExerciseData = (data: any) => {
    // Process focus areas
    const processedFocusAreas =
      data.exercise_focus_areas?.map((area: any) => ({
        name: area.area,
        intensity: area.weightage / 100, // Convert percentage to 0-1 scale
      })) ||
      data.focusAreas ||
      [];

    // Process mistakes
    const processedMistakes =
      data.exercise_mistakes?.map(
        (mistake: any) => `${mistake.title} - ${mistake.subtitle} `
      ) ||
      data.mistakes ||
      [];

    // Process tips
    const processedTips =
      data.exercise_tips?.map((tip: any) => tip.tip) || data.tips || [];

    // Create processed exercise object to store in cache
    const processedExercise: ExerciseDetails = {
      ...data,
      focusAreas: processedFocusAreas,
      mistakes: processedMistakes,
      tips: processedTips,
    };

    return processedExercise;
  };

  // Set up exercise details if preloaded data is provided
  useEffect(() => {
    if (preloadedExerciseData) {
      // Use the preloaded data
      const processedData = processExerciseData(preloadedExerciseData);

      // Store in cache
      exerciseCache[exerciseId] = processedData;

      // Update state
      setExerciseDetails(processedData);
      setFocusAreas(processedData.focusAreas);
      setCommonMistakes(processedData.mistakes);
      setBreathingTips(processedData.tips);
      const type = (processedData.exercise_type || "").toLowerCase();
      const isDuration =
        ["duration", "cardio", "stretch", "warmup", "flexibility"].includes(
          type
        ) || (initialDuration && initialDuration > 0 && !initialReps);

      setIsTimeBased(!!isDuration);

      // Set initial values based on exercise type and props
      if (isDuration) {
        setDuration(initialDuration || 60);
        console.log("Setting initial duration from props:", initialDuration);
      } else {
        setReps(initialReps || 12);
        console.log("Setting initial reps from props:", initialReps);
      }

      // Preload exercise images if they're SVGs
      const imageUrls: string[] = [];
      if (processedData.gif_url && isSvgUrl(processedData.gif_url)) {
        imageUrls.push(processedData.gif_url);
      }
      if (processedData.image_url_male && isSvgUrl(processedData.image_url_male)) {
        imageUrls.push(processedData.image_url_male);
      }
      if (processedData.image_url_female && isSvgUrl(processedData.image_url_female)) {
        imageUrls.push(processedData.image_url_female);
      }
      if (imageUrls.length > 0) {
        preloadSvgs(imageUrls);
      }

      // No need to fetch, so set loading to false
      setLoading(false);
    }
  }, [preloadedExerciseData, exerciseId, initialDuration, initialReps]);

  // Fetch exercise data from API or cache
  const fetchExerciseData = async (id: string, setPrimary = false) => {
    // If preloaded data is available for this ID, use it instead of fetching
    if (id === exerciseId && preloadedExerciseData) {
      console.log("Using preloaded data for exercise:", id);
      if (setPrimary) {
        const processedData = processExerciseData(preloadedExerciseData);
        setExerciseDetails(processedData);
        setFocusAreas(processedData.focusAreas);
        setCommonMistakes(processedData.mistakes);
        setBreathingTips(processedData.tips);
        const type = (processedData.exercise_type || "").toLowerCase();
        const isDuration =
          ["duration", "cardio", "stretch", "warmup", "flexibility"].includes(
            type
          ) || (initialDuration && initialDuration > 0 && !initialReps);

        setIsTimeBased(!!isDuration);

        // Set values from props instead of defaults
        if (isDuration) {
          setDuration(initialDuration || 60);
        } else {
          setReps(initialReps || 12);
        }

        setLoading(false);
      }
      return preloadedExerciseData;
    }

    // Check parent cache first
    if (parentCache && parentCache[id]) {
      if (setPrimary) {
        const processedData = processExerciseData(parentCache[id]);
        setExerciseDetails(processedData);
        setFocusAreas(processedData.focusAreas);
        setCommonMistakes(processedData.mistakes);
        setBreathingTips(processedData.tips);
        const type = (processedData.exercise_type || "").toLowerCase();
        const isDuration =
          ["duration", "cardio", "stretch", "warmup", "flexibility"].includes(
            type
          ) || (initialDuration && initialDuration > 0 && !initialReps);

        setIsTimeBased(!!isDuration);

        // Set values from props instead of defaults
        if (isDuration) {
          setDuration(initialDuration || 60);
        } else {
          setReps(initialReps || 12);
        }

        setLoading(false);
      }
      return parentCache[id];
    }

    // If already loading this exercise, don't start another fetch
    if (loadingExerciseIds.current.has(id)) {
      return;
    }

    // Add to loading set
    loadingExerciseIds.current.add(id);

    try {
      // Check if we already have this exercise in cache
      if (exerciseCache[id]) {
        if (setPrimary) {
          // If this is the primary exercise, update state
          setExerciseDetails(exerciseCache[id]);
          setFocusAreas(exerciseCache[id].focusAreas);
          setCommonMistakes(exerciseCache[id].mistakes);
          setBreathingTips(exerciseCache[id].tips);
          const type = (exerciseCache[id].exercise_type || "").toLowerCase();
          const isDuration =
            ["duration", "cardio", "stretch", "warmup", "flexibility"].includes(
              type
            ) || (initialDuration && initialDuration > 0 && !initialReps);

          setIsTimeBased(!!isDuration);

          // Set appropriate default values based on exercise type
          if (isDuration) {
            setDuration(initialDuration || 60); // Default 60 seconds
          } else {
            setReps(initialReps || 12); // Default 12 reps
          }

          setLoading(false);
        }
        return exerciseCache[id];
      }

      // If not in cache, fetch from database
      if (setPrimary && !preloadedExerciseData) {
        setLoading(true);
      }

      // Skip fetch for demo IDs
      if (id.startsWith("demo")) {
        console.log("Skipping fetch for demo exercise:", id);
        if (setPrimary) {
          // Set default values for demo/fallback
          setFocusAreas([
            { name: "Shoulders", intensity: 0.8 },
            { name: "Quadriceps", intensity: 0.9 },
            { name: "Adductors", intensity: 0.7 },
            { name: "Glutes", intensity: 0.6 },
            { name: "Calves", intensity: 0.4 },
            { name: "Chest", intensity: 0.3 },
          ]);

          setCommonMistakes([
            "Landing too hard - When you jump in the air and come down, you are putting too much impact",
            "Not keeping the knees bent - Failing to keep the knees bent can cause the exercise to be less effective.",
            "Not engaging the core - It requires the core muscles to be engaged throughout the entire exercise.",
          ]);

          setBreathingTips([
            "Inhale as you jump your feet apart.",
            "Exhale as you jump your feet back together.",
            "Take deep breaths to fully oxygenate your body.",
          ]);

          setLoading(false);
        }
        return null;
      }

      const data = await api.getExerciseDetails(id);


      if (!data) {
        throw new Error("Exercise not found");
      }

      // Process the data
      const processedExercise = processExerciseData(data);

      // Store in cache
      exerciseCache[id] = processedExercise;

      // If this is the primary exercise, update state
      if (setPrimary) {
        setExerciseDetails(processedExercise);
        setFocusAreas(processedExercise.focusAreas);
        setCommonMistakes(processedExercise.mistakes);
        setBreathingTips(processedExercise.tips);
        const type = (processedExercise.exercise_type || "").toLowerCase();
        const isDuration =
          ["duration", "cardio", "stretch", "warmup", "flexibility"].includes(
            type
          ) || (initialDuration && initialDuration > 0 && !initialReps);

        setIsTimeBased(!!isDuration);

        // Set appropriate default values based on exercise type
        if (isDuration) {
          setDuration(initialDuration || 60); // Default 60 seconds
        } else {
          setReps(initialReps || 12); // Default 12 reps
        }

        setLoading(false);
      }

      return processedExercise;
    } catch (err) {
      console.error("Error fetching exercise:", err);

      if (setPrimary) {
        setError(
          err instanceof Error ? err.message : "Failed to load exercise"
        );

        // Set default values for demo/fallback
        setFocusAreas([
          { name: "Shoulders", intensity: 0.8 },
          { name: "Quadriceps", intensity: 0.9 },
          { name: "Adductors", intensity: 0.7 },
          { name: "Glutes", intensity: 0.6 },
          { name: "Calves", intensity: 0.4 },
          { name: "Chest", intensity: 0.3 },
        ]);

        setCommonMistakes([
          "Landing too hard - When you jump in the air and come down, you are putting too much impact",
          "Not keeping the knees bent - Failing to keep the knees bent can cause the exercise to be less effective.",
          "Not engaging the core - It requires the core muscles to be engaged throughout the entire exercise.",
        ]);

        setBreathingTips([
          "Inhale as you jump your feet apart.",
          "Exhale as you jump your feet back together.",
          "Take deep breaths to fully oxygenate your body.",
        ]);

        setLoading(false);
      }

      return null;
    } finally {
      // Remove from loading set
      loadingExerciseIds.current.delete(id);
    }
  };

  // Fetch primary exercise data on mount or when exerciseId changes
  useEffect(() => {
    // Only fetch from database if preloaded data is not available
    if (!preloadedExerciseData) {
      fetchExerciseData(exerciseId, true);
    }
  }, [exerciseId, preloadedExerciseData]);

  // Preload next and previous exercises
  const preloadAdjacentExercises = async () => {
    // If we have the nextExerciseId, preload it
    if (nextExerciseId) {
      fetchExerciseData(nextExerciseId);
    }

    // If we have the prevExerciseId, preload it
    if (prevExerciseId) {
      fetchExerciseData(prevExerciseId);
    }

    // If we have all exercise IDs, preload the ones after next and before prev
    if (allExerciseIds && allExerciseIds.length > 0) {
      const currentIdx = allExerciseIds.indexOf(exerciseId);
      if (currentIdx !== -1) {
        // Preload 2 exercises ahead and 2 behind if they exist
        if (currentIdx + 2 < allExerciseIds.length) {
          fetchExerciseData(allExerciseIds[currentIdx + 2]);
        }
        if (currentIdx - 2 >= 0) {
          fetchExerciseData(allExerciseIds[currentIdx - 2]);
        }
      }
    }
  };

  // Make sure settings are always saved when adjusted
  // In the adjustDuration and adjustReps functions
  const adjustDuration = (change: number) => {
    const newDuration = Math.max(5, (duration || 60) + change);
    setDuration(newDuration);
    setSettingsChanged(true);

    // Save changes immediately if handler is provided
    if (onExerciseSettingsChange) {
      onExerciseSettingsChange(exerciseId, { duration: newDuration });
    }
  };

  const adjustReps = (change: number) => {
    const newReps = Math.max(2, (reps || 12) + change);
    setReps(newReps);
    setSettingsChanged(true);

    // Save changes immediately if handler is provided
    if (onExerciseSettingsChange) {
      onExerciseSettingsChange(exerciseId, { reps: newReps });
    }
  };

  // Handle closing or navigating
  const handleClose = () => {
    // Always save changes when closing
    if (onExerciseSettingsChange) {
      const changes = isTimeBased ? { duration } : { reps };
      onExerciseSettingsChange(exerciseId, changes);
      console.log("Saving exercise changes on close:", exerciseId, changes);
    }

    if (onClose) {
      onClose();
    } else if (onBack) {
      onBack();
    }
  };

  // Handle transition to next exercise with changes saved
  const handleNext = () => {
    if (onNext && currentIndex < totalExercises) {
      // Save changes if settings were modified
      if (settingsChanged && onExerciseSettingsChange) {
        const changes = isTimeBased ? { duration } : { reps };
        onExerciseSettingsChange(exerciseId, changes);
      }

      setIsTransitioning(true);
      setTimeout(() => {
        onNext();
        setIsTransitioning(false);
        setSettingsChanged(false); // Reset for the next exercise
      }, 100);
    }
  };

  // Handle transition to previous exercise with changes saved
  const handlePrevious = () => {
    if (onPrevious && currentIndex > 1) {
      // Save changes if settings were modified
      if (settingsChanged && onExerciseSettingsChange) {
        const changes = isTimeBased ? { duration } : { reps };
        onExerciseSettingsChange(exerciseId, changes);
      }

      setIsTransitioning(true);
      setTimeout(() => {
        onPrevious();
        setIsTransitioning(false);
        setSettingsChanged(false); // Reset for the next exercise
      }, 100);
    }
  };

  // Preload adjacent exercises after primary is loaded
  useEffect(() => {
    if (!loading && exerciseDetails) {
      preloadAdjacentExercises();
    }
  }, [loading, exerciseDetails, nextExerciseId, prevExerciseId]);

  const colors = {
    background: isDarkMode
      ? selectedPalette.dark.background
      : selectedPalette.light.background,
    surface: isDarkMode
      ? selectedPalette.dark.surface
      : selectedPalette.light.surface,
    text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
    textSecondary: isDarkMode
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(0, 0, 0, 0.6)",
    border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")
      } `;
  };

  if (loading || isTransitioning) {
    return (
      <Animated.View
        entering={SlideInDown.springify()
          .damping(15)
          .mass(0.9)
          .stiffness(100)
          .withInitialValues({ transform: [{ translateY: height }] })}
        style={[
          styles.animatedContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={selectedPalette.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {isTransitioning ? "Changing exercise..." : "Loading exercise..."}
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={SlideInDown.springify()
        .damping(15)
        .mass(0.9)
        .stiffness(100)
        .withInitialValues({ transform: [{ translateY: height }] })}
      style={[styles.animatedContainer, { backgroundColor: colors.background }]}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {exerciseDetails?.name || "EXERCISE"}
          </Text>
          <TouchableOpacity
            style={styles.replaceButton}
            onPress={() => setIsReplaceModalVisible(true)}
          >
            <MaterialCommunityIcons
              name="swap-horizontal"
              size={24}
              color={selectedPalette.primary}
            />
            <Text
              style={[styles.replaceText, { color: selectedPalette.primary }]}
            >
              Replace
            </Text>
          </TouchableOpacity>
        </View>

        <ReplaceExerciseModal
          isVisible={isReplaceModalVisible}
          onClose={() => setIsReplaceModalVisible(false)}
          onSelect={(newExercise) => {
            setIsReplaceModalVisible(false);
            if (onReplace) {
              onReplace(exerciseId, newExercise);
            }
          }}
          currentExerciseName={exerciseDetails?.name || ""}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Exercise Animation/Image */}
          <View style={[styles.exerciseImageContainer, { backgroundColor: colors.surface }]}>
            {(() => {
              // Get animation frames - prefer male, fallback to female
              const animations = exerciseDetails?.exercise_animations || [];
              const maleAnim = animations.find((a: ExerciseAnimation) => a.gender === 'male');
              const femaleAnim = animations.find((a: ExerciseAnimation) => a.gender === 'female');
              const animation = maleAnim || femaleAnim;
              const frameUrls = animation?.frame_urls || [];
              const frameCount = animation?.frame_count || frameUrls.length;
              // Calculate speed for 1.5s loop
              const animSpeed = frameCount > 0 ? Math.floor(1500 / frameCount) : 500;

              return (
                <ExerciseImage
                  uri={exerciseDetails?.gif_url || exerciseDetails?.image_url_male || exerciseDetails?.image_url_female}
                  fallbackUri="https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?q=80&w=1000&auto=format&fit=crop"
                  frameUrls={frameUrls.length > 0 ? frameUrls : undefined}
                  animationSpeed={animSpeed}
                  animate={true}
                  width="100%"
                  height={300}
                  borderRadius={0}
                  backgroundColor="transparent"
                  showLoadingIndicator={true}
                />
              );
            })()}
          </View>

          {/* Duration/Reps Control */}
          <View
            style={[
              styles.controlSection,
              {
                backgroundColor: isDarkMode
                  ? `${selectedPalette.primary} 15`
                  : `${selectedPalette.primary} 10`,
              },
            ]}
          >
            <Text style={[styles.controlLabel, { color: colors.text }]}>
              {isTimeBased ? "DURATION" : "REPS"}
            </Text>
            <View style={styles.controlRow}>
              <TouchableOpacity
                onPress={() =>
                  isTimeBased ? adjustDuration(-5) : adjustReps(-2)
                }
                style={[
                  styles.controlButton,
                  { backgroundColor: colors.border },
                ]}
              >
                <Ionicons name="remove" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.controlValue, { color: colors.text }]}>
                {isTimeBased ? formatTime(duration || 60) : reps || 12}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  isTimeBased ? adjustDuration(5) : adjustReps(2)
                }
                style={[
                  styles.controlButton,
                  { backgroundColor: colors.border },
                ]}
              >
                <Ionicons name="add" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              INSTRUCTIONS
            </Text>
            <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
              {exerciseDetails?.instructions || "No instructions available."}
            </Text>
          </View>

          {/* Focus Area */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              FOCUS AREA
            </Text>

            <View style={styles.focusAreaBubbles}>
              {focusAreas.map((area, index) => (
                <View key={index} style={styles.bubbleContainer}>
                  <View
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: selectedPalette.primary,
                        opacity: 0.7 + area.intensity * 0.3,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 16,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        {
                          color: "#FFFFFF",
                          fontSize: 14,
                          fontFamily: "Outfit-Medium",
                        },
                      ]}
                    >
                      {area.name.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Equipment */}
            {exerciseDetails?.equipments &&
              exerciseDetails.equipments.length > 0 &&
              exerciseDetails.equipments[0] !== "none" && (
                <View style={styles.equipmentSection}>
                  <Text style={[styles.equipmentTitle, { color: colors.text }]}>
                    EQUIPMENT NEEDED
                  </Text>
                  <View style={styles.equipmentContainer}>
                    {exerciseDetails.equipments.map(
                      (equipment: string, index: number) => (
                        <View
                          key={index}
                          style={[
                            styles.equipmentBadge,
                            {
                              backgroundColor: isDarkMode
                                ? `${selectedPalette.primary} 25`
                                : `${selectedPalette.primary} 15`,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.equipmentText,
                              { color: colors.text },
                            ]}
                          >
                            {equipment}
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              )}
          </View>

          {/* Common Mistakes */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              COMMON MISTAKES
            </Text>
            <View style={styles.mistakesList}>
              {commonMistakes.map((mistake, index) => (
                <View key={index} style={styles.mistakeItem}>
                  <Text
                    style={[
                      styles.mistakeNumber,
                      { color: selectedPalette.primary },
                    ]}
                  >
                    {index + 1}
                  </Text>
                  <Text
                    style={[
                      styles.mistakeText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {mistake}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Breathing Tips */}
          <View style={[styles.section, styles.lastSection]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              BREATHING TIPS
            </Text>
            <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
              {breathingTips.map(
                (tip, index) =>
                  `• ${tip}${index < breathingTips.length - 1 ? "\n" : ""} `
              )}
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <SafeAreaView
          style={[styles.bottomNav, { backgroundColor: colors.background }]}
          edges={["bottom"] as Edge[]}
        >
          <View style={styles.bottomContent}>
            <View style={styles.navigationControls}>
              <TouchableOpacity
                onPress={handlePrevious}
                style={styles.navButton}
                disabled={!(onPrevious && currentIndex > 1)}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={
                    onPrevious && currentIndex > 1
                      ? colors.text
                      : "rgba(150,150,150,0.3)"
                  }
                />
              </TouchableOpacity>
              <Text style={[styles.exerciseCount, { color: colors.text }]}>
                {currentIndex}/{totalExercises}
              </Text>
              <TouchableOpacity
                onPress={handleNext}
                style={styles.navButton}
                disabled={!(onNext && currentIndex < totalExercises)}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={
                    onNext && currentIndex < totalExercises
                      ? colors.text
                      : "rgba(150,150,150,0.3)"
                  }
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: selectedPalette.primary },
              ]}
              onPress={handleClose}
            >
              <Text style={styles.closeButtonText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SafeAreaView>
    </Animated.View >
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    flex: 1,
    textAlign: "center",
  },
  replaceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  replaceText: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
  content: {
    flex: 1,
  },
  exerciseImageContainer: {
    width: "100%",
    height: 300,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseImage: {
    width: "100%",
    height: 280,
    resizeMode: "cover",
  },
  controlSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  controlLabel: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
    marginBottom: 12,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  controlValue: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    lineHeight: 24,
  },
  focusAreaBubbles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  bubbleContainer: {
    marginBottom: 12,
    width: "48%",
  },
  bubble: {
    justifyContent: "center",
    alignItems: "center",
  },
  bubbleText: {
    textAlign: "center",
  },
  muscleImage: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    marginTop: 16,
  },
  mistakesList: {
    gap: 16,
  },
  mistakeItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  mistakeNumber: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },
  mistakeText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    lineHeight: 24,
  },
  lastSection: {
    marginBottom: 100,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  bottomContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  navigationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navButton: {
    padding: 8,
  },
  exerciseCount: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },
  backButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
    marginTop: 16,
  },
  equipmentSection: {
    marginTop: 16,
  },
  equipmentTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    marginBottom: 16,
  },
  equipmentContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  equipmentBadge: {
    padding: 8,
    borderRadius: 16,
  },
  equipmentText: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
});
