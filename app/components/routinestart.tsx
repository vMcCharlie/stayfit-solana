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
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { SvgXml } from "react-native-svg";
import { VOLUME_ICON_SVG, VOLUME_MUTE_ICON_SVG } from "./VolumeIcons";
import { useFocusEffect } from "expo-router";
import ExerciseImage, { preloadSvgs, isSvgUrl, isSvgCached } from "./ExerciseImage";
import ExerciseInfoModal from "./ExerciseInfoModal";

const { width, height } = Dimensions.get("window");

interface RoutineStartProps {
  exercise: {
    name: string;
    image: string;
    exerciseId: string;
    frameUrls?: string[];
    frameCount?: number;
  };
  onSkip: () => void;
  onBack?: () => void;
  restDuration?: number; // Rest duration in seconds, defaults to 10
  isPaused?: boolean; // External control for pausing the timer
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export default function RoutineStart({
  exercise,
  onSkip,
  onBack,
  restDuration = 10,
  isPaused = false, // Default not paused
  isMuted = false,
  onToggleMute,
}: RoutineStartProps) {
  const { isDarkMode, selectedPalette } = useTheme();
  const [timeLeft, setTimeLeft] = useState(restDuration);
  const [strokeOffset, setStrokeOffset] = useState(0);
  const [isReady, setIsReady] = useState(false); // Wait for image and interactions
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
    background: isDarkMode
      ? selectedPalette.dark.background
      : selectedPalette.light.background,
    text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
    textSecondary: isDarkMode
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(0, 0, 0, 0.6)",
    primary: selectedPalette.primary,
  };

  // Calculate progress
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  // OPTIMIZATION: Wait for interactions to complete before starting timer
  // This prevents the lag during the initial animation/render phase
  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      if (isMounted.current) {
        // Small delay to ensure everything is rendered smoothly
        setTimeout(() => {
          if (isMounted.current) {
            setIsReady(true);
          }
        }, 100);
      }
    });

    // Also preload the image if needed
    if (exercise.image && isSvgUrl(exercise.image) && !isSvgCached(exercise.image)) {
      preloadSvgs([exercise.image]);
    }

    return () => handle.cancel();
  }, [exercise.image]);

  // Update stroke offset when timeLeft changes
  useEffect(() => {
    const progress = (timeLeft / restDuration) * 100;
    const newOffset = circumference - (progress / 100) * circumference;
    setStrokeOffset(newOffset);
  }, [timeLeft, restDuration]);

  // Timer countdown effect - only starts when ready
  useEffect(() => {
    if (!isReady) return; // Don't start until ready

    if (timeLeft <= 0) {
      onSkip();
      return;
    }

    // Only countdown if not paused and modal not visible
    if (!isPaused && !infoModalVisible) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [timeLeft, onSkip, isPaused, isReady, infoModalVisible]);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Back Button */}
      <View style={styles.header}>
        {!isPaused && onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
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
              fill={colors.text}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Exercise Image */}
      <View style={[styles.imageContainer, { backgroundColor: 'transparent' }]}>
        <ExerciseImage
          uri={exercise.image}
          frameUrls={exercise.frameUrls}
          animationSpeed={500}
          animate={true}
          width={width * 0.8}
          height={width * 0.8}
          borderRadius={0}
          backgroundColor="transparent"
          showLoadingIndicator={true}
        />
      </View>

      {/* Ready to Go Text */}
      <Text style={[styles.readyText, { color: colors.primary }]}>
        READY TO GO!
      </Text>

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

      {/* Timer Circle with Progress */}
      <View style={styles.countdownContainer}>
        <View style={styles.svgContainer}>
          <Svg width={140} height={140} style={styles.svg}>
            {/* Background Circle */}
            <Circle
              cx={70}
              cy={70}
              r={radius}
              stroke={isDarkMode ? "#333333" : "#E8E8E8"}
              strokeWidth={8}
              fill="none"
            />
            {/* Progress Circle */}
            <Circle
              cx={70}
              cy={70}
              r={radius}
              stroke={colors.primary}
              strokeWidth={8}
              fill="none"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
            />
          </Svg>
          <Text style={[styles.countdownText, { color: colors.text }]}>
            {timeLeft}
          </Text>
        </View>
      </View>

      {/* Navigation Container */}
      <View style={styles.navigationContainer}>
        {/* Placeholder for left side alignment if needed, or justify-end */}
        <View />

        <TouchableOpacity
          style={styles.navigationButton}
          onPress={onSkip}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Text style={[styles.navigationText, { color: colors.text }]}>Skip</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </TouchableOpacity>
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
    height: height * 0.35, // Use 35% of screen height
    marginTop: Platform.OS === "ios" ? 40 : 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 0,
    overflow: 'hidden',
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
    resizeMode: 'contain',
  },
  readyText: {
    fontSize: 40,
    fontFamily: "Outfit-Bold",
    marginTop: 10,
    marginBottom: 5,
  },
  exerciseNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
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
  countdownContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  svgContainer: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  svg: {
    transform: [{ rotateZ: "0deg" }],
  },
  countdownText: {
    position: "absolute",
    fontSize: 60,
    fontFamily: "Outfit-Bold",
    textAlign: "center",
  },
  navigationContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 0 : 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between", // Pushes content to edges
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
  header: {
    height: 50,
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: Platform.OS === "ios" ? 50 : 30, // Adjust for status bar since not using SafeAreaView
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.1)", // Use darker background for contrast on light content
    justifyContent: "center",
    alignItems: "center",
  },
});
