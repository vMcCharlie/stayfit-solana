import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { updateOnboardingStep } from "../../src/lib/onboarding";
import { useTheme, ColorPalette } from "../../src/context/theme";
import * as Haptics from "expo-haptics";
import { COLOR_PALETTES } from "../onboarding/personalize";

const { width, height } = Dimensions.get("window");

type GenderOption = "Male" | "Female" | "Other" | null;

export default function GenderSelectionScreen() {
  const { isDarkMode, selectedPalette, setSelectedPalette } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedGender, setSelectedGender] = useState<GenderOption>(null);
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

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.replace("/intro");
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  const handleBack = () => {
    Haptics.selectionAsync();
    router.replace("/intro");
  };

  const handleGenderSelect = (gender: GenderOption) => {
    Haptics.selectionAsync();
    setSelectedGender(gender);

    // Find the appropriate theme palette based on gender
    let newPalette;
    if (gender === "Male") {
      newPalette = COLOR_PALETTES.find(
        (p: ColorPalette) => p.name === "Slate Blue"
      );
    } else if (gender === "Female") {
      newPalette = COLOR_PALETTES.find(
        (p: ColorPalette) => p.name === "Berry Blast"
      );
    } else if (gender === "Other") {
      newPalette = COLOR_PALETTES.find(
        (p: ColorPalette) => p.name === "Mint Fresh"
      );
    }

    // Update the theme if we found a matching palette
    if (newPalette) {
      setSelectedPalette(newPalette);
    }
  };

  const handleNext = async () => {
    if (!selectedGender) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLoading(true);
      await updateOnboardingStep("gender-selection", {
        gender: selectedGender,
      });
      router.push("/onboarding/fitness-goal");
    } catch (error) {
      console.error("Error saving gender selection:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={styles.content}>
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.topSection}
        >
          {/* Section Title */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About You</Text>

          {/* Segmented Progress Bar */}
          <View style={styles.progressSegments}>
            <View style={[styles.segment, styles.segmentSmall, styles.segmentActive, { backgroundColor: selectedPalette.primary }]} />
            <View style={[styles.segment, styles.segmentLarge, { backgroundColor: colors.surfaceSecondary }]} />
            <View style={[styles.segment, styles.segmentMedium, { backgroundColor: colors.surfaceSecondary }]} />
            <View style={[styles.segment, styles.segmentMedium, { backgroundColor: colors.surfaceSecondary }]} />
            <View style={[styles.segment, styles.segmentSmall, { backgroundColor: colors.surfaceSecondary }]} />
          </View>
        </Animated.View>

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
              Tell us about yourself
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We'll personalize your experience based on your information
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(300)}
            style={styles.optionsContainer}
          >
            {["Male", "Female", "Other"].map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.optionButton,
                  { backgroundColor: colors.surfaceSecondary },
                  selectedGender === gender && [
                    styles.selectedOption,
                    {
                      backgroundColor: `${selectedPalette.primary}20`,
                      borderColor: selectedPalette.primary,
                    },
                  ],
                ]}
                onPress={() => handleGenderSelect(gender as GenderOption)}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: colors.surface },
                    selectedGender === gender && {
                      backgroundColor: selectedPalette.primary,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      gender === "male"
                        ? "male"
                        : gender === "female"
                          ? "female"
                          : "person"
                    }
                    size={24}
                    color={
                      selectedGender === gender
                        ? "#FFFFFF"
                        : selectedPalette.primary
                    }
                  />
                </View>
                <Text style={[styles.optionText, { color: colors.text }]}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </ScrollView>

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
              (!selectedGender || loading) && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!selectedGender || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
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
  },
  topSection: {
    marginTop: Platform.OS === "ios" ? 40 : 20,
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
    marginHorizontal: -24, // pulling back to allow full width scrolling if needed, but wait
  },
  scrollViewContent: {
    paddingHorizontal: 24, // matching container padding
    paddingBottom: 24,
  },
  header: {
    marginTop: 10,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: "Outfit-Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedOption: {
    borderWidth: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
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
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Outfit-Bold",
  },
});
