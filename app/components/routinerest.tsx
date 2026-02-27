import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  BackHandler,
  InteractionManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/theme";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ExerciseImage, { preloadSvgs, isSvgUrl, isSvgCached } from "./ExerciseImage";
import ExerciseInfoModal from "./ExerciseInfoModal";
import * as Speech from "expo-speech";
import { SvgXml } from "react-native-svg";
import { VOLUME_ICON_SVG, VOLUME_MUTE_ICON_SVG } from "./VolumeIcons";

const { width } = Dimensions.get("window");

interface RoutineRestProps {
  nextExercise: {
    name: string;
    image: string;
    exerciseId: string;
    duration?: number; // in seconds
    reps?: number;
    is_per_side?: boolean;
    frameUrls?: string[];
    frameCount?: number;
  };
  currentExerciseNumber: number;
  totalExercises: number;
  onSkip: () => void;
  onBack?: () => void; // Add optional onBack prop
  restDuration?: number; // Rest duration in seconds
  isPaused?: boolean; // External control for pausing the timer
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export default function RoutineRest({
  nextExercise,
  currentExerciseNumber,
  totalExercises,
  onSkip,
  onBack,
  restDuration = 10, // Default 10 seconds rest
  isPaused = false, // Default not paused
  isMuted = false,
  onToggleMute,
}: RoutineRestProps) {
  const { isDarkMode, selectedPalette } = useTheme();
  const [timeLeft, setTimeLeft] = useState(restDuration);
  const [isReady, setIsReady] = useState(false); // Wait for interactions to complete
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle hardware back button press
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (onBack) {
          onBack();
          return true; // Prevent default behavior
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [onBack])
  );

  // Theme colors
  const colors = {
    primary: selectedPalette.primary,
    text: "#FFFFFF", // Text is white for the rest screen
    textSecondary: "rgba(255, 255, 255, 0.7)",
  };

  // OPTIMIZATION: Wait for interactions to complete before starting timer
  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      if (isMounted.current) {
        // Small delay to ensure smooth rendering
        setTimeout(() => {
          if (isMounted.current) {
            setIsReady(true);
          }
        }, 50);
      }
    });

    // Preload next exercise image if needed
    if (nextExercise.image && isSvgUrl(nextExercise.image) && !isSvgCached(nextExercise.image)) {
      preloadSvgs([nextExercise.image]);
    }

    return () => handle.cancel();
  }, [nextExercise.image]);

  // Timer countdown effect - only starts when ready
  useEffect(() => {
    if (!isReady) return; // Don't start until ready

    if (timeLeft <= 0) {
      console.log("Rest timer reached zero, calling onSkip");
      onSkip();
      return;
    }

    // TTS Logic for 3, 2, 1
    if (!isMuted && timeLeft <= 3 && timeLeft > 0) {
      Speech.speak(timeLeft.toString(), {
        language: "en-US",
        rate: 1.0,
      });
    }

    // Only countdown if not paused and modal not visible
    if (!isPaused && !infoModalVisible) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [timeLeft, onSkip, isPaused, isReady, isMuted, infoModalVisible]);

  // Add extra rest time
  const addExtraTime = () => {
    setTimeLeft((prev) => prev + 20); // Add 20 seconds
  };

  // Format time for display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.primary }]}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          {/* Top Section */}
          <View style={styles.topSection}>
            {/* Back Button */}
            <View style={styles.header}>
              {!isPaused && onBack && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={onBack}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Audio Control Icon */}
            {!isPaused && (
              <View style={styles.controlsContainer}>
                <TouchableOpacity style={styles.iconButton} onPress={onToggleMute}>
                  <SvgXml
                    xml={isMuted ? VOLUME_MUTE_ICON_SVG : VOLUME_ICON_SVG}
                    width={24}
                    height={24}
                    fill="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* exercise Image */}
            <View style={styles.imageContainer}>
              <ExerciseImage
                uri={nextExercise.image}
                frameUrls={nextExercise.frameUrls}
                animationSpeed={500}
                animate={true}
                width={width * 0.7}
                height={width * 0.7}
                borderRadius={0}
                backgroundColor="transparent"
                showLoadingIndicator={true}
              />
            </View>

            {/* Next Exercise Info */}
            <View style={styles.nextExerciseContainer}>
              <Text style={styles.nextExerciseLabel}>
                NEXT {currentExerciseNumber + 1}/{totalExercises}
              </Text>

              <View style={styles.exerciseNameRow}>
                <Text style={styles.exerciseName} numberOfLines={2}>
                  {nextExercise.name.toUpperCase()}
                </Text>
                <TouchableOpacity style={styles.infoButton} onPress={() => setInfoModalVisible(true)}>
                  <Ionicons name="help-circle-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <Text style={styles.exerciseDetail}>
                  {nextExercise.duration
                    ? formatTime(nextExercise.duration)
                    : `x ${nextExercise.reps}`}
                </Text>
              </View>

              {/* Display per side instruction for next exercise if applicable */}
              {nextExercise.is_per_side &&
                !nextExercise.duration &&
                nextExercise.reps && (
                  <Text style={styles.perSideInstruction}>
                    {Math.ceil(nextExercise.reps / 2)} reps on each side
                  </Text>
                )}
            </View>
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            {/* Rest Timer */}
            <View style={styles.restTimerContainer}>
              <Text style={styles.restLabel}>REST</Text>
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.addTimeButton} onPress={addExtraTime}>
                <Text style={styles.addTimeButtonText}>+20s</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text
                  style={[
                    styles.skipButtonText,
                    { color: selectedPalette.primary },
                  ]}
                >
                  SKIP
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ExerciseInfoModal
        isVisible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
        exercise={nextExercise}
      />
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  topSection: {
    width: "100%",
  },
  controlsContainer: {
    position: "absolute",
    top: 5,
    right: 20,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    height: 50,
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: width,
    height: width * 0.7, // Match the ExerciseImage dimensions
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  nextExerciseContainer: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  nextExerciseLabel: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: "#FFFFFF",
    marginBottom: 8,
    opacity: 0.9,
  },
  exerciseNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exerciseName: {
    fontSize: 22,
    fontFamily: "Outfit-Bold",
    color: "#FFFFFF",
    flex: 1,
  },
  infoButton: {
    marginHorizontal: 10,
  },
  exerciseDetail: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    color: "#FFFFFF",
  },
  perSideInstruction: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  bottomSection: {
    width: "100%",
    paddingBottom: 20,
    justifyContent: "flex-end",
  },
  restTimerContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  restLabel: {
    fontSize: 32,
    fontFamily: "Outfit-Bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  timerText: {
    fontSize: 80,
    fontFamily: "Outfit-Bold",
    color: "#FFFFFF",
    includeFontPadding: false,
    lineHeight: 85,
  },
  actionButtonsContainer: {
    width: "100%",
    paddingHorizontal: 20,
    gap: 16,
  },
  addTimeButton: {
    width: "100%",
    height: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  addTimeButtonText: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: "#FFFFFF",
  },
  skipButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
  },
});
