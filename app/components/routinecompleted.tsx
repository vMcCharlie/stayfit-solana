import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from "react-native";
// ChallengeService removed
import { useTheme } from "../../src/context/theme";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  useDerivedValue,
  useAnimatedProps,
} from "react-native-reanimated";
import { TextInput } from "react-native";
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
// Note: Some animation imports kept for confetti particles
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../../src/services/api";
import { useRouter } from "expo-router";
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Polygon } from "react-native-svg";
import { getLocalYYYYMMDD } from "../../src/utils/date";


const { width, height } = Dimensions.get("window");

// Motivational messages based on streak
const getStreakMessage = (streak: number): string => {
  if (streak === 1) return "Great start! Keep it going!";
  if (streak === 2) return "Two days strong!";
  if (streak === 3) return "Almost a 7 day health streak!";
  if (streak >= 4 && streak < 7) return "Almost a 7 day health streak!";
  if (streak === 7) return "One full week! Amazing!";
  if (streak > 7 && streak < 14) return "Keep the momentum going!";
  if (streak >= 14 && streak < 30) return "You're unstoppable!";
  if (streak >= 30) return "Legendary consistency!";
  return "Consistency is key to results.";
};

// Confetti particle component
const ConfettiParticle = ({ delay, startX, color }: { delay: number; startX: number; color: string }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(height + 100, { duration: 4000 + Math.random() * 2000, easing: Easing.linear }),
        -1,
        false
      )
    );
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(startX + (Math.random() - 0.5) * 100, { duration: 1000 }),
          withTiming(startX + (Math.random() - 0.5) * 100, { duration: 1000 })
        ),
        -1,
        true
      )
    );
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value }
    ],
    opacity: opacity.value
  }));

  const size = 6 + Math.random() * 8;
  const isCircle = Math.random() > 0.5;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: isCircle ? size : size * 0.4,
          backgroundColor: color,
          borderRadius: isCircle ? size / 2 : 2,
          top: -50,
          left: startX,
        },
        animatedStyle
      ]}
    />
  );
};

// Grid background with fading edges
const GridBackground = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const gridSize = 25;
  const gridColor = isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
  const bgColor = isDarkMode ? '#1A1C1E' : '#FFFFFF';

  const horizontalLines = [];
  const verticalLines = [];
  const numLines = 15;

  for (let i = 0; i < numLines; i++) {
    horizontalLines.push(
      <View
        key={`h-${i}`}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: i * gridSize,
          height: 1,
          backgroundColor: gridColor,
        }}
      />
    );
    verticalLines.push(
      <View
        key={`v-${i}`}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: i * gridSize,
          width: 1,
          backgroundColor: gridColor,
        }}
      />
    );
  }

  return (
    <View style={styles.gridContainer}>
      {horizontalLines}
      {verticalLines}
      {/* Radial fade overlay using multiple gradients */}
      <LinearGradient
        colors={['transparent', bgColor]}
        style={[StyleSheet.absoluteFill]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.15 }}
      />
      <LinearGradient
        colors={['transparent', bgColor]}
        style={[StyleSheet.absoluteFill]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0.85 }}
      />
      <LinearGradient
        colors={['transparent', bgColor]}
        style={[StyleSheet.absoluteFill]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0.15, y: 0.5 }}
      />
      <LinearGradient
        colors={['transparent', bgColor]}
        style={[StyleSheet.absoluteFill]}
        start={{ x: 1, y: 0.5 }}
        end={{ x: 0.85, y: 0.5 }}
      />
    </View>
  );
};

// Hexagon shape for fire animation
const HexagonContainer = ({ children, size = 180, isDarkMode }: { children: React.ReactNode; size?: number; isDarkMode: boolean }) => {
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  // Calculate hexagon points
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 4;

  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgRadialGradient id="hexGrad" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={isDarkMode ? '#3A3A3A' : '#F8F8F8'} />
            <Stop offset="100%" stopColor={isDarkMode ? '#2A2A2A' : '#E8E8E8'} />
          </SvgRadialGradient>
        </Defs>
        <Polygon
          points={points.join(' ')}
          fill="url(#hexGrad)"
          stroke={borderColor}
          strokeWidth={2}
        />
      </Svg>
      <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
        {children}
      </View>
    </View>
  );
};

