import React, { useState, memo, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
  Modal,
  BackHandler,
  InteractionManager,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../src/context/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import RoutineExercise from "./routineexercise";
import ExerciseImage, { preloadSvgs, isSvgUrl } from "./ExerciseImage";
import ReplaceExerciseModal from "./ReplaceExerciseModal";
import { supabase } from "../../src/lib/supabase";
import RoutineStart from "./routinestart";
import RoutineWorkingOut from "./routineworkingout";
import RoutineRest from "./routinerest";
import RoutineEdit from "./routineedit";
import RoutineCompleted from "./routinecompleted";
import RoutineQuit from "./routinequit";
import { api } from "../../src/services/api";
import { cache } from "../../src/utils/cache";
import offlineService from "../../src/services/offlineService";
import { workoutPersistenceService, SavedWorkoutState } from "../../src/services/workoutPersistenceService";

const { width } = Dimensions.get("window");

// Local storage keys
const ROUTINE_CACHE_PREFIX = "routine_cache_";
const EXERCISE_CACHE_PREFIX = "exercise_cache_";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Add a new state variable for the workout flow
const WORKOUT_REST_DURATION_KEY = "workout_rest_duration";
const DEFAULT_REST_DURATION = 30; // 30 seconds default rest

// Database types
interface Exercise {
  id: string;
  name: string;
  gif_url: string;
  exercise_type: string;
  instructions: string;
}

interface RoutineExercise {
  id: string;
  order_position: number;
  reps?: number;
  duration?: number;
  sets?: number;
  exercise: Exercise;
}

interface Routine {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  routine_exercises: RoutineExercise[];
}

type WorkoutItem = {
  id: string;
  name: string;
  duration?: string;
  reps?: number;
  sets?: number;
  image: string;
  exerciseId: string;
  orderPosition: number;
  rawDuration?: number;
  // For tracking local changes
  localReps?: number;
  localDuration?: number;
  is_per_side?: boolean;
  // Animation frames for SVG animation
  frameUrls?: string[];
  frameCount?: number;
  // Exercise Details
  instructions?: string;
  focusAreas?: any[];
  mistakes?: string[];
  tips?: string[];
  exercise_type?: string;
};

interface RoutineProps {
  onClose: () => void;
  routineId?: string;
}

// Format time utility function
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

// Default image for exercises that don't have one
const defaultImage =
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop";

// Memoized workout item component
const WorkoutItemComponent = memo(
  ({
    item,
    drag,
    isActive,
    index,
    onPress,
    onReplace,
    colors,
    primaryColor,
    isDarkMode,
    imagesReady,
  }: {
    item: WorkoutItem;
    drag: () => void;
    isActive: boolean;
    index: number | undefined;
    onPress: (index: number) => void;
    onReplace: (index: number) => void;
    colors: any;
    primaryColor: string;
    isDarkMode: boolean;
    imagesReady?: boolean;
  }) => {

    // Format the meta string (Reps/Duration)
    const getMetaString = () => {
      if (item.duration) {
        return item.duration;
      } else if (item.reps) {
        return `x${item.reps}`;
      }
      return "";
    };

    return (
      <ScaleDecorator activeScale={0.97}>
        <TouchableOpacity
          onLongPress={drag}
          onPress={() => index !== undefined && onPress(index)}
          disabled={isActive}
          style={[
            styles.workoutItem,
            {
              backgroundColor: "transparent",
              borderColor: isDarkMode
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.1)",
              borderWidth: 1,
              opacity: isActive ? 0.95 : 1,
              transform: isActive ? [{ scale: 0.97 }] : [],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isActive ? 0.15 : (isDarkMode ? 0.2 : 0.05),
              shadowRadius: isActive ? 8 : 4,
              elevation: isActive ? 4 : 2,
              zIndex: isActive ? 999 : 1,
              paddingVertical: 0,
              paddingHorizontal: 0,
              overflow: 'hidden',
            },
          ]}
        >
          <LinearGradient
            colors={isDarkMode ? ['#252525', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              paddingHorizontal: 12,
              flex: 1,
            }}
          >
            {/* Exercise Image - Larger size with animation */}
            <View style={styles.imageWrapper}>
              <ExerciseImage
                key={`${item.id}-${imagesReady ? 'ready' : 'loading'}`}
                uri={item.frameUrls && item.frameUrls.length > 0 ? item.frameUrls[0] : item.image}
                frameUrls={item.frameUrls}
                animationSpeed={item.frameCount ? Math.floor(1500 / item.frameCount) : 500}
                animate={false}
                width={88}
                height={88}
                borderRadius={16}
                backgroundColor="transparent"
                showLoadingIndicator={true}
              />
            </View>

            {/* Exercise Info */}
            <View style={styles.workoutInfo}>
              <Text
                style={[styles.workoutName, { color: colors.text }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.name}
              </Text>
              <View style={styles.metaContainer}>
                <Text style={[styles.workoutMeta, { color: primaryColor }]}>
                  {getMetaString()}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  },
  (prevProps, nextProps) => {
    // Prevent unnecessary re-renders
    return (
      prevProps.isActive === nextProps.isActive &&
      prevProps.item.id === nextProps.item.id &&
      prevProps.index === nextProps.index &&
      prevProps.item.exerciseId === nextProps.item.exerciseId &&
      prevProps.item.name === nextProps.item.name &&
      prevProps.isDarkMode === nextProps.isDarkMode
    );
  }
);

// Define a proper type for workout modes
type WorkoutMode = "idle" | "edit" | "start" | "exercise" | "rest" | "complete";

// Add a general utility function to safely access nested properties
const safeGet = (obj: any, path: string, defaultValue: any = undefined) => {
  const travel = (regexp: RegExp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce(
        (res, key) => (res !== null && res !== undefined ? res[key] : res),
        obj
      );
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
};

export default function Routine({
  onClose,
  routineId: propRoutineId,
}: RoutineProps) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDarkMode, selectedPalette } = useTheme();

  // Get params
  const routineId = propRoutineId || (params.routineId as string);

  // Get coverImage from params
  const coverImage =
    (params.coverImage as string) ||
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop";

  // Challenge Params
  const context = params.context as string;
  const userChallengeId = params.userChallengeId as string;
  const dayNumber = params.dayNumber ? parseInt(params.dayNumber as string) : undefined;
  const challengeId = params.challengeId as string;

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routineDetails, setRoutineDetails] = useState<any>(null);
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([]);
  const [allExerciseDetails, setAllExerciseDetails] = useState<{ [key: string]: any }>({});

  // Workout State
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>("idle");
  const [isStarting, setIsStarting] = useState(false);
  const [workoutSessionId, setWorkoutSessionId] = useState<string | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [totalWorkoutDuration, setTotalWorkoutDuration] = useState(0);

  const [completedExercises, setCompletedExercises] = useState<{ [key: string]: any }>({});
  const [caloriesBurned, setCaloriesBurned] = useState(0);

  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // UI State
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);

  // Cache/Preload State
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState({ loaded: 0, total: 0 });
  const [cachedStreak, setCachedStreak] = useState(0);
  const [cachedWeeklyActivity, setCachedWeeklyActivity] = useState<string[]>([]);

  // Settings
  const [restDuration, setRestDuration] = useState(DEFAULT_REST_DURATION);

  // Load rest duration from settings
  useEffect(() => {
    const loadRestDuration = async () => {
      try {
        const savedDuration = await AsyncStorage.getItem(
          WORKOUT_REST_DURATION_KEY
        );
        if (savedDuration) {
          setRestDuration(parseInt(savedDuration, 10));
        }
      } catch (error) {
        console.error("Error loading rest duration:", error);
      }
    };

    loadRestDuration();
  }, []);

  // Pre-fetch streak data for immediate display on completion screen
  useEffect(() => {
    const fetchStreakData = async () => {
      try {
        const profile = await api.getProfile();
        setCachedStreak(profile.streak || 0);
        setCachedWeeklyActivity(profile.weekly_activity || []);
      } catch (error) {
        console.error("Error pre-fetching streak data:", error);
      }
    };

    fetchStreakData();
  }, []);


  // Function to save routine data to local storage
  const saveRoutineToCache = async (
    id: string,
    details: any,
    workoutItems: WorkoutItem[],
    exerciseData: { [key: string]: any }
  ) => {
    try {
      // Save routine details and workout items
      await cache.save(`${ROUTINE_CACHE_PREFIX}${id}`, {
        details,
        workouts: workoutItems,
      });

      // Save all exercise details separately
      await cache.save(`${EXERCISE_CACHE_PREFIX}${id}`, exerciseData);

      console.log(`Routine ${id} saved to cache`);
    } catch (err) {
      console.error("Error saving routine to cache:", err);
    }
  };

  // Function to load routine data from local storage
  const loadRoutineFromCache = async (id: string) => {
    try {
      // Try to get routine data from cache (7 days validity)
      const cachedRoutineData = await cache.load<{ details: any; workouts: WorkoutItem[] }>(
        `${ROUTINE_CACHE_PREFIX}${id}`,
        SEVEN_DAYS_MS
      );

      const cachedExerciseData = await cache.load<{ [key: string]: any }>(
        `${EXERCISE_CACHE_PREFIX}${id}`,
        SEVEN_DAYS_MS
      );

      if (cachedRoutineData) {
        console.log(`Loading routine ${id} from cache`);
        setRoutineDetails(cachedRoutineData.details);
        setWorkouts(cachedRoutineData.workouts);

        if (cachedExerciseData) {
          setAllExerciseDetails(cachedExerciseData);
        }

        setLoading(false);

        // Preload all exercise SVGs in the background (including animation frames)
        const allImageUrls: string[] = [];

        // Collect image URLs and animation frames from workouts
        cachedRoutineData.workouts.forEach((workout: WorkoutItem) => {
          if (workout.image && isSvgUrl(workout.image)) {
            allImageUrls.push(workout.image);
          }
          // Add all animation frames
          if (workout.frameUrls && workout.frameUrls.length > 0) {
            workout.frameUrls.forEach((frameUrl: string) => {
              if (isSvgUrl(frameUrl)) {
                allImageUrls.push(frameUrl);
              }
            });
          }
        });

        // Also preload images from cached exercise details (male/female variants and animations)
        if (cachedExerciseData) {
          Object.values(cachedExerciseData).forEach((exercise: any) => {
            if (exercise.gif_url && isSvgUrl(exercise.gif_url)) {
              allImageUrls.push(exercise.gif_url);
            }
            if (exercise.image_url_male && isSvgUrl(exercise.image_url_male)) {
              allImageUrls.push(exercise.image_url_male);
            }
            if (exercise.image_url_female && isSvgUrl(exercise.image_url_female)) {
              allImageUrls.push(exercise.image_url_female);
            }
            // Add animation frames
            if (exercise.exercise_animations) {
              exercise.exercise_animations.forEach((anim: any) => {
                if (anim.frame_urls) {
                  anim.frame_urls.forEach((frameUrl: string) => {
                    if (isSvgUrl(frameUrl)) {
                      allImageUrls.push(frameUrl);
                    }
                  });
                }
              });
            }
          });
        }

        // Remove duplicates
        const uniqueImageUrls = [...new Set(allImageUrls)];

        // OPTIMIZATION: Mark as ready immediately, preload in background
        setImagesPreloaded(true);

        if (uniqueImageUrls.length > 0) {
          // Defer heavy preloading until after animations/interactions complete
          InteractionManager.runAfterInteractions(() => {
            console.log(`[Routine Cache] Background preloading ${uniqueImageUrls.length} SVG frames...`);
            setPreloadProgress({ loaded: 0, total: uniqueImageUrls.length });

            preloadSvgs(uniqueImageUrls, (loaded, total) => {
              setPreloadProgress({ loaded, total });
            }).then(() => {
              console.log(`[Routine Cache] All ${uniqueImageUrls.length} SVG frames preloaded in background`);
            });
          });
        }

        return true; // Successfully loaded from cache
      }

      return false; // Cache not found or expired
    } catch (err) {
      console.error("Error loading routine from cache:", err);
      return false;
    }
  };

  // Handle exercise settings change
  const handleExerciseSettingsChange = (
    exerciseId: string,
    changes: { reps?: number; duration?: number }
  ) => {
    // Find the workout that needs to be updated
    const updatedWorkouts = workouts.map((workout) => {
      if (workout.exerciseId === exerciseId) {
        return {
          ...workout,
          reps: changes.reps !== undefined ? changes.reps : workout.reps,
          rawDuration:
            changes.duration !== undefined
              ? changes.duration
              : workout.rawDuration,
          duration:
            changes.duration !== undefined
              ? formatTime(changes.duration)
              : workout.duration,
          // Update local values for persistence
          localReps:
            changes.reps !== undefined ? changes.reps : workout.localReps,
          localDuration:
            changes.duration !== undefined
              ? changes.duration
              : workout.localDuration,
        };
      }
      return workout;
    });

    // Update the state
    setWorkouts(updatedWorkouts);

    // Also update the cache if needed
    if (routineId && routineDetails) {
      saveRoutineToCache(
        routineId,
        routineDetails,
        updatedWorkouts,
        allExerciseDetails
      ).catch((err) =>
        console.error("Error saving exercise settings to cache:", err)
      );

      // Save persistence state if in workout
      if (workoutMode !== "idle" && workoutMode !== "edit") {
        saveCurrentState(updatedWorkouts);
      }
    }
  };

  // --- Persistence Helper ---
  const saveCurrentState = async (currentWorkouts: WorkoutItem[] = workouts) => {
    if (!routineId || !routineDetails) return;

    // Don't save if idle or complete
    if (workoutMode === 'idle' || workoutMode === 'complete') return;

    const state: SavedWorkoutState = {
      routineId,
      routineName: routineDetails.name,
      workoutSessionId,
      workoutMode,
      currentExerciseIndex,
      workoutStartTime,
      totalWorkoutDuration, // We need to calculate this dynamically if running, but for snapshotting:
      // Actually, if we crash, we lose the time since last save. 
      // We should ideally save the timestamp of start/resume to calc delta.
      // For MVP: save what we have.
      caloriesBurned,
      completedExercises,
      workouts: currentWorkouts,
      lastUpdated: Date.now()
    };

    await workoutPersistenceService.saveState(state);
  };

  // Auto-save on mode change or step change - debounced to avoid excessive writes
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (workoutMode !== 'idle' && workoutMode !== 'edit' && workoutMode !== 'complete') {
      // Debounce saves to avoid blocking UI
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveCurrentState();
      }, 500); // Save after 500ms of no changes
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [workoutMode, currentExerciseIndex, completedExercises]);

  // Check for resume param on mount
  useEffect(() => {
    const checkResume = async () => {
      // Check if we are requested to resume
      if (params.resume === 'true') {
        const savedState = await workoutPersistenceService.getState();
        if (savedState && savedState.routineId === routineId) {
          console.log("[Routine] Resuming session...");
          setWorkoutSessionId(savedState.workoutSessionId);
          setWorkouts(savedState.workouts);
          setCompletedExercises(savedState.completedExercises);
          setCurrentExerciseIndex(savedState.currentExerciseIndex);
          setWorkoutStartTime(savedState.workoutStartTime); // This might need adjustment for elapsed time?
          // For now, let's just restore the start time. 
          // If the app was closed for 2 hours, the duration will be huge.
          // Ideally we subtract the downtime. But for MVP, simple restore.

          setWorkoutMode(savedState.workoutMode);
          // Restore Routine Details so UI renders correct name
          setRoutineDetails({
            name: savedState.routineName,
            // we might need to recalc totalDuration/count or just wait for standard load?
            // Standard load will happen below in fetchRoutineData.
            // We should let standard load happen to get images/meta, then overlay our state?
            // Actually, standard load happens in parallel.
          });
          return;
        }
      }
    };
    checkResume();
  }, [params.resume]);

  // Fetch routine data
  useEffect(() => {
    if (!routineId) {
      setLoading(false);
      // If no routineId, use default data for demo
      setWorkouts([
        {
          id: "1",
          name: "Jumping Jacks",
          duration: "00:20",
          image:
            "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?q=80&w=1000&auto=format&fit=crop",
          exerciseId: "demo1",
          orderPosition: 1,
          rawDuration: 20,
        },
        {
          id: "2",
          name: "Abdominal Crunches",
          reps: 16,
          image:
            "https://images.unsplash.com/photo-1544216717-3bbf52512659?q=80&w=1000&auto=format&fit=crop",
          exerciseId: "demo2",
          orderPosition: 2,
        },
        {
          id: "3",
          name: "Russian Twist",
          reps: 20,
          image:
            "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&auto=format&fit=crop",
          exerciseId: "demo3",
          orderPosition: 3,
        },
        {
          id: "4",
          name: "Mountain Climber",
          duration: "00:30",
          image:
            "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?q=80&w=1000&auto=format&fit=crop",
          exerciseId: "demo4",
          orderPosition: 4,
          rawDuration: 30,
        },
      ]);

      // Set demo exercise details
      setAllExerciseDetails({
        demo1: {
          id: "demo1",
          name: "Jumping Jacks",
          exercise_type: "cardio",
          instructions: "Start with your feet together and your hands at your sides. Simultaneously raise your arms above your head and jump up just enough to spread your feet out wide. Without pausing, quickly reverse the movement and repeat.",
          focusAreas: [{ name: "Cardio", intensity: 0.8 }, { name: "Legs", intensity: 0.6 }],
          mistakes: ["Not landing softly", "Not raising arms fully"],
          tips: ["Keep your core engaged", "Breathe steadily"],
        },
        demo2: {
          id: "demo2",
          name: "Abdominal Crunches",
          exercise_type: "strength",
          instructions: "Lie on your back with your knees bent and feet flat on the floor. Place your hands behind your head. Curl your upper body towards your knees, pausing at the top of the movement. Slowly lower back down.",
          focusAreas: [{ name: "Abs", intensity: 0.9 }],
          mistakes: ["Pulling on your neck", "Using momentum"],
          tips: ["Exhale as you crunch up", "Keep your lower back pressed to the floor"],
        },
        demo3: {
          id: "demo3",
          name: "Russian Twist",
          exercise_type: "strength",
          instructions: "Sit on the floor with your knees bent and feet lifted slightly off the ground. Lean back slightly. Clasp your hands together and twist your torso to the right, then to the left.",
          focusAreas: [{ name: "Obliques", intensity: 0.8 }, { name: "Abs", intensity: 0.7 }],
          mistakes: ["Rounding your back", "Moving your legs too much"],
          tips: ["Follow your hands with your eyes", "Move with control"],
        },
        demo4: {
          id: "demo4",
          name: "Mountain Climber",
          exercise_type: "cardio",
          instructions: "Start in a plank position. Quickly drive your right knee towards your chest, then switch and drive your left knee towards your chest. Continue alternating legs at a fast pace.",
          focusAreas: [{ name: "Cardio", intensity: 0.9 }, { name: "Abs", intensity: 0.7 }],
          mistakes: ["Bouncing your hips", "Not bringing knees far enough"],
          tips: ["Keep your hands directly under shoulders", "Maintain a flat back"],
        },
      });

      setRoutineDetails({
        name: "ABS BEGINNER",
        totalDuration: "20 mins",
        exerciseCount: 4,
      });
      return;
    }

    // First try to load from AsyncStorage cache (for backward compatibility)
    const fetchRoutineData = async () => {
      try {
        const loadedFromCache = await loadRoutineFromCache(routineId);

        if (loadedFromCache) {
          return; // If loaded from cache successfully, no need to fetch from API
        }

        // Try WatermelonDB offline-first service
        setLoading(true);
        setError(null);

        // Use offline service which checks local DB first, then fetches from server
        const offlineData = await offlineService.getRoutineDetails(routineId);

        let data: any = null;

        if (offlineData) {
          // Format from offline service to match expected structure
          data = {
            name: offlineData.routine.name,
            exercises: offlineData.exercises,
          };
          console.log(`[Routine] Loaded from ${offlineData.routine._fromCache ? 'local DB' : 'server'}`);
        } else {
          // Fallback to direct API call if offline service fails
          data = await api.getRoutineDetails(routineId);
        }

        if (!data) {
          throw new Error("Routine not found");
        }

        // Fetch user profile to determine gender for asset selection
        let isFemale = false;
        try {
          const profileData = await api.getProfile();
          const g = profileData.profile?.gender?.toLowerCase();
          isFemale = g === 'female' || g === 'woman';
        } catch (e) {
          console.warn("Could not fetch profile for gender logic", e);
        }

        // Extract and prepare all exercise details for cache
        const exerciseDetailsMap: { [key: string]: any } = {};

        // The API returns 'exercises' which are routine_exercises joined with exercise details
        const routineExercises = data.exercises || [];

        routineExercises.forEach((item: any) => {
          if (item.exercises && item.exercises.id) { // Note: 'exercises' joined prop name in Edge Function query
            exerciseDetailsMap[item.exercises.id] = {
              ...item.exercises,
              // Process the data for the UI components
              focusAreas: (item.exercises.exercise_focus_areas || []).map(
                (area: any) => ({
                  // Fix: Use 'area' instead of 'name' to match what RoutineCompleted expects
                  area: area.area,
                  weightage: area.weightage, // Keep validation logic happy
                  intensity: area.weightage / 100, // Keep intensity
                })
              ),
              mistakes: (item.exercises.exercise_mistakes || []).map(
                (mistake: any) => `${mistake.title} - ${mistake.subtitle}`
              ),
              tips: (item.exercises.exercise_tips || []).map(
                (tip: any) => tip.tip
              ),
            };
          }
        });

        // Save all exercise details to state
        setAllExerciseDetails(exerciseDetailsMap);

        // Process the data for the UI
        const processedWorkouts = routineExercises
          .sort((a: any, b: any) => a.order_position - b.order_position)
          .map((item: any) => {
            const exerciseName = safeGet(item, "exercises.name", "Unknown");
            const isPerSide = safeGet(item, "exercises.is_per_side", false);

            // Get image URL with proper fallback chain
            const gifUrl = safeGet(item, "exercises.gif_url", null);
            const maleImageUrl = safeGet(item, "exercises.image_url_male", null);
            const femaleImageUrl = safeGet(item, "exercises.image_url_female", null);

            let finalImageUrl = defaultImage;
            if (isFemale) {
              finalImageUrl = femaleImageUrl || gifUrl || maleImageUrl || defaultImage;
            } else {
              finalImageUrl = maleImageUrl || gifUrl || femaleImageUrl || defaultImage;
            }

            // Get animation frames - prefer male frames, fallback to female
            const exerciseAnimations = safeGet(item, "exercises.exercise_animations", []);



            const maleAnimation = exerciseAnimations.find((anim: any) => anim.gender === 'male');
            const femaleAnimation = exerciseAnimations.find((anim: any) => anim.gender === 'female');

            const animation = isFemale ? (femaleAnimation || maleAnimation) : (maleAnimation || femaleAnimation);
            const frameUrls = animation?.frame_urls || [];
            const frameCount = animation?.frame_count || frameUrls.length;

            console.log(
              `Processing exercise: ${exerciseName}`,
              `\n  - gif_url: ${gifUrl}`,
              `\n  - image_url_male: ${maleImageUrl}`,
              `\n  - frame_count: ${frameCount}`,
              `\n  - is_per_side: ${isPerSide}`
            );

            return {
              id: item.id,
              name: exerciseName,
              duration: item.duration ? formatTime(item.duration) : undefined,
              reps: item.reps || undefined,
              sets: item.sets || 3,
              image: finalImageUrl,
              exerciseId: safeGet(item, "exercises.id", ""),
              orderPosition: item.order_position,
              rawDuration: item.duration,
              localReps: item.reps || undefined,
              localDuration: item.duration || undefined,
              is_per_side: isPerSide,
              frameUrls: frameUrls.length > 0 ? frameUrls : undefined,
              frameCount: frameCount > 0 ? frameCount : undefined,
              // Add details for ExerciseInfoModal
              instructions: exerciseDetailsMap[safeGet(item, "exercises.id", "")]?.instructions,
              focusAreas: exerciseDetailsMap[safeGet(item, "exercises.id", "")]?.focusAreas,
              mistakes: exerciseDetailsMap[safeGet(item, "exercises.id", "")]?.mistakes,
              tips: exerciseDetailsMap[safeGet(item, "exercises.id", "")]?.tips,
              exercise_type: exerciseDetailsMap[safeGet(item, "exercises.id", "")]?.exercise_type,
            };
          });

        // Calculate total duration
        const totalSeconds = routineExercises.reduce(
          (total: number, item: any) => {
            const sets = item.sets || 3;
            if (item.duration) return total + (item.duration as number) * sets;
            // Estimate duration for rep-based exercises (assume 3 seconds per rep * sets)
            if (item.reps) return total + (item.reps as number) * 3 * sets;
            return total + 30 * sets; // Default 30 seconds per set if no duration or reps
          },
          0
        );

        const totalMinutes = Math.ceil(totalSeconds / 60);

        const routineDetailsObj = {
          name: data.name,
          totalDuration: `${totalMinutes} mins`,
          exerciseCount: processedWorkouts.length,
        };

        setWorkouts(processedWorkouts);
        setRoutineDetails(routineDetailsObj);

        // Save to cache for future use
        saveRoutineToCache(
          routineId,
          routineDetailsObj,
          processedWorkouts,
          exerciseDetailsMap
        );

        // Preload all exercise SVGs in the background (including all animation frames)
        const allImageUrls: string[] = [];

        // Collect all image URLs and animation frames from exercises
        processedWorkouts.forEach((workout: WorkoutItem) => {
          // Add main image
          if (workout.image && isSvgUrl(workout.image)) {
            allImageUrls.push(workout.image);
          }
          // Add all animation frames
          if (workout.frameUrls && workout.frameUrls.length > 0) {
            workout.frameUrls.forEach((frameUrl: string) => {
              if (isSvgUrl(frameUrl)) {
                allImageUrls.push(frameUrl);
              }
            });
          }
        });

        // Also preload images from exerciseDetailsMap (male/female variants and animations)
        Object.values(exerciseDetailsMap).forEach((exercise: any) => {
          if (exercise.gif_url && isSvgUrl(exercise.gif_url)) {
            allImageUrls.push(exercise.gif_url);
          }
          if (exercise.image_url_male && isSvgUrl(exercise.image_url_male)) {
            allImageUrls.push(exercise.image_url_male);
          }
          if (exercise.image_url_female && isSvgUrl(exercise.image_url_female)) {
            allImageUrls.push(exercise.image_url_female);
          }
          // Add animation frames from exercise details
          if (exercise.exercise_animations) {
            exercise.exercise_animations.forEach((anim: any) => {
              if (anim.frame_urls) {
                anim.frame_urls.forEach((frameUrl: string) => {
                  if (isSvgUrl(frameUrl)) {
                    allImageUrls.push(frameUrl);
                  }
                });
              }
            });
          }
        });

        // Remove duplicates
        const uniqueImageUrls = [...new Set(allImageUrls)];

        // OPTIMIZATION: Mark as ready immediately, preload in background after interactions
        // This prevents blocking the UI during navigation
        setImagesPreloaded(true);

        if (uniqueImageUrls.length > 0) {
          // Defer heavy preloading until after animations/interactions complete
          InteractionManager.runAfterInteractions(() => {
            console.log(`[Routine] Background preloading ${uniqueImageUrls.length} SVG frames...`);
            setPreloadProgress({ loaded: 0, total: uniqueImageUrls.length });

            preloadSvgs(uniqueImageUrls, (loaded, total) => {
              setPreloadProgress({ loaded, total });
            }).then(() => {
              console.log(`[Routine] All ${uniqueImageUrls.length} SVG frames preloaded in background`);
            });
          });
        }

      } catch (err) {
        console.error("Error fetching routine:", err);
        setError(err instanceof Error ? err.message : "Failed to load routine");
      } finally {
        setLoading(false);
      }
    };

    fetchRoutineData();
  }, [routineId]);

  // Memoize colors object to prevent rerenders
  const colors = React.useMemo(
    () => ({
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
    }),
    [isDarkMode, selectedPalette]
  );

  // Handle smooth data updates
  const handleDragEnd = React.useCallback(
    ({ data }: { data: WorkoutItem[] }) => {
      // Just update the local state with the new order
      setWorkouts(data);
      console.log("Exercise order updated locally");
    },
    []
  );

  // Handle hardware back button
  useEffect(() => {
    const onBackPress = () => {
      if (selectedExercise !== null) {
        setSelectedExercise(null);
        return true;
      }
      if (isEditing) {
        setIsEditing(false);
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

    return () => subscription.remove();
  }, [selectedExercise, isEditing]);

  const renderWorkoutItem = ({
    item,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<WorkoutItem>) => {
    const index = getIndex();

    // Log the workout item data when rendering to ensure is_per_side is present
    if (index === 0) {
      console.log("Rendering first workout item:", item);
    }

    return (
      <WorkoutItemComponent
        item={item}
        drag={drag}
        isActive={isActive}
        index={index}
        onPress={(idx) => {
          setSelectedExercise(idx);
          console.log(
            "Selected exercise at index:",
            idx,
            "with is_per_side:",
            workouts[idx].is_per_side
          );
        }}
        onReplace={(idx) => setReplaceTargetIndex(idx)}
        colors={colors}
        primaryColor={selectedPalette.primary}
        isDarkMode={isDarkMode}
        imagesReady={imagesPreloaded}
      />
    );
  };

  const handleReplaceExercise = (oldExerciseId: string, newExercise: any, targetIdx?: number) => {
    const idx = targetIdx !== undefined ? targetIdx : selectedExercise;
    if (idx === null) return;

    // We need to update the workout at selectedExercise index
    const updatedWorkouts = [...workouts];
    const currentWorkout = updatedWorkouts[idx];

    if (currentWorkout.exerciseId !== oldExerciseId) {
      console.warn("Exercise ID mismatch during replace", {
        expected: oldExerciseId,
        actual: currentWorkout.exerciseId
      });
      return;
    }

    const newWorkoutItem: WorkoutItem = {
      ...currentWorkout,
      name: newExercise.name,
      image: newExercise.gif_url || newExercise.image_url_male || defaultImage,
      exerciseId: newExercise.id,
    };

    updatedWorkouts[idx] = newWorkoutItem;
    setWorkouts(updatedWorkouts);

    // Update cache with new exercise details
    const updatedExerciseDetails = { ...allExerciseDetails };
    updatedExerciseDetails[newExercise.id] = {
      ...newExercise,
      focusAreas: (newExercise.exercise_focus_areas || []).map((area: any) => ({
        name: area.area,
        intensity: area.weightage / 100
      })),
      mistakes: (newExercise.exercise_mistakes || []).map((m: any) => `${m.title} - ${m.subtitle} `),
      tips: (newExercise.exercise_tips || []).map((t: any) => t.tip)
    };
    setAllExerciseDetails(updatedExerciseDetails);

    // Save changes
    if (routineId && routineDetails) {
      saveRoutineToCache(
        routineId,
        routineDetails,
        updatedWorkouts,
        updatedExerciseDetails
      ).catch(err => console.error("Error saving replaced exercise:", err));
    }
  };

  const handleBackPress = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  // Start workout flow
  const startWorkout = async () => {
    console.log("[Routine] Starting workout, routineId:", routineId);
    if (workouts.length === 0) return;

    setIsStarting(true);

    try {
      // Create a new workout session via Edge Function
      const response = await api.startWorkoutSession(routineId);
      console.log("[Routine] Session started:", response);

      if (!response.session_id) {
        throw new Error('Failed to start session');
      }

      // Store the session ID
      setWorkoutSessionId(response.session_id);

      // Start the workout
      setCurrentExerciseIndex(0);
      setWorkoutMode("start");
      setWorkoutStartTime(Date.now());
    } catch (error) {
      console.error("Error creating workout session:", error);
      // Still allow the workout to start even if tracking fails, but warn?
      // For now, proceed as before
      setCurrentExerciseIndex(0);
      setWorkoutMode("start");
      setWorkoutStartTime(Date.now());
    } finally {
      setIsStarting(false);
    }
  };

  // Handle skipping the start screen
  const handleStartSkip = () => {
    setWorkoutMode("exercise");
  };

  // Handle exercise completion with focus areas
  const handleExerciseComplete = async () => {
    const currentExercise = workouts[currentExerciseIndex];
    console.log("[Routine] Completing exercise:", currentExercise.name, "Index:", currentExerciseIndex);

    if (workoutSessionId) {
      try {
        // Get focus areas from loaded details instead of fetching
        const exerciseDetails = allExerciseDetails[currentExercise.exerciseId];
        const focusAreas = exerciseDetails?.focusAreas || [];

        // Store completion in local state using the unique step ID
        // We no longer write to DB incrementally. We will batch send at the end.
        setCompletedExercises((prev) => ({
          ...prev,
          [currentExercise.id]: {
            reps_completed: currentExercise.reps,
            duration_completed: currentExercise.rawDuration,
            is_per_side: currentExercise.is_per_side,
            focus_areas: focusAreas,
            weight_used: 0, // Default or capture if needed
            notes: "", // Default
            status: 'completed',
            exercise_id: currentExercise.exerciseId
          },
        }));

      } catch (error) {
        console.error("Error recording exercise completion:", error);
      }
    }

    if (currentExerciseIndex < workouts.length - 1) {
      setWorkoutMode("rest");
    } else {
      // Workout completed
      if (workoutStartTime) {
        const endTime = Date.now();
        const totalDurationMs = endTime - workoutStartTime;
        const totalDurationSec = Math.floor(totalDurationMs / 1000);
        setTotalWorkoutDuration(totalDurationSec);

        const minutesWorked = totalDurationMs / (1000 * 60);
        const estimatedCalories = minutesWorked * 5; // Simple estimation
        setCaloriesBurned(estimatedCalories);

        // We do NOT update session here anymore. RoutineCompleted will handle the batch save.

        // Just transition to completion
        setWorkoutMode("complete");
      }
    }

    // Clear persistence on completion
    workoutPersistenceService.clearState();
  };


  // Handle rest skipping
  const handleRestSkip = () => {
    // Move to the next exercise
    setCurrentExerciseIndex((prevIndex) => prevIndex + 1);
    setWorkoutMode("exercise");
  };

  // Handle previous exercise navigation
  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prevIndex) => prevIndex - 1);
    }
  };

  // Handle next exercise navigation (skipping current)
  const handleNextExercise = () => {
    console.log(
      `handleNextExercise called, current mode: ${workoutMode}, index: ${currentExerciseIndex} `
    );

    if (workoutMode === "rest") {
      // Coming from rest screen, just go to the next exercise
      console.log("Coming from rest, advancing to next exercise");
      setCurrentExerciseIndex((prevIndex) => prevIndex + 1);
      setWorkoutMode("exercise");
    } else {
      // Coming from exercise screen, go to rest or completion
      console.log("Coming from exercise, calling handleExerciseComplete");
      handleExerciseComplete();
    }
  };

  // Handle returning to routine view
  const handleBackToRoutine = () => {
    setWorkoutMode("idle");
    setCurrentExerciseIndex(0);
  };

  // Handle showing quit dialog and pausing workout
  const handleShowQuitDialog = () => {
    setIsWorkoutPaused(true);
    setShowQuitDialog(true);
  };

  // Handle dismissing quit dialog and resuming workout
  const handleDismissQuitDialog = () => {
    setShowQuitDialog(false);
    setIsWorkoutPaused(false);
  };

  // Handle back button press during workout
  const handleWorkoutBack = () => {
    handleShowQuitDialog();
  };

  const handleSaveEdit = async (updatedWorkouts: WorkoutItem[]) => {
    // Update workouts state with the new data
    setWorkouts(updatedWorkouts);
    setIsEditing(false);

    // Update exercise details for any changed workouts
    const updatedExerciseDetails = { ...allExerciseDetails };
    updatedWorkouts.forEach((workout) => {
      if (updatedExerciseDetails[workout.exerciseId]) {
        // Update the cached exercise data with new values
        updatedExerciseDetails[workout.exerciseId] = {
          ...updatedExerciseDetails[workout.exerciseId],
          localReps: workout.reps,
          localDuration: workout.rawDuration,
          // Also update the base values to match
          reps: workout.reps,
          duration: workout.rawDuration,
        };
      }
    });
    setAllExerciseDetails(updatedExerciseDetails);

    // Save to local storage with updated data
    if (routineId && routineDetails) {
      await saveRoutineToCache(
        routineId,
        routineDetails,
        updatedWorkouts.map((workout) => ({
          ...workout,
          // Ensure local values match the current values
          localReps: workout.reps,
          localDuration: workout.rawDuration,
        })),
        updatedExerciseDetails
      );
    }
  };

  // Function to reset routine data
  const handleResetRoutine = async () => {
    if (!routineId) return;

    setShowMenu(false);
    setRefreshing(true);

    try {
      // Clear existing cache for this routine
      await AsyncStorage.removeItem(`${ROUTINE_CACHE_PREFIX}${routineId}`);
      await AsyncStorage.removeItem(`${EXERCISE_CACHE_PREFIX}${routineId}`);

      // Fetch fresh data from API
      setLoading(true);
      setError(null);

      // Fetch routine with exercises (same code as in fetchRoutineData)
      const { data, error: routineError } = await supabase
        .from("workout_routines")
        .select(
          `
    id,
      name,
      created_at,
      updated_at,
      routine_exercises(
        id,
        order_position,
        reps,
        duration,
        exercise: exercises(
          id,
          name,
          gif_url,
          image_url_male,
          image_url_female,
          exercise_type,
          instructions,
          equipments,
          avg_time_per_rep,
          place,
          exercise_focus_areas(
            id,
            area,
            weightage
          ),
          exercise_mistakes(
            id,
            title,
            subtitle
          ),
          exercise_tips(
            id,
            tip
          ),
          exercise_animations(
            id,
            gender,
            frame_urls,
            frame_count
          ),
          is_per_side
        )
      )
        `
        )
        .eq("id", routineId)
        .single();

      if (routineError) throw routineError;

      if (!data) {
        throw new Error("Routine not found");
      }

      // Fetch user profile to determine gender for asset selection
      let isFemale = false;
      try {
        const profileData = await api.getProfile();
        const g = profileData.profile?.gender?.toLowerCase();
        isFemale = g === 'female' || g === 'woman';
      } catch (e) {
        console.warn("Could not fetch profile for gender logic", e);
      }

      // Extract and prepare all exercise details for cache
      const exerciseDetailsMap: { [key: string]: any } = {};

      data.routine_exercises.forEach((item: any) => {
        if (item.exercise && item.exercise.id) {
          exerciseDetailsMap[item.exercise.id] = {
            ...item.exercise,
            // Process the data for the UI components
            focusAreas: (item.exercise.exercise_focus_areas || []).map(
              (area: any) => ({
                name: area.area,
                intensity: area.weightage / 100,
              })
            ),
            mistakes: (item.exercise.exercise_mistakes || []).map(
              (mistake: any) => `${mistake.title} - ${mistake.subtitle}`
            ),
            tips: (item.exercise.exercise_tips || []).map(
              (tip: any) => tip.tip
            ),
          };
        }
      });

      // Save all exercise details to state
      setAllExerciseDetails(exerciseDetailsMap);

      // Process the data for the UI
      const processedWorkouts = (data.routine_exercises || [])
        .sort((a: any, b: any) => a.order_position - b.order_position)
        .map((item: any) => {
          const exerciseName = safeGet(item, "exercise.name", "Unknown");
          const isPerSide = safeGet(item, "exercise.is_per_side", false);

          // Get image URL with proper fallback chain
          const gifUrl = safeGet(item, "exercise.gif_url", null);
          const maleImageUrl = safeGet(item, "exercise.image_url_male", null);
          const femaleImageUrl = safeGet(item, "exercise.image_url_female", null);

          let finalImageUrl = defaultImage;
          if (isFemale) {
            finalImageUrl = femaleImageUrl || gifUrl || maleImageUrl || defaultImage;
          } else {
            finalImageUrl = maleImageUrl || gifUrl || femaleImageUrl || defaultImage;
          }

          // Get animation frames - prefer male frames, fallback to female
          const exerciseAnimations = safeGet(item, "exercise.exercise_animations", []);
          const maleAnimation = exerciseAnimations.find((anim: any) => anim.gender === 'male');
          const femaleAnimation = exerciseAnimations.find((anim: any) => anim.gender === 'female');

          const animation = isFemale ? (femaleAnimation || maleAnimation) : (maleAnimation || femaleAnimation);
          const frameUrls = animation?.frame_urls || [];
          const frameCount = animation?.frame_count || frameUrls.length;

          console.log(
            `Processing exercise: ${exerciseName}`,
            `\n  - gif_url: ${gifUrl}`,
            `\n  - image_url_male: ${maleImageUrl}`,
            `\n  - frame_count: ${frameCount}`,
            `\n  - is_per_side: ${isPerSide}`,
            `\n  - isFemale: ${isFemale}`
          );

          return {
            id: item.id,
            name: exerciseName,
            duration: item.duration ? formatTime(item.duration) : undefined,
            reps: item.reps || undefined,
            image: finalImageUrl,
            exerciseId: safeGet(item, "exercise.id", ""),
            orderPosition: item.order_position,
            rawDuration: item.duration,
            localReps: item.reps || undefined,
            localDuration: item.duration || undefined,
            is_per_side: isPerSide,
            frameUrls: frameUrls.length > 0 ? frameUrls : undefined,
            frameCount: frameCount > 0 ? frameCount : undefined,
          };
        });

      // Calculate total duration
      const totalSeconds = (data.routine_exercises || []).reduce(
        (total: number, item: any) => {
          if (item.duration) return total + (item.duration as number);
          if (item.reps) return total + (item.reps as number) * 3;
          return total + 30;
        },
        0
      );

      const totalMinutes = Math.ceil(totalSeconds / 60);

      const routineDetailsObj = {
        name: data.name,
        totalDuration: `${totalMinutes} mins`,
        exerciseCount: processedWorkouts.length,
      };

      setWorkouts(processedWorkouts);
      setRoutineDetails(routineDetailsObj);

      // Save to cache for future use
      saveRoutineToCache(
        routineId,
        routineDetailsObj,
        processedWorkouts,
        exerciseDetailsMap
      );

      console.log("Routine data refreshed successfully");
    } catch (err) {
      console.error("Error refreshing routine data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to refresh routine"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Render workout flow components based on state
  const renderWorkoutFlow = () => {
    // Create a wrapper function for workout flows that need the quit dialog
    const renderWithQuitDialog = (component: React.ReactNode) => {
      return (
        <>
          {component}
          {showQuitDialog && (
            <RoutineQuit
              onCancel={handleDismissQuitDialog}
              onQuit={() => {
                handleDismissQuitDialog();
                setWorkoutMode("idle");
                setCurrentExerciseIndex(0);
                workoutPersistenceService.clearState();
              }}
              isPaused={true}
            />
          )}
        </>
      );
    };

    // Use switch statement instead of if/else to handle workoutMode
    switch (workoutMode) {
      case "edit":
        return (
          <RoutineEdit
            workouts={workouts}
            onClose={() => setWorkoutMode("idle")}
            onSave={handleSaveEdit}
          />
        );

      case "start":
        return renderWithQuitDialog(
          <RoutineStart
            exercise={{
              name: workouts[currentExerciseIndex].name,
              image: workouts[currentExerciseIndex].image,
              exerciseId: workouts[currentExerciseIndex].exerciseId,
              frameUrls: workouts[currentExerciseIndex].frameUrls,
              frameCount: workouts[currentExerciseIndex].frameCount,
              instructions: workouts[currentExerciseIndex].instructions,
              focusAreas: workouts[currentExerciseIndex].focusAreas,
              mistakes: workouts[currentExerciseIndex].mistakes,
              tips: workouts[currentExerciseIndex].tips,
              exercise_type: workouts[currentExerciseIndex].exercise_type,
            }}
            onSkip={() => setWorkoutMode("exercise")}
            onBack={handleWorkoutBack}
            isPaused={isWorkoutPaused}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
          />
        );

      case "exercise":
        return renderWithQuitDialog(
          <RoutineWorkingOut
            exercise={{
              name: workouts[currentExerciseIndex].name,
              image: workouts[currentExerciseIndex].image,
              exerciseId: workouts[currentExerciseIndex].exerciseId,
              duration: workouts[currentExerciseIndex].rawDuration,
              reps: workouts[currentExerciseIndex].reps,
              is_per_side: workouts[currentExerciseIndex].is_per_side,
              frameUrls: workouts[currentExerciseIndex].frameUrls,
              frameCount: workouts[currentExerciseIndex].frameCount,
              instructions: workouts[currentExerciseIndex].instructions,
              focusAreas: workouts[currentExerciseIndex].focusAreas,
              mistakes: workouts[currentExerciseIndex].mistakes,
              tips: workouts[currentExerciseIndex].tips,
              exercise_type: workouts[currentExerciseIndex].exercise_type,
            }}
            onBack={handleWorkoutBack}
            onComplete={handleExerciseComplete}
            onPrevious={handlePreviousExercise}
            onNext={handleNextExercise}
            hasNext={currentExerciseIndex < workouts.length - 1}
            hasPrevious={currentExerciseIndex > 0}
            isPaused={isWorkoutPaused}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            onExerciseProgress={(progress) => {
              try {
                const currentStepId = workouts[currentExerciseIndex].id;

                // Get focus areas from loaded details instead of fetching
                const exerciseDetails = allExerciseDetails[progress.exerciseId];
                const focusAreas = exerciseDetails?.focusAreas || [];

                // Store completion in local state
                setCompletedExercises((prev) => ({
                  ...prev,
                  [currentStepId]: {
                    reps_completed:
                      progress.repsCompleted ||
                      workouts[currentExerciseIndex].reps,
                    duration_completed:
                      progress.timeSpent ||
                      workouts[currentExerciseIndex].rawDuration,
                    is_per_side:
                      progress.isPerSide ||
                      workouts[currentExerciseIndex].is_per_side,
                    focus_areas: focusAreas?.map((fa: any) => ({
                      area: fa.area,
                      // We now store 'weightage' in exerciseDetailsMap, so this works
                      intensity: Math.round(fa.weightage / 10),
                    })),
                    status: progress.status || "completed",
                    exercise_id: progress.exerciseId
                  },
                }));
              } catch (error) {
                console.error("Error recording exercise progress:", error);
              }
            }}
          />
        );

      // During rest, we need to show the NEXT exercise (at index+1) that the user will do after resting
      case "rest":
        return renderWithQuitDialog(
          <RoutineRest
            nextExercise={{
              name: workouts[currentExerciseIndex + 1].name,
              image: workouts[currentExerciseIndex + 1].image,
              exerciseId: workouts[currentExerciseIndex + 1].exerciseId,
              duration: workouts[currentExerciseIndex + 1].rawDuration,
              reps: workouts[currentExerciseIndex + 1].reps,
              is_per_side: workouts[currentExerciseIndex + 1].is_per_side,
              frameUrls: workouts[currentExerciseIndex + 1].frameUrls,
              frameCount: workouts[currentExerciseIndex + 1].frameCount,
              instructions: workouts[currentExerciseIndex + 1].instructions,
              focusAreas: workouts[currentExerciseIndex + 1].focusAreas,
              mistakes: workouts[currentExerciseIndex + 1].mistakes,
              tips: workouts[currentExerciseIndex + 1].tips,
              exercise_type: workouts[currentExerciseIndex + 1].exercise_type,
            }}
            currentExerciseNumber={currentExerciseIndex + 1}
            totalExercises={workouts.length}
            onSkip={handleRestSkip}
            onBack={handleWorkoutBack}
            restDuration={restDuration}
            isPaused={isWorkoutPaused}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
          />
        );

      case "complete":
        return (
          <RoutineCompleted
            routineId={routineId}

            routineName={routineDetails?.name || "Workout"}
            routineImage={coverImage}
            totalExercises={workouts.length}
            totalDuration={totalWorkoutDuration}
            caloriesBurned={caloriesBurned}
            workoutSessionId={workoutSessionId}
            initialStreak={cachedStreak}
            initialWeeklyActivity={cachedWeeklyActivity}
            focusAreaSummary={Object.values(completedExercises).reduce(
              (summary: any, exercise) => {
                exercise.focus_areas?.forEach((fa) => {
                  if (fa.area) { // Ensure area exists
                    if (summary[fa.area]) {
                      summary[fa.area] = (summary[fa.area] + fa.intensity) / 2;
                    } else {
                      summary[fa.area] = fa.intensity;
                    }
                  }
                });
                return summary;
              },
              {}
            )}
            exercises={Object.values(completedExercises)}
            onClose={handleBackToRoutine}
            onNext={() => {
              setWorkoutMode("idle");
              setCurrentExerciseIndex(0);
            }}
            context={context}
            userChallengeId={userChallengeId}
            dayNumber={dayNumber}
            challengeId={challengeId}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={selectedPalette.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading routine...
        </Text>
        {preloadProgress.total > 0 && (
          <Text style={[styles.preloadText, { color: colors.textSecondary }]}>
            Loading images: {preloadProgress.loaded}/{preloadProgress.total}
          </Text>
        )}
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={selectedPalette.primary}
        />
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity
          style={[
            styles.errorButton,
            { backgroundColor: selectedPalette.primary },
          ]}
          onPress={handleBackPress}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If in workout mode, render the workout flow
  if (workoutMode !== "idle") {
    return renderWorkoutFlow();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {selectedExercise !== null ? (
        <RoutineExercise
          exerciseId={workouts[selectedExercise].exerciseId}
          onBack={() => setSelectedExercise(null)}
          currentIndex={selectedExercise + 1}
          totalExercises={workouts.length}
          onNext={() => {
            if (selectedExercise < workouts.length - 1) {
              setSelectedExercise(selectedExercise + 1);
            }
          }}
          onPrevious={() => {
            if (selectedExercise > 0) {
              setSelectedExercise(selectedExercise - 1);
            }
          }}
          nextExerciseId={
            selectedExercise < workouts.length - 1
              ? workouts[selectedExercise + 1].exerciseId
              : undefined
          }
          prevExerciseId={
            selectedExercise > 0
              ? workouts[selectedExercise - 1].exerciseId
              : undefined
          }
          preloadedExerciseData={
            allExerciseDetails[workouts[selectedExercise].exerciseId]
          }
          initialReps={workouts[selectedExercise].reps}
          initialDuration={workouts[selectedExercise].rawDuration}
          onExerciseSettingsChange={handleExerciseSettingsChange}
          onReplace={handleReplaceExercise}
          exercisesCache={allExerciseDetails}
        />
      ) : isEditing ? (
        <RoutineEdit
          workouts={workouts}
          onClose={() => setIsEditing(false)}
          onSave={handleSaveEdit}
        />
      ) : (
        <>
          {/* Navigation Bar */}
          <View style={styles.navbar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenu(true)}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Replace Exercise Modal */}
          <ReplaceExerciseModal
            isVisible={replaceTargetIndex !== null}
            onClose={() => setReplaceTargetIndex(null)}
            onSelect={(newExercise) => {
              if (replaceTargetIndex !== null) {
                const oldExerciseId = workouts[replaceTargetIndex].exerciseId;
                handleReplaceExercise(oldExerciseId, newExercise, replaceTargetIndex);
                setReplaceTargetIndex(null);
              }
            }}
            currentExerciseName={replaceTargetIndex !== null ? workouts[replaceTargetIndex].name : ""}
          />

          {/* Menu Popup */}
          {showMenu && (
            <View style={styles.menuOverlay}>
              <TouchableOpacity
                style={styles.menuBackdrop}
                onPress={() => setShowMenu(false)}
                activeOpacity={1}
              />
              <View
                style={[
                  styles.menuPopup,
                  {
                    backgroundColor: colors.surface,
                    top: Platform.OS === "ios" ? 90 : 70,
                    right: 16,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.menuItem, { opacity: refreshing ? 0.5 : 1 }]}
                  onPress={handleResetRoutine}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <ActivityIndicator
                      size="small"
                      color={selectedPalette.primary}
                    />
                  ) : (
                    <Ionicons
                      name="refresh"
                      size={20}
                      color={colors.text}
                      style={styles.menuIcon}
                    />
                  )}
                  <Text style={[styles.menuText, { color: colors.text }]}>
                    {refreshing ? "Refreshing..." : "Reset Routine"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => setShowMenu(false)}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={colors.text}
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, { color: colors.text }]}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Main Content with Scrollable Header */}
          <GestureHandlerRootView style={{ flex: 1 }}>
            <DraggableFlatList
              data={workouts}
              onDragEnd={handleDragEnd}
              keyExtractor={(item: WorkoutItem) => item.id}
              renderItem={renderWorkoutItem}
              contentContainerStyle={styles.listContainer}
              animationConfig={{
                damping: 20,
                stiffness: 200,
                mass: 0.5,
                overshootClamping: false,
              }}
              autoscrollSpeed={300}
              dragItemOverflow={true}
              onDragBegin={() => { }}
              simultaneousHandlers={[]}
              maxToRenderPerBatch={5}
              updateCellsBatchingPeriod={50}
              windowSize={10}
              removeClippedSubviews={false}
              ListHeaderComponent={
                <View>
                  <Image
                    source={{
                      uri: coverImage,
                    }}
                    style={styles.headerImage}
                  />
                  <View style={styles.titleSection}>
                    <Text style={[styles.title, { color: colors.text }]}>
                      {routineDetails?.name || "WORKOUT ROUTINE"}
                    </Text>
                    <View style={styles.metaInfo}>
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {routineDetails?.totalDuration || "0 mins"} •{" "}
                        {routineDetails?.exerciseCount || 0}{" "}
                        {routineDetails?.exerciseCount === 1 ? "Exercise" : "Exercises"}
                      </Text>
                      <TouchableOpacity onPress={() => setIsEditing(true)}>
                        <Text
                          style={[
                            styles.editButton,
                            { color: selectedPalette.primary },
                          ]}
                        >
                          Edit
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              }
              ListEmptyComponent={
                <View style={[styles.emptyContainer, { paddingHorizontal: 16 }]}>
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    No exercises in this routine
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.emptyButton,
                      { borderColor: selectedPalette.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.emptyButtonText,
                        { color: selectedPalette.primary },
                      ]}
                    >
                      Add Exercise
                    </Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </GestureHandlerRootView>

          {/* Start Button */}
          <TouchableOpacity
            style={[
              styles.startButton,
              {
                backgroundColor: selectedPalette.primary,
                opacity: workouts.length === 0 || isStarting ? 0.8 : 1, // Slightly less opacity reduction for loading
              },
            ]}
            disabled={workouts.length === 0 || isStarting}
            onPress={startWorkout}
          >
            {isStarting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.startButtonText}>Start</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerImage: {
    width: width,
    height: 260,
  },
  navbar: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 28,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "Outfit-Bold",
    marginBottom: 14,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  metaInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaText: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  editButton: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    letterSpacing: 0.3,
  },
  listContainer: {
    paddingBottom: 130,
    paddingTop: 0,
  },
  workoutItem: {
    marginHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 16,
  },
  dragHandle: {
    padding: 8,
    marginLeft: 4,
  },
  imageWrapper: {
    marginRight: 14,
  },
  workoutImage: {
    width: 88,
    height: 88,
    borderRadius: 16,
  },
  workoutInfo: {
    flex: 1,
    paddingRight: 12,
    justifyContent: 'center',
  },
  workoutName: {
    fontSize: 15,
    fontFamily: "Outfit-Bold",
    marginBottom: 4,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutMeta: {
    fontSize: 15,
    fontFamily: "Outfit-Bold",
    letterSpacing: 0.3,
  },
  swapButton: {
    padding: 12,
    borderRadius: 14,
  },
  startButton: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 44 : 54,
    left: 24,
    right: 24,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    letterSpacing: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    marginTop: 20,
  },
  preloadText: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
    marginTop: 8,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    marginTop: 20,
    marginBottom: 20,
  },
  errorButton: {
    padding: 16,
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 20,
  },
  errorButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Outfit-Bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    marginBottom: 20,
  },
  emptyButton: {
    padding: 16,
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 20,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Outfit-Bold",
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  menuPopup: {
    position: "absolute",
    minWidth: 180,
    padding: 8,
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1001,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
  menuBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});
