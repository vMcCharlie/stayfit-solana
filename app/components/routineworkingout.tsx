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
import { SvgXml } from "react-native-svg";
import { VOLUME_ICON_SVG, VOLUME_MUTE_ICON_SVG } from "./VolumeIcons";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/theme";
import { useFocusEffect } from "expo-router";
import ExerciseImage, { preloadSvgs, isSvgUrl, isSvgCached } from "./ExerciseImage";
import ExerciseInfoModal from "./ExerciseInfoModal";

const { width } = Dimensions.get("window");

interface RoutineWorkingOutProps {
  exercise: {
    name: string;
    image: string;
    exerciseId: string;
    duration?: number; // in seconds
    reps?: number;
    is_per_side?: boolean;
    frameUrls?: string[];
    frameCount?: number;
  };
  onBack: () => void;
  onComplete: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  isPaused?: boolean; // External control for pausing
  isMuted?: boolean;
  onToggleMute?: () => void;
  onExerciseProgress?: (progress: {
    exerciseId: string;
    timeSpent?: number;
    repsCompleted?: number;
    isPerSide?: boolean;
    status: "completed" | "skipped";
  }) => void;
}

export default function RoutineWorkingOut({
  exercise,
  onBack,
  onComplete,
  onPrevious,
  onNext,
  hasNext,
  hasPrevious,
  isPaused: externalPause = false,
  isMuted = false,
  onToggleMute,
  onExerciseProgress,
}: RoutineWorkingOutProps) {
  const { isDarkMode, selectedPalette } = useTheme();
  const [timeLeft, setTimeLeft] = useState(exercise.duration || 0);
  const [internalPause, setInternalPause] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [exerciseStartTime, setExerciseStartTime] = useState<number>(
    Date.now()
  );
  const [timeSpent, setTimeSpent] = useState(0);
  const [isReady, setIsReady] = useState(false); // Wait for interactions to complete
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Combined pause state (either external or internal or modal open)
  const isTimerPaused = externalPause || internalPause || infoModalVisible;

  // Theme colors
  const colors = {
    background: isDarkMode
      ? selectedPalette.dark.background
      : selectedPalette.light.background,
    text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
    textSecondary: isDarkMode
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(0, 0, 0, 0.6)",
    primary: selectedPalette.primary,
  };

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

  // Reset timer and start time when exercise changes
  useEffect(() => {
    setIsReady(false); // Reset ready state for new exercise

    if (exercise.duration) {
      setTimeLeft(exercise.duration);
      setInternalPause(false);
    }
    setExerciseStartTime(Date.now());
    setTimeSpent(0);

    // Preload the exercise image if it's an SVG and not cached
    if (exercise.image && isSvgUrl(exercise.image) && !isSvgCached(exercise.image)) {
      preloadSvgs([exercise.image]);
    }

    // OPTIMIZATION: Wait for interactions to complete before starting timer
    const handle = InteractionManager.runAfterInteractions(() => {
      if (isMounted.current) {
        setTimeout(() => {
          if (isMounted.current) {
            setIsReady(true);
          }
        }, 50);
      }
    });

    return () => handle.cancel();
  }, [exercise]);

  // Timer countdown effect for duration-based exercises only - starts when ready
  useEffect(() => {
    if (!exercise.duration) return;
    if (!isReady) return; // Don't start until ready

    if (timeLeft <= 0 && onNext) {
      // Calculate final time spent
      const finalTimeSpent = Date.now() - exerciseStartTime;
      if (onExerciseProgress) {
        onExerciseProgress({
          exerciseId: exercise.exerciseId,
          timeSpent: Math.floor(finalTimeSpent / 1000),
          isPerSide: exercise.is_per_side,
          status: "completed", // Mark as completed when timer ends
        });
      }
      onNext();
      return;
    }

    if (!isTimerPaused) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
        setTimeSpent(Date.now() - exerciseStartTime);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [
    timeLeft,
    isTimerPaused,
    exercise,
    onNext,
    exerciseStartTime,
    onExerciseProgress,
    isReady,
  ]);

  // Format time for display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const togglePause = () => {
    setInternalPause(!internalPause);
  };

  const handleDone = () => {
    // For rep-based exercises, record completion
    if (!exercise.duration && exercise.reps && onExerciseProgress) {
      onExerciseProgress({
        exerciseId: exercise.exerciseId,
        repsCompleted: exercise.reps,
        timeSpent: Math.floor((Date.now() - exerciseStartTime) / 1000),
        isPerSide: exercise.is_per_side,
        status: "completed", // Mark as completed when Done is pressed
      });
    }
    onComplete();
  };

  const handleSkip = () => {
    // Record as skipped for both duration and rep based exercises
    if (onExerciseProgress) {
      // Set a flag to indicate this exercise was skipped
      // This will prevent the completion event from being triggered
      const skipEvent = {
        exerciseId: exercise.exerciseId,
        timeSpent: Math.floor((Date.now() - exerciseStartTime) / 1000),
        repsCompleted: exercise.reps, // Include reps even if skipped
        isPerSide: exercise.is_per_side,
        status: "skipped" as "completed" | "skipped",
      };

      // Call onExerciseProgress with the skip event
      onExerciseProgress(skipEvent);
    }

    // Move to the next exercise
    if (onNext) {
      onNext();
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Back Button */}
      {!externalPause && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Audio Control Icon */}
      {!externalPause && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={onToggleMute}>
            <SvgXml
              xml={isMuted ? VOLUME_MUTE_ICON_SVG : VOLUME_ICON_SVG}
              width={24}
              height={24}
              fill={colors.text}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Exercise Image */}
      <View style={[
        styles.imageContainer,
        { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }
      ]}>
        <ExerciseImage
          uri={exercise.image}
          frameUrls={exercise.frameUrls}
          animationSpeed={exercise.frameCount ? Math.floor(1500 / exercise.frameCount) : 500}
          animate={true}
          width={width}
          height={width * 0.8}
          borderRadius={0}
          backgroundColor="transparent"
          showLoadingIndicator={true}
        />
      </View>

      {/* Exercise Name */}
      <View style={styles.exerciseNameContainer}>
        <Text
          style={[styles.exerciseName, { color: colors.text }]}
          numberOfLines={2}
        >
          {exercise.name.toUpperCase()}
        </Text>
        <TouchableOpacity style={styles.infoButton} onPress={() => setInfoModalVisible(true)}>
          <Ionicons name="help-circle-outline" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Per Side Instruction */}
      {!exercise.duration && exercise.reps && exercise.is_per_side && (
        <Text style={[styles.perSideText, { color: colors.primary }]}>
          Each side x{Math.ceil(exercise.reps / 2)}
        </Text>
      )}

      {/* Timer or Reps */}
      <View
        style={[
          styles.timerContainer,
          !exercise.duration && exercise.reps && exercise.is_per_side
            ? { marginTop: 8 }
            : { marginTop: 30 },
        ]}
      >
        {exercise.duration ? (
          <Text style={[styles.timerText, { color: colors.text }]}>
            {formatTime(timeLeft)}
          </Text>
        ) : (
          <Text style={[styles.timerText, { color: colors.text }]}>
            x{exercise.reps}
          </Text>
        )}
      </View>

      {/* Pause/Done Button */}
      {exercise.duration ? (
        // Show Pause button for duration-based exercises
        <TouchableOpacity
          style={[styles.pauseButton, { backgroundColor: colors.primary }]}
          onPress={togglePause}
        >
          <Ionicons
            name={isTimerPaused ? "play" : "pause"}
            size={20}
            color="white"
          />
          <Text style={styles.pauseButtonText}>
            {isTimerPaused ? "RESUME" : "PAUSE"}
          </Text>
        </TouchableOpacity>
      ) : (
        // Show Done/Complete button for rep-based exercises
        <TouchableOpacity
          style={[styles.doneButton, { backgroundColor: colors.primary }]}
          onPress={handleDone}
        >
          <Ionicons name="checkmark" size={20} color="white" />
          <Text style={styles.doneButtonText}>
            {!hasNext ? "COMPLETE" : "DONE"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navigationButton, { opacity: hasPrevious ? 1 : 0.3 }]}
          onPress={onPrevious}
          disabled={!hasPrevious}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={[styles.navigationText, { color: colors.text }]}>
            Previous
          </Text>
        </TouchableOpacity>

        {exercise.duration ? (
          // For duration-based exercises, show Skip/Complete button
          <TouchableOpacity
            style={[
              styles.navigationButton,
              { opacity: hasNext || !exercise.duration ? 1 : 0.3 },
            ]}
            onPress={handleSkip}
            disabled={Boolean(!hasNext && exercise.duration)}
          >
            <Text style={[styles.navigationText, { color: colors.text }]}>
              {!hasNext ? "Complete" : "Skip"}
            </Text>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          // For rep-based exercises, show Skip button (except for last exercise)
          hasNext && (
            <TouchableOpacity
              style={styles.navigationButton}
              onPress={handleSkip}
            >
              <Text style={[styles.navigationText, { color: colors.text }]}>
                Skip
              </Text>
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </TouchableOpacity>
          )
        )}
      </View>

      <ExerciseInfoModal
        isVisible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
        exercise={exercise}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: 120,
  },
  header: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 0,
    width: "100%",
    paddingHorizontal: 20,
    zIndex: 10,
    alignItems: "flex-start", // Align back button to left
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlsContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 20,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: width,
    height: width * 0.8,
    marginTop: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 0,
    overflow: 'hidden',
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  exerciseNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
    width: "100%",
  },
  exerciseName: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    marginRight: 10,
    flex: 1,
    textAlign: "center",
  },
  infoButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  timerContainer: {
    alignItems: "center",
  },
  timerText: {
    fontSize: 60,
    fontFamily: "Outfit-Bold",
  },
  perSideText: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 5,
  },
  pauseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    gap: 8,
  },
  pauseButtonText: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: "white",
  },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    gap: 8,
  },
  doneButtonText: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: "white",
  },
  navigationContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 0 : 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    paddingVertical: 20,
    backgroundColor: "transparent",
  },
  navigationButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    height: 44,
  },
  navigationText: {
    fontSize: 18,
    fontFamily: "Outfit-Medium",
  },
});
