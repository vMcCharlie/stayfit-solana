import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme, ColorPalette } from "../../src/context/theme";
import {
  updateOnboardingStep,
  completeOnboarding,
} from "../../src/lib/onboarding";

const { width } = Dimensions.get("window");
const PALETTE_SIZE = (width - 48 - 16) / 2; // 2 columns with padding

export const COLOR_PALETTES: ColorPalette[] = [
  {
    name: "Forest Fresh",
    description: "Energetic green for nature lovers",
    primary: "#4CAF50",
    dark: {
      background: "#1A1C1E",
      surface: "#2F3133",
      text: "#FFFFFF",
    },
    light: {
      background: "#FFFFFF",
      surface: "#F5F5F5",
      text: "#000000",
    },
  },
  {
    name: "Ocean Breeze",
    description: "Calming blue for serenity",
    primary: "#0288D1",
    dark: {
      background: "#1A1D1E",
      surface: "#2D3235",
      text: "#FFFFFF",
    },
    light: {
      background: "#FFFFFF",
      surface: "#F5F7F8",
      text: "#000000",
    },
  },
  {
    name: "Sunset Glow",
    description: "Warm orange for motivation",
    primary: "#FF5722",
    dark: {
      background: "#1E1C1A",
      surface: "#332F2D",
      text: "#FFFFFF",
    },
    light: {
      background: "#FFFFFF",
      surface: "#FFF7F5",
      text: "#000000",
    },
  },
  {
    name: "Royal Purple",
    description: "Rich purple for luxury",
    primary: "#673AB7",
    dark: {
      background: "#1C1A1E",
      surface: "#2D2A33",
      text: "#FFFFFF",
    },
    light: {
      background: "#FFFFFF",
      surface: "#F7F5FF",
      text: "#000000",
    },
  },
  {
    name: "Ruby Red",
    description: "Bold red for passion",
    primary: "#E53935",
    dark: {
      background: "#1E1A1A",
      surface: "#332D2D",
      text: "#FFFFFF",
    },
    light: {
      background: "#FFFFFF",
      surface: "#FFF5F5",
      text: "#000000",
    },
  },
  {
    name: "Golden Sun",
    description: "Bright yellow for energy",
    primary: "#FFC107",
    dark: {
      background: "#1E1D1A",
      surface: "#33312D",
      text: "#FFFFFF",
    },
    light: {
      background: "#FFFFFF",
      surface: "#FFFDF5",
      text: "#000000",
    },
  },
  {
    name: "Mint Fresh",
    description: "Cool mint for freshness",
    primary: "#26A69A",
    dark: {
      background: "#1A1E1D",
      surface: "#2D3332",
      text: "#FFFFFF",
    },
    light: {
      background: "#FFFFFF",
      surface: "#F5FFFD",
      text: "#000000",
    },
  },
  {
    name: "Berry Blast",
    description: "Deep pink for vibrancy",
    primary: "#E91E63",
    dark: {
      background: "#1E1A1C",
      surface: "#332D30",
      text: "#FFFFFF",
    },
    light: {
      background: "#FFFFFF",
      surface: "#FFF5F8",
      text: "#000000",
    },
  },
  {
    name: "Slate Blue",
    description: "Professional blue for focus",
    primary: "#3F51B5",
    dark: {
      background: "#1A1B1E",
      surface: "#2D2E33",
      text: "#FFFFFF",
    },
    light: {
      background: "#FFFFFF",
      surface: "#F5F6FF",
      text: "#000000",
    },
  },
  {
    name: "Emerald",
    description: "Deep green for growth",
    primary: "#2E7D32",
    dark: {
      background: "#1A1E1B",
      surface: "#2D332E",
      text: "#FFFFFF",
    },
    light: {
      background: "#FFFFFF",
      surface: "#F5FFF6",
      text: "#000000",
    },
  },
  {
    name: "Coral Reef",
    description: "Vibrant coral for energy",
    primary: "#FF7043",
    dark: {
      background: "#1E1B1A",
      surface: "#332E2D",
      text: "#FFFFFF",
    },
    light: {
      background: "#FFFFFF",
      surface: "#FFF6F5",
      text: "#000000",
    },
  },
  {
    name: "Deep Ocean",
    description: "Dark blue for calmness",
    primary: "#1976D2",
    dark: {
      background: "#1A1C1E",
      surface: "#2D2F33",
      text: "#FFFFFF",
    },
    light: {
      background: "#FFFFFF",
      surface: "#F5F8FF",
      text: "#000000",
    },
  },
];