// Get week dates centered on today
const getWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const result = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + mondayOffset + i);
    result.push({
      day: days[i],
      date: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
      isPast: date < today && date.toDateString() !== today.toDateString()
    });
  }

  return result;
};

// Motivational messages for stats screen
const motivationalMessages = [
  "You're getting stronger every day!",
  "Another workout in the books!",
  "Consistency is where the magic happens.",
  "You should be proud of yourself.",
  "One step closer to your goals!",
  "Excellent effort today!",
];

// Share card motivational quotes for social sharing
const shareCardQuotes = [
  "The only bad workout is the one that didn't happen.",
  "Sweat is just fat crying.",
  "Your body can do it. It's your mind you need to convince.",
  "Progress, not perfection.",
  "Every workout counts.",
  "Discipline is choosing between what you want now and what you want most.",
];

// Share card tab types
const SHARE_CARD_TABS = ['Transparent', 'Minimal', 'Stats', 'Quote'] as const;
type ShareCardTab = typeof SHARE_CARD_TABS[number];

// Checkered pattern component for transparent background effect
const CheckeredPattern = ({ size = 20 }: { size?: number }) => {
  const rows = 30;
  const cols = 20;

  return (
    <View style={StyleSheet.absoluteFill}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row' }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <View
              key={colIndex}
              style={{
                width: size,
                height: size,
                backgroundColor: (rowIndex + colIndex) % 2 === 0 ? '#3A3A3A' : '#2A2A2A',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

// Text with shadow effect for share cards
const ShadowText = ({ children, style, ...props }: any) => (
  <Text
    {...props}
    style={[
      style,
      {
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
      },
    ]}
  >
    {children}
  </Text>
);

// Pulsing Wrapper for Streak Flame
const PulsingView = ({ children }: { children: React.ReactNode }) => {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

// Animated Counter Component
const AnimatedCounter = ({ value, style, suffix = '' }: { value: number, style?: any, suffix?: string }) => {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, { duration: 1500, easing: Easing.out(Easing.exp) });
  }, [value]);

  useDerivedValue(() => {
    const val = Math.round(animatedValue.value);
    // Use runOnJS to update state is safest cross-platform without Reanimated Text helper
    // However, for best perf, we often use AnimatedTextInput. 
    // Let's use the TextInput trick for 60fps
  });

  // Using TextInput prop adapter for smooth 60fps text updates
  const animatedProps = useAnimatedProps(() => {
    return {
      text: `${Math.round(animatedValue.value)}${suffix}`,
      // We need to force update the value prop for some versions of RN
      value: `${Math.round(animatedValue.value)}${suffix}`
    } as unknown as any;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      style={[style, { padding: 0 }]} // Remove default padding
      animatedProps={animatedProps}
    />
  );
};

interface RoutineCompletedProps {
  onClose: () => void;
  onNext: () => void;
  routineName: string;
  routineImage: string;
  totalExercises: number;
  totalDuration: number;
  caloriesBurned: number;
  workoutSessionId: string | null;
  focusAreaSummary?: { [key: string]: number };
  exercises?: any[];
  initialStreak?: number;
  initialWeeklyActivity?: string[];
  routineId: string;
  context?: string;
  userChallengeId?: string;
  dayNumber?: number;
  challengeId?: string;
}

export default function RoutineCompleted({
  onClose,
  routineName,
  routineImage,
  totalExercises,
  totalDuration,
  caloriesBurned,
  workoutSessionId,
  focusAreaSummary,
  exercises,
  initialStreak = 0,
  initialWeeklyActivity = [],
  routineId,
  context,
  userChallengeId,
  dayNumber,
  challengeId,
}: RoutineCompletedProps) {
  const router = useRouter();
  const { isDarkMode, selectedPalette } = useTheme();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [quote, setQuote] = useState("");
  // Use initial values from props (cached from homepage), update when API responds
  const [streak, setStreak] = useState(initialStreak);
  const [weeklyActivity, setWeeklyActivity] = useState<string[]>(initialWeeklyActivity);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const cardListRef = useRef<FlatList>(null);
  const submittedRef = useRef(false);

  // Share card state
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user already completed a workout today (before this one)
  const todayDate = getLocalYYYYMMDD();
  const hadWorkoutTodayBefore = initialWeeklyActivity.includes(todayDate);

  // Get week dates for display
  const weekDates = useMemo(() => getWeekDates(), []);

  // Generate confetti particles
  const confettiColors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  const confettiParticles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      delay: Math.random() * 2000,
      startX: Math.random() * width,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)]
    }));
  }, []);

  const colors = {
    background: isDarkMode ? selectedPalette.dark.background : selectedPalette.light.background,
    surface: isDarkMode ? selectedPalette.dark.surface : selectedPalette.light.surface,
    text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
    textSecondary: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
    primary: selectedPalette.primary,
    border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
  };

  useEffect(() => {
    setQuote(motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]);

    // Optimistically update streak: if today is not in weekly activity, add 1 to streak
    const todayDate = getLocalYYYYMMDD();
    const todayAlreadyHasWorkout = initialWeeklyActivity.includes(todayDate);

    if (!todayAlreadyHasWorkout && initialStreak >= 0) {
      // This is a new workout for today, optimistically increment streak
      setStreak(initialStreak + 1);
      // Also add today to weekly activity
      setWeeklyActivity([...initialWeeklyActivity, todayDate]);
    }

    // Combined initialization function that runs sequentially
    const initializeAll = async () => {
      // 1. Save workout session data
      if (workoutSessionId && !submittedRef.current) {
        submittedRef.current = true;
        try {
          await api.completeWorkoutSession({
            session_id: workoutSessionId,
            routine_id: routineId,
            completed_at: new Date().toISOString(),
            total_duration: totalDuration,
            total_calories_burned: Math.round(caloriesBurned),
            exercises: exercises || [],
            focus_areas_summary: focusAreaSummary
          });
          console.log("[RoutineCompleted] Workout session saved successfully");
        } catch (e) {
          console.error("Error saving workout", e);
          submittedRef.current = false;
        }
      }

      // 2. Handle Challenge Completion
      if (context === 'challenge' && userChallengeId && dayNumber) {
        try {
          // Type cast dayNumber to number just in case
          const dNum = typeof dayNumber === 'string' ? parseInt(dayNumber) : dayNumber;
          await api.completeChallengeDay(userChallengeId, dNum);
          console.log("[RoutineCompleted] Challenge day completed");
        } catch (e) {
          console.error("Error completing challenge day", e);
        }
      }

      // 3. Fetch updated profile data (streak, etc.) AFTER challenge completion
      try {
        const profile = await api.getProfile();
        if (profile.streak !== undefined) {
          setStreak(Math.max(1, profile.streak));
        }
        if (profile.weekly_activity) {
          // weekly_activity is now an array of date strings
          setWeeklyActivity(profile.weekly_activity);
        }
        if (profile.profile?.avatar_url) {
          setAvatarUrl(profile.profile.avatar_url);
        }
      } catch (e) {
        console.error("Error fetching profile", e);
      }
    };

    // Execute all initialization
    initializeAll();

  }, []);


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleShare = async () => {
    try {
      if (viewShotRef.current) {
        // Set capturing mode to hide checkered pattern and use transparent background
        setIsCapturing(true);

        // Small delay to ensure the state update is rendered
        await new Promise(resolve => setTimeout(resolve, 100));

        const uri = await captureRef(viewShotRef, {
          format: "png",
          quality: 1.0,
          width: 1080,
          height: 1920,
          result: "tmpfile"
        });

        // Reset capturing mode
        setIsCapturing(false);

        // Try to save to library (might fail if permissions not configured in build)
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') {
            await MediaLibrary.saveToLibraryAsync(uri);
            console.log("Saved to library");
          }
        } catch (saveError) {
          // Log but don't block sharing
          console.warn("Failed to save to library:", saveError);
        }

        // Always try to open share dialog
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        }
      }
    } catch (error) {
      setIsCapturing(false);
      console.error("Error sharing:", error);
    }
  };

  const handleFinish = () => {
    setIsLoading(true);
    // Short timeout to allow UI to update before navigation
    setTimeout(() => {
      onClose();
      router.push("/(tabs)/reports");
    }, 50);
  };

  // --- Components ---

  // Share card width configuration for centered carousel with peeking
  // To show next/prev cards, width must be < screen width
  const CARD_WIDTH = width * 0.55; // Reduced width further per user request
  const CARD_HEIGHT = CARD_WIDTH * (16 / 9); // Enforce true 9:16 Aspect Ratio
  const CARD_SPACING = 20;
  // Calculate inset to center the active card
  const INSET_X = (width - CARD_WIDTH) / 2;



  // Transparent Style Share Card (Strava-like)
  const TransparentShareCard = () => {
    return (
      <View style={[
        styles.transparentCardContainer,
        {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          // Use transparent background when capturing
          backgroundColor: isCapturing ? 'transparent' : undefined,
        }
      ]}>
        <View style={[styles.transparentCardInner, isCapturing && { backgroundColor: 'transparent' }]}>
          {/* Checkered background for transparency effect - hidden when capturing */}
          {!isCapturing && <CheckeredPattern size={18} />}



          {/* Content overlay */}
          <View style={styles.transparentCardContent}>

            {/* Stats */}
            <View style={styles.transparentStatGroup}>
              <ShadowText style={styles.transparentStatLabel}>EXERCISES</ShadowText>
              <ShadowText style={styles.transparentStatValue}>{totalExercises}</ShadowText>
            </View>

            <View style={styles.transparentStatGroup}>
              <ShadowText style={styles.transparentStatLabel}>CALORIES</ShadowText>
              <ShadowText style={styles.transparentStatValue}>{Math.round(caloriesBurned)}</ShadowText>
            </View>

            <View style={styles.transparentStatGroup}>
              <ShadowText style={styles.transparentStatLabel}>TIME</ShadowText>
              <ShadowText style={styles.transparentStatValue}>{formatTime(totalDuration)}</ShadowText>
            </View>

            {/* Branding Pill - Centered under stats */}
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <View style={styles.cleanBrandPill}>
                <Image
                  source={require('../../assets/images/logo-white.png')}
                  style={{ width: 18, height: 18, marginRight: 6 }}
                  resizeMode="contain"
                />
                <Text style={styles.cleanBrandText}>Stay Fit</Text>
              </View>
            </View>

            {/* Footer removed per user request */}
          </View>
        </View>
      </View>
    );
  };

  // Minimal Style Share Card with Quote
  const MinimalShareCard = ({ isActive, index }: { isActive: boolean; index: number }) => {
    const offset = index - activeCardIndex;
    const scale = isActive ? 1 : 0.9;
    const translateX = isActive ? 0 : offset * 15;

    return (
      <View style={[
        styles.transparentCardContainer,
        {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          opacity: isActive ? 1 : 0.6,
          transform: [
            { scale },
            { translateX },
          ],
          zIndex: isActive ? 10 : 5 - Math.abs(offset),
          // Use transparent background when capturing
          backgroundColor: isCapturing ? 'transparent' : undefined,
        }
      ]}>
        <View style={[styles.transparentCardInner, isCapturing && { backgroundColor: 'transparent' }]}>
          {/* Checkered background for transparency effect - hidden when capturing */}
          {!isCapturing && <CheckeredPattern size={18} />}

          {/* Content overlay */}
          <View style={styles.transparentCardContent}>
            <View style={{ flex: 0.8 }} />

            {/* Motivational Quote */}
            <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
              <ShadowText style={styles.quoteCardText}>"{quote}"</ShadowText>
            </View>

            {/* Workout name */}
            <ShadowText style={styles.transparentWorkoutName}>{routineName}</ShadowText>

            {/* Quick stats row */}
            <View style={styles.quickStatsRow}>
              <ShadowText style={styles.quickStat}>{totalExercises} exercises</ShadowText>
              <ShadowText style={styles.quickStatDot}>•</ShadowText>
              <ShadowText style={styles.quickStat}>{formatTime(totalDuration)}</ShadowText>
            </View>

            <View style={{ flex: 1 }} />

            {/* Footer with logo */}
            <View style={styles.transparentFooter}>
              <Image
                source={require('../../assets/images/logo-white.png')}
                style={{ width: 24, height: 24, opacity: 0.95 }}
                resizeMode="contain"
              />
              <ShadowText style={styles.transparentBrand}>Stay Fit</ShadowText>
            </View>
          </View>
        </View>
      </View>
    );
  };



  // Share card data for the carousel
  const shareCards = [
    { id: 'transparent', tab: 'Simple', component: TransparentShareCard },
    //   { id: 'focus', tab: 'Focus', component: FocusShareCard },
  ];

  // Handle card scroll
  const handleCardScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
    if (index !== activeCardIndex && index >= 0 && index < shareCards.length) {
      setActiveCardIndex(index);
    }
  }, [activeCardIndex, CARD_WIDTH, CARD_SPACING, shareCards.length]);

  // Render share card item
  const renderShareCard = ({ item, index }: { item: typeof shareCards[0]; index: number }) => {
    const CardComponent = item.component;
    const isActive = index === activeCardIndex;
    return (
      <View style={{
        marginHorizontal: CARD_SPACING / 2,
      }}>
        <ViewShot
          ref={isActive ? viewShotRef : undefined}
          options={{ format: "png", quality: 1.0 }}
        >
          <CardComponent isActive={isActive} index={index} />
        </ViewShot>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* Step 1: Stats */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            {/* Confetti particles - subtle background ambiance */}
            <View style={styles.confettiContainer} pointerEvents="none">
              {confettiParticles.map((particle, index) => (
                <ConfettiParticle
                  key={index}
                  delay={particle.delay}
                  startX={particle.startX}
                  color={particle.color}
                />
              ))}
            </View>

            <View style={[styles.contentCenter, { paddingHorizontal: 24 }]}>

              {/* Main Success Visual */}
              <Animated.View
                entering={ZoomIn.duration(600).springify()}
                style={[styles.successRingContainer, { borderColor: isDarkMode ? '#333' : '#eee' }]}
              >
                <LinearGradient
                  colors={[selectedPalette.primary, isDarkMode ? '#1a1c1e' : '#ffffff']}
                  style={styles.successRingGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="trophy" size={54} color="white" style={{ marginLeft: 2 }} />
                </LinearGradient>
              </Animated.View>

              <Animated.Text
                entering={FadeInDown.delay(300).duration(600)}
                style={[styles.title, { color: colors.text, marginTop: 32, fontSize: 28, letterSpacing: 0.5 }]}
              >
                WORKOUT COMPLETE
              </Animated.Text>

              <Animated.Text
                entering={FadeInDown.delay(400).duration(600)}
                style={[styles.subtitle, { color: colors.textSecondary, marginTop: 8 }]}
              >
                You crushed it!
              </Animated.Text>

              {/* Enhanced Stats Row */}
              <Animated.View
                entering={FadeInDown.delay(500).duration(700)}
                style={[styles.newStatsContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
              >
                <View style={styles.newStatItem}>
                  <View style={[styles.statIconBadge, { backgroundColor: isDarkMode ? '#333' : '#e0e0e0' }]}>
                    <Ionicons name="barbell" size={16} color={colors.primary} />
                  </View>
                  <AnimatedCounter value={totalExercises} style={[styles.newStatValue, { color: colors.text }]} />
                  <Text style={[styles.newStatLabel, { color: colors.textSecondary }]}>Exercises</Text>
                </View>

                {/* Vertical Divider */}
                <View style={{ width: 1, height: '60%', backgroundColor: colors.border }} />

                <View style={styles.newStatItem}>
                  <View style={[styles.statIconBadge, { backgroundColor: isDarkMode ? '#333' : '#e0e0e0' }]}>
                    <Ionicons name="flame" size={16} color="#FF6B6B" />
                  </View>
                  <AnimatedCounter value={caloriesBurned} style={[styles.newStatValue, { color: colors.text }]} />
                  <Text style={[styles.newStatLabel, { color: colors.textSecondary }]}>Calories</Text>
                </View>

                {/* Vertical Divider */}
                <View style={{ width: 1, height: '60%', backgroundColor: colors.border }} />

                <View style={styles.newStatItem}>
                  <View style={[styles.statIconBadge, { backgroundColor: isDarkMode ? '#333' : '#e0e0e0' }]}>
                    <Ionicons name="time" size={16} color="#4ECDC4" />
                  </View>
                  <Text style={[styles.newStatValue, { color: colors.text }]}>{Math.floor(totalDuration / 60)}<Text style={{ fontSize: 16 }}>m</Text></Text>
                  {/* Simplify Time for animated counter complexity - or just show raw string if not animating time strictly */}
                  <Text style={[styles.newStatLabel, { color: colors.textSecondary }]}>Duration</Text>
                </View>
              </Animated.View>

              {/* Premium Quote Card */}
              <Animated.View
                entering={FadeInDown.delay(700).duration(700)}
                style={[styles.newQuoteContainer, { borderColor: colors.border }]}
              >
                <View style={{ position: 'absolute', top: 12, left: 16, opacity: 0.1 }}>
                  <Ionicons name="chatbubble-ellipses-outline" size={32} color={colors.text} />
                </View>
                <Text style={[styles.newQuoteText, { color: colors.text }]}>
                  "{quote}"
                </Text>
              </Animated.View>

            </View>

            <View style={styles.bottomContainer}>
              <Animated.View
                entering={FadeInDown.delay(900).duration(600)}
                style={{ width: '100%' }}
              >
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    if (hadWorkoutTodayBefore) {
                      setStep(3);
                    } else {
                      setStep(2);
                    }
                  }}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        )}

        {/* Step 2: Streak */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            {/* Confetti particles */}
            <View style={styles.confettiContainer} pointerEvents="none">
              {confettiParticles.map((particle, index) => (
                <ConfettiParticle
                  key={index}
                  delay={particle.delay}
                  startX={particle.startX}
                  color={particle.color}
                />
              ))}
            </View>

            <View style={styles.contentCenter}>
              {/* Grid background with fade - slightly reduced opacity for clean look */}
              <View style={[styles.gridWrapper, { opacity: 0.4 }]}>
                <GridBackground isDarkMode={isDarkMode} />
              </View>

              {/* Pulsing Hexagon with fire */}
              <View style={{ marginBottom: 40, marginTop: -20 }}>
                <PulsingView>
                  <HexagonContainer size={200} isDarkMode={isDarkMode}>
                    <Ionicons name="flame" size={90} color="#FF6B6B" />
                  </HexagonContainer>
                </PulsingView>
              </View>

              {/* Big Streak Title */}
              <Animated.Text
                entering={FadeInDown.delay(200).duration(600)}
                style={[styles.streakBigTitle, { color: colors.text }]}
              >
                {streak} Day Streak!
              </Animated.Text>

              <Animated.Text
                entering={FadeInDown.delay(300).duration(600)}
                style={[styles.subtitle, { color: colors.textSecondary, marginTop: 8, fontSize: 18 }]}
              >
                {getStreakMessage(streak)}
              </Animated.Text>

              {/* Cleaner Week View */}
              <Animated.View
                entering={FadeInDown.delay(500).duration(700)}
                style={styles.newWeekContainer}
              >
                {weekDates.map((item, i) => {
                  const isActive = item.isToday || (streak > 0 && i >= weekDates.length - streak - (7 - weekDates.length));
                  // Fix logic: logic was checking "daysFromToday < streak".
                  // Let's use simple logic: if i is close to todayIndex.
                  const todayIndex = weekDates.findIndex(d => d.isToday);
                  // Streak logic: "streak" includes today. So previous (streak-1) days are active.
                  const isStreakDay = i <= todayIndex && i > (todayIndex - streak);

                  // Use the provided isPast/isToday for simplicity combined with streak count
                  const isLit = isStreakDay || (item.isToday && streak > 0);

                  return (
                    <View key={i} style={styles.dayColumn}>
                      <Text style={[styles.dayLabel, { color: colors.textSecondary, fontSize: 13, marginBottom: 8 }]}>
                        {item.day}
                      </Text>
                      {isLit ? (
                        <View style={styles.newDayBubbleLit}>
                          <Ionicons name="flame" size={20} color="white" />
                        </View>
                      ) : (
                        <View style={[styles.newDayBubble, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                          <Text style={[styles.dayDateText, { color: colors.textSecondary, opacity: 0.7 }]}>
                            {item.date}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </Animated.View>
            </View>

            <View style={styles.bottomContainer}>
              <Animated.View entering={FadeInDown.delay(700).duration(600)} style={{ width: '100%' }}>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={() => setStep(3)}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        )}

        {/* Step 3: Share */}
        {step === 3 && (
          <Animated.View entering={FadeIn} style={styles.stepContainer}>
            <View style={[styles.contentCenter, { justifyContent: 'flex-start', paddingTop: 16 }]}>
              <Text style={[styles.title, { color: colors.text, fontSize: 32, marginBottom: -8, lineHeight: 40 }]}>You Just</Text>
              <Text style={[styles.title, { color: colors.primary, fontSize: 32, marginBottom: 4 }]}>chose yourself</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: 32, fontSize: 16 }]}>Share your Achievement</Text>

              {/* Single Share Card */}
              <FlatList
                ref={cardListRef}
                data={shareCards}
                renderItem={renderShareCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                // Snap logic for centering
                snapToInterval={CARD_WIDTH + CARD_SPACING}
                decelerationRate="fast"
                pagingEnabled={false} // Custom snap interval

                // Padding to center the first item initially
                contentContainerStyle={{
                  paddingHorizontal: INSET_X - (CARD_SPACING / 2),
                  paddingVertical: 30 // Margin for shadows
                }}

                onScroll={handleCardScroll}
                scrollEventThrottle={16}
                getItemLayout={(data, index) => ({
                  length: CARD_WIDTH + CARD_SPACING,
                  offset: (CARD_WIDTH + CARD_SPACING) * index,
                  index,
                })}
              />



            </View>

            <View style={[styles.bottomContainer, { paddingTop: 12, paddingBottom: 24 }]}>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary, marginBottom: 12 }]} onPress={handleShare}>
                <Text style={styles.primaryButtonText}>Share my win</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleFinish} style={{ padding: 8 }} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                ) : (
                  <Text style={[styles.secondaryButtonText, { color: colors.textSecondary, textDecorationLine: 'underline' }]}>Continue without sharing</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stepContainer: { flex: 1, justifyContent: 'space-between' },
  contentCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bottomContainer: { padding: 24, paddingBottom: 40, width: '100%', alignItems: 'center' },

  // Text
  title: { fontSize: 24, fontFamily: 'Outfit-Bold', textAlign: 'center' },
  subtitle: { fontSize: 16, fontFamily: 'Outfit-Regular', textAlign: 'center' },

  // Use generic nice design
  iconCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#4CAF50',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#4CAF50', shadowOpacity: 0.4, shadowRadius: 10, elevation: 10
  },

  // Stats Grid
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around', width: '100%',
    marginTop: 32, paddingVertical: 24, borderTopWidth: 1, borderBottomWidth: 1
  },
  statCol: { alignItems: 'center' },
  statVal: { fontSize: 24, fontFamily: 'Outfit-Bold', marginBottom: 4 },
  statLbl: { fontSize: 14, fontFamily: 'Outfit-Medium' },

  // Quote
  quoteContainer: {
    marginTop: 32, padding: 24, backgroundColor: 'rgba(150,150,150,0.1)',
    borderRadius: 16, alignItems: 'center', width: '100%'
  },
  quoteText: {
    fontFamily: 'Outfit-Medium', fontStyle: 'italic', fontSize: 16, textAlign: 'center', marginTop: 8
  },

  // Week Streak - New Design
  weekDatesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
    paddingHorizontal: 16
  },
  dayColumn: {
    alignItems: 'center',
    gap: 8
  },
  dayLabel: {
    fontFamily: 'Outfit-Medium',
    fontSize: 12,
    textTransform: 'capitalize'
  },
  dayDateBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  dayDateText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 14
  },

  // Streak title
  streakTitle: {
    fontSize: 32,
    fontFamily: 'Outfit-Bold',
    textAlign: 'center'
  },

  // Confetti
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 1
  },

  // Grid
  gridContainer: {
    position: 'absolute',
    width: 300,
    height: 300,
    overflow: 'hidden'
  },
  gridWrapper: {
    position: 'absolute',
    top: '15%',
    alignItems: 'center',
    justifyContent: 'center',
    width: 300,
    height: 300,
    opacity: 0.6
  },

  // Legacy week styles (keep for compatibility)
  weekContainer: { flexDirection: 'row', gap: 12, marginTop: 40 },
  dayBubble: {
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center'
  },
  dayText: { fontFamily: 'Outfit-Bold', fontSize: 14 },

  // Buttons
  primaryButton: {
    width: '100%', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5
  },
  primaryButtonText: { color: 'white', fontSize: 18, fontFamily: 'Outfit-Bold' },
  secondaryButtonText: { fontSize: 16, fontFamily: 'Outfit-Medium' },

  // Transparent Style Card
  transparentCardContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 15,
  },
  transparentCardInner: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 28,
  },
  transparentCardContent: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    paddingTop: '18%', // Top Safe Zone
    paddingBottom: '22%', // Bottom Safe Zone
    justifyContent: 'center',
    alignItems: 'center',
  },
  transparentStatGroup: {
    alignItems: 'center',
    marginVertical: 12,
  },
  transparentStatLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: -4,
  },
  transparentStatValue: {
    fontSize: 28,
    fontFamily: 'Outfit-Bold',
    color: 'white',
    marginTop: 0,
  },
  transparentWorkoutName: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 6,
  },
  transparentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 8,
    marginBottom: 8,
  },
  transparentBrand: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: 'white',
    letterSpacing: 3,
  },

  // Quote card styles
  quoteCardText: {
    fontSize: 17,
    fontFamily: 'Outfit-Medium',
    fontStyle: 'italic',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
  },
  quickStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  quickStat: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  quickStatDot: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },

  // Clean Brand Pill used in Transparent card
  cleanBrandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cleanBrandText: {
    color: 'white',
    fontFamily: 'Outfit-Bold',
    fontSize: 12,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  // New Styles for Redesign
  successRingContainer: {
    width: 120, height: 120, borderRadius: 60,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderStyle: 'dashed',
    marginBottom: 0,
  },
  successRingGradient: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 15, elevation: 12
  },
  newStatsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginTop: 40,
    /* Subtle border or shadow can be added */
  },
  newStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconBadge: {
    width: 32, height: 32, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  newStatValue: {
    fontSize: 28,
    fontFamily: 'Outfit-Bold',
    marginBottom: 4,
  },
  newStatLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    letterSpacing: 0.5,
  },

  newQuoteContainer: {
    marginTop: 32,
    padding: 24,
    paddingTop: 32,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)', // Fallback
  },
  newQuoteText: {
    fontFamily: 'Outfit-Medium',
    fontStyle: 'italic',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.9,
  },

  primaryButton: {
    width: '100%', height: 58, borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5
  },
  streakBigTitle: {
    fontSize: 42,
    marginTop: 24,
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
    letterSpacing: -1,
  },
  newWeekContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 48,
    width: '100%',
    paddingHorizontal: 8,
  },
  newDayBubble: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
  },
  newDayBubbleLit: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FF6B6B',
    shadowColor: "#FF6B6B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8
  },
});
