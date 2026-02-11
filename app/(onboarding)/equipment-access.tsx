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

type EquipmentAccess = "home" | "gym" | null;

export default function EquipmentAccessScreen() {
  const { isDarkMode, selectedPalette } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedAccess, setSelectedAccess] = useState<EquipmentAccess>(null);
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
    if (!selectedAccess) return;

    try {
      setLoading(true);
      await updateOnboardingStep("equipment-access", {
        equipment_access: selectedAccess,
      });
      router.push("/onboarding/body-metrics");
    } catch (error) {
      console.error("Error saving equipment access:", error);
    } finally {
      setLoading(false);
    }
  };

  const equipmentOptions = [
    {
      id: "Home",
      title: "Home Workouts Only",
      description: "Bodyweight exercises with minimal equipment",
      icon: "body-outline",
    },
    {
      id: "Gym",
      title: "Full Gym Access",
      description: "Commercial gym with comprehensive equipment",
      icon: "barbell-outline",
    },
  ];

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={[styles.content, { backgroundColor: colors.background }]}>
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
            <View style={[styles.segment, styles.segmentMedium, { backgroundColor: selectedPalette.primary, opacity: 0.8 }]} />
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
              Equipment access
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              What equipment do you have available?
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(300)}
            style={styles.optionsContainer}
          >
            {equipmentOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: colors.surface },
                  selectedAccess === option.id && {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: selectedPalette.primary,
                  },
                ]}
                onPress={() => setSelectedAccess(option.id as EquipmentAccess)}
                activeOpacity={0.8}
                disabled={loading}
              >
                <View style={styles.optionHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: colors.surfaceSecondary },
                      selectedAccess === option.id && {
                        backgroundColor: selectedPalette.primary,
                      },
                    ]}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={
                        selectedAccess === option.id
                          ? "#FFFFFF"
                          : selectedPalette.primary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.optionTitle,
                      { color: colors.text },
                      selectedAccess === option.id && {
                        color: selectedPalette.primary,
                      },
                    ]}
                  >
                    {option.title}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.optionDescription,
                    { color: colors.textSecondary },
                    selectedAccess === option.id && {
                      color: selectedPalette.primary,
                    },
                  ]}
                >
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </ScrollView>

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
              (!selectedAccess || loading) && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!selectedAccess || loading}
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
  optionsContainer: {
    width: "100%",
    marginBottom: 32,
  },
  optionCard: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  optionHeader: {
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
  optionTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
  },
  optionDescription: {
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
