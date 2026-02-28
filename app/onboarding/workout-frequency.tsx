import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { updateOnboardingStep } from "../../src/lib/onboarding";
import { useTheme } from "../../src/context/theme";

const { width, height } = Dimensions.get("window");
const ITEM_WIDTH = 90; // Small square card width
const ITEM_SPACING = 16;
const ITEM_FULL_WIDTH = ITEM_WIDTH + ITEM_SPACING;
const LEFT_SHIFT = 30; // Amount to shift the carousel left

export default function WorkoutFrequencyScreen() {
  const { isDarkMode, selectedPalette } = useTheme();
  const insets = useSafeAreaInsets();
  const [frequency, setFrequency] = useState<number>(4); // Default to 4 days
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const frequencyOptions = [1, 2, 3, 4, 5, 6, 7];
  const [contentOffsetX, setContentOffsetX] = useState(0);

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
    surfaceSecondary: isDarkMode
      ? `${selectedPalette.primary}15` // 15 is hex for 8% opacity
      : `${selectedPalette.primary}10`, // 10 is hex for 6% opacity
  };

  // Get motivational message based on selected days
  const getMotivationalMessage = (days: number) => {
    switch (days) {
      case 1:
        return "Perfect for beginners or busy schedules. Quality over quantity!";
      case 2:
        return "Great for recovery-focused or split training programs.";
      case 3:
        return "Balanced approach with good recovery between workouts.";
      case 4:
        return "Ideal balance of consistency and recovery for most people.";
      case 5:
        return "Great for dedicated fitness enthusiasts with specific goals.";
      case 6:
        return "Advanced training frequency for significant results.";
      case 7:
        return "Maximum commitment! Consider including lighter recovery days.";
      default:
        return "";
    }
  };

  // Calculate position for scrolling
  const getCenterPosition = (index: number) => {
    return index * ITEM_FULL_WIDTH;
  };

  // Scroll to position the selected item at the center
  const scrollToSelectedItem = (index: number, animated = true) => {
    if (scrollViewRef.current) {
      const position = getCenterPosition(index);
      scrollViewRef.current.scrollTo({
        x: position,
        animated: animated,
      });
    }
  };

  // Handle frequency selection
  const handleFrequencySelect = (days: number) => {
    setFrequency(days);
    const index = frequencyOptions.findIndex((item) => item === days);
    if (index !== -1) {
      scrollToSelectedItem(index);
    }
  };

  // Position the default selection (4 days) on initial render
  useEffect(() => {
    const defaultIndex = frequencyOptions.findIndex((item) => item === 4);
    setTimeout(() => {
      scrollToSelectedItem(defaultIndex, true);
    }, 300); // Delay to allow component to render completely
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleNext = async () => {
    try {
      setLoading(true);
      // Save the selected frequency to our onboarding data system
      await updateOnboardingStep("workout-frequency", {
        workout_frequency: frequency,
      });
      router.push("/onboarding/fitness-level");
    } catch (error) {
      console.error("Error saving workout frequency:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (event: {
    nativeEvent: { contentOffset: { x: number } };
  }) => {
    setContentOffsetX(event.nativeEvent.contentOffset.x);
  };

  const handleMomentumScrollEnd = (event: {
    nativeEvent: { contentOffset: { x: number } };
  }) => {
    const x = event.nativeEvent.contentOffset.x;
    // Calculate the index based on the scroll position
    const centerIndex = Math.round(x / ITEM_FULL_WIDTH);

    if (centerIndex >= 0 && centerIndex < frequencyOptions.length) {
      handleFrequencySelect(frequencyOptions[centerIndex]);
    }
  };

  // Calculate padding to center the items in the viewport with left shift
  const centerOffset = width / 2 - ITEM_WIDTH / 2 - LEFT_SHIFT;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={styles.content}>
        {/* Progress Bar */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.topSection}
        >
          {/* Section Title */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Goals</Text>

          {/* Segmented Progress Bar */}
          <View style={styles.progressSegments}>
            <View style={[styles.segment, styles.segmentSmall, { backgroundColor: selectedPalette.primary }]} />
            <View style={[styles.segment, styles.segmentLarge, { backgroundColor: selectedPalette.primary }]} />
            <View style={[styles.segment, styles.segmentMedium, { backgroundColor: selectedPalette.primary, opacity: 0.4 }]} />
            <View style={[styles.segment, styles.segmentMedium, { backgroundColor: colors.surfaceSecondary }]} />
            <View style={[styles.segment, styles.segmentSmall, { backgroundColor: colors.surfaceSecondary }]} />
          </View>
        </Animated.View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <Animated.View
            entering={FadeInDown.duration(400).delay(150)}
            style={styles.header}
          >
            <Text style={[styles.title, { color: colors.text }]}>
              Weekly workout frequency
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              How many days per week do you plan to work out?
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(300)}
            style={styles.frequencyContainer}
          >
            {/* Carousel Container */}
            <View style={styles.carouselContainer}>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.carouselContent,
                  { paddingHorizontal: centerOffset },
                ]}
                decelerationRate="fast"
                snapToInterval={ITEM_FULL_WIDTH}
                snapToAlignment="center"
                scrollEventThrottle={16}
                onScroll={handleScroll}
                onMomentumScrollEnd={handleMomentumScrollEnd}
              >
                {frequencyOptions.map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.dayCard,
                      { backgroundColor: colors.surface },
                      frequency === days && {
                        backgroundColor: colors.surfaceSecondary,
                        borderColor: selectedPalette.primary,
                      },
                    ]}
                    onPress={() => handleFrequencySelect(days)}
                    activeOpacity={0.8}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        { color: colors.text },
                        frequency === days && {
                          color: selectedPalette.primary,
                        },
                      ]}
                    >
                      {days}
                    </Text>
                    <Text
                      style={[
                        styles.dayLabel,
                        { color: colors.textSecondary },
                        frequency === days && {
                          color: selectedPalette.primary,
                        },
                      ]}
                    >
                      {days === 1 ? "day" : "days"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Motivational Message */}
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={styles.messageContainer}
            >
              <Text
                style={[styles.messageText, { color: colors.textSecondary }]}
              >
                {getMotivationalMessage(frequency)}
              </Text>
            </Animated.View>
          </Animated.View>
        </ScrollView>

        {/* Bottom Bar */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surfaceSecondary }]}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: selectedPalette.primary },
              loading && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.nextButtonText}>Next</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    position: "relative",
  },
  topSection: {
    paddingTop: Platform.OS === "ios" ? 20 : 20,
    zIndex: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Outfit-SemiBold",
    textAlign: "center",
    marginBottom: 16,
  },
  progressSegments: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 24,
  },
  segment: {
    height: 4,
    borderRadius: 2,
  },
  segmentSmall: {
    flex: 0.5,
  },
  segmentMedium: {
    flex: 1.2,
  },
  segmentLarge: {
    flex: 2,
  },
  segmentActive: {
    opacity: 1,
  },
  scrollView: {
    flex: 1,
    marginHorizontal: -24,
  },
  scrollViewContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: "Outfit-Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    lineHeight: 24,
  },
  frequencyContainer: {
    width: "100%",
    marginBottom: 32,
  },
  carouselContainer: {
    marginBottom: 24,
    marginHorizontal: -24, // Allow carousel to span full width
  },
  carouselContent: {
    flexGrow: 0,
  },
  dayCard: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: ITEM_SPACING,
    borderWidth: 1,
    borderColor: "transparent",
  },
  dayNumber: {
    fontSize: 32,
    fontFamily: "Outfit-Bold",
    marginBottom: 4,
  },
  dayLabel: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
  },
  messageContainer: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  messageText: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    gap: 16,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Outfit-Bold",
  },
});
