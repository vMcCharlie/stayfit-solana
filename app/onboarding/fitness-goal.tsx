import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
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

type FitnessGoal =
  | "build_muscle"
  | "lose_weight"
  | "improve_endurance"
  | "stay_active"
  | null;

export default function FitnessGoalScreen() {
  const { isDarkMode, selectedPalette } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal>(null);
  const [loading, setLoading] = useState(false);

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

  const handleBack = () => {
    router.back();
  };

  const handleNext = async () => {
    if (!selectedGoal) return;

    try {
      setLoading(true);
      // Save the selected goal to our onboarding data system
      await updateOnboardingStep("fitness-goal", {
        fitness_goal: selectedGoal,
      });
      router.push("/onboarding/workout-frequency");
    } catch (error) {
      console.error("Error saving fitness goal:", error);
    } finally {
      setLoading(false);
    }
  };

  const goals = [
    {
      id: "Build Muscle",
      title: "Build Muscle",
      icon: "barbell-outline",
      description: "Gain strength and muscle mass",
    },
    {
      id: "Lose Weight",
      title: "Lose Weight",
      icon: "trending-down-outline",
      description: "Burn fat and improve body composition",
    },
    {
      id: "Keep Fit",
      title: "Keep Fit",
      icon: "speedometer-outline",
      description: "Enhance stamina and cardiovascular health",
    },
    {
      id: "Get Stronger",
      title: "Get Stronger",
      icon: "pulse-outline",
      description: "Maintain a healthy and active lifestyle",
    },
  ];

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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About You</Text>

          {/* Segmented Progress Bar */}
          <View style={styles.progressSegments}>
            <View style={[styles.segment, styles.segmentSmall, { backgroundColor: selectedPalette.primary }]} />
            <View style={[styles.segment, styles.segmentLarge, { backgroundColor: selectedPalette.primary, opacity: 0.5 }]} />
            <View style={[styles.segment, styles.segmentMedium, { backgroundColor: colors.surfaceSecondary }]} />
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
              What's your main goal?
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We'll customize your program based on your fitness goal
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(300)}
            style={styles.cardsContainer}
          >
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  { backgroundColor: colors.surface },
                  selectedGoal === goal.id && {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: selectedPalette.primary,
                  },
                ]}
                onPress={() => setSelectedGoal(goal.id as FitnessGoal)}
                disabled={loading}
              >
                <View
                  style={[
                    styles.goalIconContainer,
                    { backgroundColor: colors.surfaceSecondary },
                    selectedGoal === goal.id && {
                      backgroundColor: selectedPalette.primary,
                    },
                  ]}
                >
                  <Ionicons
                    name={goal.icon as any}
                    size={24}
                    color={
                      selectedGoal === goal.id
                        ? "#FFFFFF"
                        : selectedPalette.primary
                    }
                  />
                </View>
                <View style={styles.goalTextContainer}>
                  <Text style={[styles.goalTitle, { color: colors.text }]}>
                    {goal.title}
                  </Text>
                  <Text
                    style={[
                      styles.goalDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {goal.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
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
              (!selectedGoal || loading) && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!selectedGoal || loading}
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
  cardsContainer: {
    width: "100%",
    marginBottom: 32,
  },
  goalCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  goalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
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
