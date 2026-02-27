import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/theme";
import Animated, { SlideInRight } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CONTAINER_PADDING = 16;
const GRID_GAP = 12;
const PALETTE_SIZE = (width - CONTAINER_PADDING * 2 - GRID_GAP) / 2;

interface ThemeModalProps {
  visible: boolean;
  onClose: () => void;
}

const COLOR_PALETTES = [
  {
    name: "Forest Fresh",
    description: "Energetic green for nature lovers",
    primary: "#4CAF50",
  },
  {
    name: "Ocean Breeze",
    description: "Calming blue for serenity",
    primary: "#0288D1",
  },
  {
    name: "Sunset Glow",
    description: "Warm orange for motivation",
    primary: "#FF5722",
  },
  {
    name: "Royal Purple",
    description: "Rich purple for luxury",
    primary: "#673AB7",
  },
  {
    name: "Ruby Red",
    description: "Bold red for passion",
    primary: "#E53935",
  },
  {
    name: "Golden Sun",
    description: "Bright yellow for energy",
    primary: "#FFC107",
  },
  {
    name: "Mint Fresh",
    description: "Cool mint for freshness",
    primary: "#26A69A",
  },
  {
    name: "Berry Blast",
    description: "Deep pink for vibrancy",
    primary: "#E91E63",
  },
  {
    name: "Slate Blue",
    description: "Professional blue for focus",
    primary: "#3F51B5",
  },
  {
    name: "Emerald",
    description: "Deep green for growth",
    primary: "#2E7D32",
  },
  {
    name: "Coral Reef",
    description: "Vibrant coral for energy",
    primary: "#FF7043",
  },
  {
    name: "Deep Ocean",
    description: "Dark blue for calmness",
    primary: "#1976D2",
  },
];

export default function ThemeModal({ visible, onClose }: ThemeModalProps) {
  const { isDarkMode, toggleTheme, selectedPalette, updatePalette } =
    useTheme();

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

  if (!visible) return null;

  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Personalize
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-outline" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Choose your theme
              </Text>
              <View style={styles.themeToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    isDarkMode && styles.darkThemeButton,
                    !isDarkMode && styles.selectedThemeButton,
                    !isDarkMode && { borderColor: selectedPalette.primary },
                  ]}
                  onPress={() => toggleTheme()}
                >
                  <Ionicons
                    name="sunny"
                    size={24}
                    color={
                      !isDarkMode
                        ? selectedPalette.primary
                        : isDarkMode
                          ? "#666"
                          : "#999"
                    }
                  />
                  <Text
                    style={[
                      styles.themeButtonText,
                      isDarkMode && styles.darkThemeButtonText,
                      !isDarkMode && { color: selectedPalette.primary },
                    ]}
                  >
                    Light
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    isDarkMode && styles.darkThemeButton,
                    isDarkMode && styles.selectedThemeButton,
                    isDarkMode && { borderColor: selectedPalette.primary },
                  ]}
                  onPress={() => toggleTheme()}
                >
                  <Ionicons
                    name="moon"
                    size={24}
                    color={
                      isDarkMode
                        ? selectedPalette.primary
                        : isDarkMode
                          ? "#999"
                          : "#666"
                    }
                  />
                  <Text
                    style={[
                      styles.themeButtonText,
                      isDarkMode && styles.darkThemeButtonText,
                      isDarkMode && { color: selectedPalette.primary },
                    ]}
                  >
                    Dark
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Color Palettes
              </Text>
              <View style={styles.palettesGrid}>
                {COLOR_PALETTES.map((palette) => (
                  <TouchableOpacity
                    key={palette.name}
                    style={[
                      styles.paletteCard,
                      selectedPalette.primary === palette.primary && {
                        borderColor: palette.primary,
                      },
                      isDarkMode && styles.darkPaletteCard,
                    ]}
                    onPress={() => updatePalette(palette.primary)}
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
                        isDarkMode && styles.darkText,
                        selectedPalette.primary === palette.primary && {
                          color: palette.primary,
                        },
                      ]}
                    >
                      {palette.name}
                    </Text>
                    <Text
                      style={[
                        styles.paletteDescription,
                        isDarkMode && styles.darkSubtitle,
                      ]}
                    >
                      {palette.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    zIndex: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: CONTAINER_PADDING,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    marginBottom: 16,
  },
  themeToggleContainer: {
    flexDirection: "row",
    gap: 12,
  },
  themeButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
  },
  darkThemeButton: {
    backgroundColor: "#2F3133",
    borderColor: "#404040",
  },
  selectedThemeButton: {
    backgroundColor: "transparent",
  },
  themeButtonText: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
    color: "#666666",
  },
  darkThemeButtonText: {
    color: "#999999",
  },
  palettesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    width: "100%",
  },
  paletteCard: {
    width: PALETTE_SIZE,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "transparent",
  },
  darkPaletteCard: {
    backgroundColor: "#2F3133",
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
    color: "#666666",
  },
  darkText: {
    color: "#FFFFFF",
  },
  darkSubtitle: {
    color: "#AAAAAA",
  },
});