export default function PersonalizeScreen() {
  const { isDarkMode, toggleTheme, selectedPalette, setSelectedPalette } =
    useTheme();
  const insets = useSafeAreaInsets();
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
    try {
      setLoading(true);
      Haptics.selectionAsync();

      // Save theme preferences
      await updateOnboardingStep("personalize", {
        theme: isDarkMode ? "dark" : "light",
        theme_color: selectedPalette.primary,
      });

      // Mark onboarding as complete
      await completeOnboarding();

      // Navigate to the tab system directly as onboarding is now complete
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={styles.content}>
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.topSection}
        >
          {/* Section Title */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Personalization
          </Text>

          {/* Segmented Progress Bar - Step 9/9 */}
          <View style={styles.progressSegments}>
            {/* Previous steps filled */}
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={[styles.segment, styles.segmentSmall, { backgroundColor: selectedPalette.primary }]}
              />
            ))}
            {/* Current step */}
            <View style={[styles.segment, styles.segmentLarge, { backgroundColor: selectedPalette.primary }]} />
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <Animated.View
            entering={FadeInDown.duration(400).delay(150)}
            style={styles.titleContainer}
          >
            <Text style={[styles.title, { color: colors.text }]}>
              Personalize your experience
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Choose your preferred color theme and mode
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(300)}
            style={styles.themeToggleContainer}
          >
            <TouchableOpacity
              style={[
                styles.themeButton,
                {
                  backgroundColor: isDarkMode ? colors.surface : "#FFFFFF",
                  borderColor: !isDarkMode ? selectedPalette.primary : "transparent"
                },
                isDarkMode && { borderWidth: 0 }
              ]}
              onPress={() => !isDarkMode ? null : toggleTheme()}
              activeOpacity={0.7}
            >
              <Ionicons
                name="sunny"
                size={24}
                color={!isDarkMode ? selectedPalette.primary : "#666"}
              />
              <Text
                style={[
                  styles.themeButtonText,
                  { color: !isDarkMode ? selectedPalette.primary : "#666" }
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeButton,
                {
                  backgroundColor: isDarkMode ? colors.surface : "#F5F5F5",
                  borderColor: isDarkMode ? selectedPalette.primary : "transparent",
                  borderWidth: isDarkMode ? 2 : 0
                },
              ]}
              onPress={() => isDarkMode ? null : toggleTheme()}
              activeOpacity={0.7}
            >
              <Ionicons
                name="moon"
                size={24}
                color={isDarkMode ? selectedPalette.primary : "#666"}
              />
              <Text
                style={[
                  styles.themeButtonText,
                  { color: isDarkMode ? selectedPalette.primary : "#666" }
                ]}
              >
                Dark
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(450)}
            style={styles.palettesContainer}
          >
            <Text style={[styles.sectionHeaderTitle, { color: colors.text }]}>
              Color Palettes
            </Text>
            <View style={styles.palettesGrid}>
              {COLOR_PALETTES.map((palette) => (
                <TouchableOpacity
                  key={palette.name}
                  style={[
                    styles.paletteCard,
                    { backgroundColor: colors.surface },
                    selectedPalette.name === palette.name && {
                      borderColor: palette.primary,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedPalette(palette)}
                >
                  <View
                    style={[
                      styles.paletteColor,
                      { backgroundColor: palette.primary },
                    ]}
                  />
                  <Text
                    style={[
                      styles.paletteName,
                      { color: colors.text },
                      selectedPalette.name === palette.name && {
                        color: palette.primary,
                      },
                    ]}
                  >
                    {palette.name}
                  </Text>
                  <Text
                    style={[
                      styles.paletteDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {palette.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </ScrollView>

        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: insets.bottom > 0 ? insets.bottom : 24,
              backgroundColor: colors.background // Ensure background matches
            },
          ]}
        >
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
              <Text style={styles.nextButtonText}>Get Started</Text>
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
    paddingBottom: 0, // Handle bottom padding in bottomBar
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
    gap: 4, // Tighter gap for many segments
    marginBottom: 24,
  },
  segment: {
    height: 4,
    borderRadius: 2,
  },
  segmentSmall: {
    flex: 1,
  },
  segmentLarge: {
    flex: 2, // Highlight current step slightly more
  },
  scrollView: {
    flex: 1,
    marginHorizontal: -24,
  },
  scrollViewContent: {
    paddingHorizontal: 24,
    paddingBottom: 120, // Space for bottom bar
  },
  titleContainer: {
    marginTop: 10,
    marginBottom: 32,
    alignItems: "center", // Center alignment
  },
  title: {
    fontSize: 28, // Consistent size
    fontFamily: "Outfit-Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  themeToggleContainer: {
    flexDirection: "row",
    marginBottom: 32,
    gap: 12,
  },
  themeButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  themeButtonText: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
  palettesContainer: {
    flex: 1,
  },
  sectionHeaderTitle: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    marginBottom: 16,
  },
  palettesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  paletteCard: {
    width: PALETTE_SIZE,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  paletteColor: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 12,
  },
  paletteName: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    marginBottom: 4,
  },
  paletteDescription: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
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
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },
  nextButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
});
