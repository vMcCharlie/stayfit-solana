import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
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

type FitnessLevel = "beginner" | "intermediate" | "advanced" | null;

export default function FitnessLevelScreen() {
  const { isDarkMode, selectedPalette } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedLevel, setSelectedLevel] = useState<FitnessLevel>(null);
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
    if (!selectedLevel) return;

    try {
      setLoading(true);
      await updateOnboardingStep("fitness-level", {
        fitness_level: selectedLevel,
      });
      router.push("/onboarding/equipment-access");
    } catch (error) {
      console.error("Error saving fitness level:", error);
    } finally {
      setLoading(false);
    }
  };

  const levels = [
    {
      id: "Beginner",
      title: "Beginner",
      description: "Never/rarely worked out before",
      icon: "leaf-outline",
    },
    {
      id: "Intermediate",
      title: "Intermediate",
      description: "1-3 years of training experience",
      icon: "flame-outline",
    },
    {
      id: "Advanced",
      title: "Advanced",
      description: "Consistent for 3+ years",
      icon: "flash-outline",
    },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
        {/* Section Title */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Goals</Text>

        {/* Segmented Progress Bar */}
        <View style={styles.progressSegments}>
          <View style={[styles.segment, styles.segmentSmall, { backgroundColor: selectedPalette.primary }]} />
          <View style={[styles.segment, styles.segmentLarge, { backgroundColor: selectedPalette.primary }]} />
          <View style={[styles.segment, styles.segmentMedium, { backgroundColor: selectedPalette.primary, opacity: 0.6 }]} />
          <View style={[styles.segment, styles.segmentMedium, { backgroundColor: colors.surfaceSecondary }]} />
          <View style={[styles.segment, styles.segmentSmall, { backgroundColor: colors.surfaceSecondary }]} />
        </View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(150)}
          style={styles.header}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Your fitness level
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Help us tailor workouts to your experience
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.levelsContainer}
        >
          {levels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.levelCard,
                { backgroundColor: colors.surface },
                selectedLevel === level.id && {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: selectedPalette.primary,
                },
              ]}
              onPress={() => setSelectedLevel(level.id as FitnessLevel)}
              activeOpacity={0.8}
              disabled={loading}
            >
              <View style={styles.levelHeader}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: colors.surfaceSecondary },
                    selectedLevel === level.id && {
                      backgroundColor: selectedPalette.primary,
                    },
                  ]}
                >
                  <Ionicons
                    name={level.icon as any}
                    size={24}
                    color={
                      selectedLevel === level.id
                        ? "#FFFFFF"
                        : selectedPalette.primary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.levelTitle,
                    { color: colors.text },
                    selectedLevel === level.id && {
                      color: selectedPalette.primary,
                    },
                  ]}
                >
                  {level.title}
                </Text>
              </View>
              <Text
                style={[
                  styles.levelDescription,
                  { color: colors.textSecondary },
                  selectedLevel === level.id && {
                    color: selectedPalette.primary,
                  },
                ]}
              >
                {level.description}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
        {/* Bottom Bar */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity
            style={[styles.backButtonCircle, { backgroundColor: colors.surfaceSecondary }]}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: selectedPalette.primary },
              (!selectedLevel || loading) && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!selectedLevel || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.nextButtonText}>Next</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
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
  levelsContainer: {
    width: "100%",
    marginBottom: 32,
  },
  levelCard: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  levelTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
  },
  levelDescription: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    gap: 16,
  },
  backButtonCircle: {
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
