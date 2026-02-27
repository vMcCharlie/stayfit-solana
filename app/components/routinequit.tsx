import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/theme";
import Animated, { FadeIn } from "react-native-reanimated";
import { useFocusEffect } from "expo-router";

const { width, height } = Dimensions.get("window");

interface RoutineQuitProps {
  onCancel: () => void; // Go back to the workout screen
  onQuit: () => void; // Quit and return to routine
  isPaused?: boolean; // Flag to indicate if the timers should be paused
}

export default function RoutineQuit({
  onCancel,
  onQuit,
  isPaused = true,
}: RoutineQuitProps) {
  const { isDarkMode, selectedPalette } = useTheme();

  // Handle hardware back button press - should dismiss the quit dialog
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onCancel();
        return true; // Prevent default behavior
      }
    );

    return () => backHandler.remove();
  }, [onCancel]);

  // Create overlay with 99% opacity using primary color
  const overlayColor = isDarkMode
    ? `${selectedPalette.primary}FC` // 99% opacity in hex is FC
    : `${selectedPalette.primary}FC`;

  // Text and button colors based on theme
  const textColor = "#FFFFFF"; // White text is more readable on primary color
  const optionBgColor = isDarkMode
    ? "rgba(255, 255, 255, 0.15)"
    : "rgba(255, 255, 255, 0.25)";

  // Button colors
  const buttonColor = isDarkMode
    ? "rgba(255, 255, 255, 0.9)"
    : "rgba(255, 255, 255, 0.9)";
  const buttonTextColor = selectedPalette.primary; // Primary color for text on white button

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[styles.container, { backgroundColor: overlayColor }]}
    >
      {/* Back button at top left */}
      <TouchableOpacity style={styles.backButton} onPress={onCancel}>
        <Ionicons name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>

      {/* Quit text */}
      <Text style={[styles.quitText, { color: textColor }]}>Quit</Text>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {/* Just take a look option */}
        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: optionBgColor }]}
          onPress={onQuit}
        >
          <Text style={[styles.optionText, { color: textColor }]}>
            Just take a look
          </Text>
        </TouchableOpacity>

        {/* Too hard option */}
        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: optionBgColor }]}
          onPress={onQuit}
        >
          <Text style={[styles.optionText, { color: textColor }]}>
            Too hard
          </Text>
        </TouchableOpacity>

        {/* Don't know how to do it option */}
        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: optionBgColor }]}
          onPress={onQuit}
        >
          <Text style={[styles.optionText, { color: textColor }]}>
            Don't know how to do it
          </Text>
        </TouchableOpacity>

        {/* Quit text option */}
        <TouchableOpacity style={styles.quitTextContainer} onPress={onQuit}>
          <Text style={[styles.quitTextOption, { color: textColor }]}>
            Quit <Ionicons name="chevron-forward" size={16} color={textColor} />
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 40 : 20,
  },
  quitText: {
    fontSize: 32,
    fontFamily: "Outfit-Bold",
    marginTop: height * 0.05,
    marginLeft: 10,
  },
  optionsContainer: {
    width: "100%",
    marginTop: height * 0.1,
  },
  optionButton: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  optionText: {
    fontSize: 18,
    fontFamily: "Outfit-Medium",
  },
  quitTextContainer: {
    alignSelf: "flex-end",
    marginTop: 5,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  quitTextOption: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    flexDirection: "row",
    alignItems: "center",
  },
});
