import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
  Image,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { FireIcon, ClockIcon, GymIcon } from "../components/TabIcons";
import { useTheme } from "../../src/context/theme";
import { ThemeBackground } from "../components/ThemeBackground";
import {
  Svg,
  Polygon,
  Line,
  Text as SvgText,
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  G,
} from "react-native-svg";
import { supabase } from "../../src/lib/supabase";
import { ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient as CardGradient } from "expo-linear-gradient";
import ScreenHeader from "../components/ScreenHeader";
import NavWalletButton from "../components/NavWalletButton";
import { api } from "../../src/services/api";

interface FocusAreaIntensity {
  area: string;
  intensity: number;
}

interface WeightProgress {
  date: string;
  weight: number;
}

interface WorkoutStats {
  date: string;
  count: number;
  duration: number;
  calories: number;
}

interface ExerciseFrequency {
  name: string;
  count: number;
}

interface ExerciseCompletion {
  exercise_id: string;
  exercises: {
    name: string;
  }[];
}

interface TimePeriod {
  label: string;
  value: string;
  days: number;
}

const TIME_PERIODS: TimePeriod[] = [
  { label: "7 Days", value: "7d", days: 7 },
  { label: "30 Days", value: "30d", days: 30 },
  { label: "90 Days", value: "90d", days: 90 },
  { label: "6 Months", value: "6mo", days: 180 },
  { label: "1 Year", value: "1y", days: 365 },
  { label: "2 Years", value: "2y", days: 730 },
];

// Dummy data for workout stats
const dummyWorkoutStats: WorkoutStats[] = [
  { date: "2024-03-25", count: 3, duration: 120, calories: 800 },
  { date: "2024-03-26", count: 2, duration: 90, calories: 600 },
  { date: "2024-03-27", count: 1, duration: 60, calories: 400 },
  { date: "2024-03-28", count: 4, duration: 150, calories: 1000 },
  { date: "2024-03-29", count: 2, duration: 100, calories: 700 },
  { date: "2024-03-30", count: 3, duration: 110, calories: 750 },
  { date: "2024-03-31", count: 1, duration: 45, calories: 300 },
];

// Dummy data for exercise frequency
// Dummy data removed


// Hardcoded FOCUS_AREA_GROUPS removed - functionality moved to database
const FOCUS_AREA_GROUPS = {};

const WEIGHT_UNIT_KEY = "weight_unit";

export default function ReportsScreen() {
  const { isDarkMode, selectedPalette } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(
    TIME_PERIODS[1]
  );
  const [weightData, setWeightData] = useState<WeightProgress[]>([]);
  const [isLoadingWeight, setIsLoadingWeight] = useState(true);
  const [focusAreaData, setFocusAreaData] = useState<FocusAreaIntensity[]>([]);
  const [isLoadingFocusArea, setIsLoadingFocusArea] = useState(false);
  const [mostFrequentExercises, setMostFrequentExercises] = useState<
    ExerciseFrequency[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDataPoint, setSelectedDataPoint] =
    useState<WeightProgress | null>(null);
  const chartRef = useRef({
    width: 300,
    height: 200,
    padding: { top: 30, right: 10, bottom: 40, left: 40 },
  });
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [refreshing, setRefreshing] = useState(false);
  const [workoutStats, setWorkoutStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    totalCalories: 0,
  });
  const [userHeight, setUserHeight] = useState<number | null>(null);
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [bmi, setBmi] = useState<number | null>(null);
  const [showHeightModal, setShowHeightModal] = useState(false);
  const [editingHeight, setEditingHeight] = useState("");

  const colors = {
    background: isDarkMode
      ? selectedPalette.dark.background
      : selectedPalette.light.background,
    surface: isDarkMode
      ? selectedPalette.dark.surface
      : selectedPalette.light.surface,
    surfaceSecondary: isDarkMode
      ? "rgba(255, 255, 255, 0.05)" // Neutral dark mode background
      : "rgba(0, 0, 0, 0.02)",      // Neutral light mode background
    text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
    textSecondary: isDarkMode
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(0, 0, 0, 0.6)",
    border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
  };

  const convertWeight = (
    weight: number,
    from: "kg" | "lbs",
    to: "kg" | "lbs"
  ) => {
    if (from === to) return weight;
    return from === "kg" ? weight * 2.20462 : weight / 2.20462;
  };

  useEffect(() => {
    console.log("Current weight unit:", weightUnit);
  }, [weightUnit]);

  // Consolidate profile and preference fetching
  const fetchUserProfile = async (forceRefresh = false) => {
    try {
      // Use caching for getProfile
      const response = await api.getProfile(forceRefresh);
      const profile = response.profile;

      if (profile) {
        if (profile.height) setUserHeight(profile.height);
        if (profile.height_unit) setHeightUnit(profile.height_unit as "cm" | "ft");

        setWorkoutStats({
          totalWorkouts: profile.total_workouts_completed || 0,
          totalDuration: profile.total_time_taken || 0,
          totalCalories: profile.total_calories_burned || 0,
        });

        const unit = profile.weight_unit as "kg" | "lbs" || "kg";
        setWeightUnit(unit);
        return unit;
      }
      return "kg";
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return "kg";
    }
  };

  // We can remove loadWeightUnitPreference and use fetchUserProfile instead
  // formatting helper
  const loadWeightUnitPreference = async () => {
    // Legacy wrapper if needed, or just redirect
    return await fetchUserProfile();
  };

  useEffect(() => {
    if (userHeight && weightData.length > 0) {
      const currentWeight = weightData[weightData.length - 1].weight;
      // Convert weight to kg for calculation
      const weightInKg = weightUnit === "lbs" ? currentWeight / 2.20462 : currentWeight;
      // Convert height to meters
      const heightInMeters = heightUnit === "ft"
        ? userHeight * 0.3048
        : userHeight / 100;

      if (heightInMeters > 0) {
        const bmiValue = weightInKg / (heightInMeters * heightInMeters);
        setBmi(Math.round(bmiValue * 10) / 10);
      }
    }
  }, [userHeight, weightData, weightUnit, heightUnit]);

  const fetchWeightHistory = async (days: number, unit?: "kg" | "lbs", forceRefresh = false) => {
    try {
      setIsLoadingWeight(true);
      // Ensure unit is valid, default to kg if not
      const currentUnit = unit || weightUnit || "kg";

      const data = await api.getWeightHistory(days, forceRefresh);
      // data is array of { weight, recorded_at }

      const groupedData = data.reduce(
        (
          acc: { [key: string]: { weight: number; recorded_at: string } },
          item
        ) => {
          const date = new Date(item.recorded_at);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const formattedDate = `${year}-${month}-${day}`;

          // Parse the weight value (always stored as kg in database)
          const dbWeight = typeof item.weight === 'string' ? parseFloat(item.weight) : item.weight;

          // Convert weight based on user preference
          const weight =
            currentUnit === "lbs"
              ? convertWeight(dbWeight, "kg", "lbs")
              : dbWeight;

          if (
            !acc[formattedDate] ||
            new Date(item.recorded_at) >
            new Date(acc[formattedDate].recorded_at)
          ) {
            acc[formattedDate] = {
              weight,
              recorded_at: item.recorded_at,
            };
          }
          return acc;
        },
        {}
      );

      const formattedData = Object.entries(groupedData)
        .map(([date, entry]) => ({
          date,
          weight: entry.weight, // Typescript knows this is number now
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      setWeightData(formattedData);
    } catch (error) {
      console.error("Error fetching weight history:", error);
    } finally {
      setIsLoadingWeight(false);
    }
  };

  useEffect(() => {
    if (selectedPeriod) {
      fetchWeightHistory(selectedPeriod.days);
    }
  }, [selectedPeriod, weightUnit]);

  useEffect(() => {
    if (weightData.length > 0) {
      setSelectedDataPoint(weightData[weightData.length - 1]);
    }
  }, [weightData]);

  const renderWeightProgressChart = () => {
    if (isLoadingWeight) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={selectedPalette.primary} />
        </View>
      );
    }

    if (weightData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={{ width: 60, height: 60, opacity: 0.5, marginBottom: 10 }}
            resizeMode="contain"
          />
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            Log your first weight by clicking the + icon
          </Text>
        </View>
      );
    }

    const { width, height, padding } = chartRef.current;

    // Filter out any invalid data points just in case
    const data = weightData.filter(d =>
      !isNaN(d.weight) && isFinite(d.weight) && d.weight > 0
    );

    if (data.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={{ width: 60, height: 60, opacity: 0.5, marginBottom: 10 }}
            resizeMode="contain"
          />
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            No valid weight data found
          </Text>
        </View>
      );
    }

    const minWeight = Math.min(...data.map((d) => d.weight));
    const maxWeight = Math.max(...data.map((d) => d.weight));
    let weightRange = maxWeight - minWeight;

    // If range is 0 (all points are same weight), create a synthetic range
    if (weightRange === 0) {
      weightRange = 1; // Arbitrary small range
    }

    const yAxisStep = calculateNiceStep(weightRange);

    // Calculate yMin and yMax with some padding
    let yMin = Math.floor(minWeight / yAxisStep) * yAxisStep;
    let yMax = Math.ceil(maxWeight / yAxisStep) * yAxisStep;

    // Ensure we still have a valid range after step calculation
    if (yMax === yMin) {
      yMin -= yAxisStep;
      yMax += yAxisStep;
    }

    const actualWeightRange = yMax - yMin;

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const xScale = (date: string) => {
      const index = data.findIndex((d) => d.date === date);
      // Safe division: max(..., 1) ensures we don't divide by zero if length is 1
      return (
        padding.left +
        (index * (width - padding.left - padding.right)) /
        Math.max(data.length - 1, 1) // Modified to 1 minimum
      );
    };

    const yScale = (weight: number) => {
      // Guard against division by zero if actualWeightRange is somehow still 0
      if (actualWeightRange === 0) return height - padding.bottom;

      return (
        height -
        padding.bottom -
        ((weight - yMin) / actualWeightRange) * chartHeight
      );
    };

    const numYLabels = 5;
    const yAxisLabels = Array.from({ length: numYLabels }, (_, i) => {
      const value =
        yMin + (actualWeightRange * (numYLabels - 1 - i)) / (numYLabels - 1);
      return value.toFixed(2);
    });

    // Helper functions for curved lines (Catmull-Rom to Cubic Bezier)
    const line = (pointA: any, pointB: any) => {
      const lengthX = pointB[0] - pointA[0];
      const lengthY = pointB[1] - pointA[1];
      return {
        length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
        angle: Math.atan2(lengthY, lengthX),
      };
    };

    const controlPoint = (current: any, previous: any, next: any, reverse?: boolean) => {
      const p = previous || current;
      const n = next || current;
      const smoothing = 0.2;
      const o = line(p, n);
      const angle = o.angle + (reverse ? Math.PI : 0);
      const length = o.length * smoothing;
      const x = current[0] + Math.cos(angle) * length;
      const y = current[1] + Math.sin(angle) * length;
      return [x, y];
    };

    const bezierCommand = (point: any, i: number, a: any[]) => {
      const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point);
      const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);
      return `C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point[0]},${point[1]}`;
    };

    const svgPath = (points: any[], command: any) => {
      const d = points.reduce(
        (acc, point, i, a) =>
          i === 0
            ? `M ${point[0]},${point[1]}`
            : `${acc} ${command(point, i, a)}`,
        ""
      );
      return d;
    };

    const rawPoints = data.map((d) => [xScale(d.date), yScale(d.weight)]);
    const points = svgPath(rawPoints, bezierCommand);

    const gradientId = "weightChartGradient";

    const findClosestPoint = (x: number) => {
      const chartX = x - padding.left;
      const dataIndex = Math.round((chartX / chartWidth) * (data.length - 1));
      return data[Math.max(0, Math.min(dataIndex, data.length - 1))];
    };

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const x = evt.nativeEvent.locationX;
        setSelectedDataPoint(findClosestPoint(x));
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const x = evt.nativeEvent.locationX;
        setSelectedDataPoint(findClosestPoint(x));
      },
      onPanResponderRelease: () => {
        // Keep the selected point visible
      },
    });

    const displayPoint =
      selectedDataPoint || (data.length > 0 ? data[data.length - 1] : null);

    const formatChartDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date;
    };

    return (
      <View style={[styles.card, { borderColor: colors.border, padding: 0, overflow: 'hidden' }]}>
        <CardGradient
          colors={isDarkMode ? ['#252525', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ padding: 16 }}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Weight Progress
            </Text>
            <TouchableOpacity
              style={[styles.periodSelector, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              onPress={() => setShowPeriodDropdown(true)}
            >
              <Text style={[styles.periodSelectorText, { color: colors.text }]}>
                {selectedPeriod.label}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.text}
                style={styles.dropdownIcon}
              />
            </TouchableOpacity>
          </View>

          <View {...panResponder.panHandlers}>
            <Svg width={width} height={height}>
              <Defs>
                <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <Stop
                    offset="0"
                    stopColor={selectedPalette.primary}
                    stopOpacity="0.2"
                  />
                  <Stop
                    offset="1"
                    stopColor={selectedPalette.primary}
                    stopOpacity="0"
                  />
                </LinearGradient>
              </Defs>

              {yAxisLabels.map((label, i) => {
                const y = padding.top + (i * chartHeight) / (numYLabels - 1);
                return (
                  <React.Fragment key={`grid-${i}`}>
                    <Line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke={colors.border}
                      strokeWidth="0.5"
                      strokeDasharray="4,4"
                    />
                    <SvgText
                      x={padding.left - 8}
                      y={y}
                      fill={colors.textSecondary}
                      fontSize="10"
                      textAnchor="end"
                      alignmentBaseline="middle"
                      fontFamily="Outfit-Regular"
                    >
                      {parseFloat(label).toFixed(2)}
                    </SvgText>
                  </React.Fragment>
                );
              })}

              <Path
                d={`${points} L ${xScale(data[data.length - 1].date)},${height - padding.bottom
                  } L ${xScale(data[0].date)},${height - padding.bottom} Z`}
                fill={`url(#${gradientId})`}
              />

              <Path
                d={points}
                fill="none"
                stroke={selectedPalette.primary}
                strokeWidth="2"
              />

              {data.map((d, i) => {
                const showLabel =
                  i === 0 ||
                  i === data.length - 1 ||
                  i % Math.ceil(data.length / 5) === 0;
                return (
                  <React.Fragment key={i}>
                    <Circle
                      cx={xScale(d.date)}
                      cy={yScale(d.weight)}
                      r="3"
                      fill="#FFFFFF"
                      stroke={selectedPalette.primary}
                      strokeWidth="1.5"
                    />
                    {showLabel && (
                      <>
                        <SvgText
                          x={xScale(d.date)}
                          y={height - padding.bottom + 12}
                          fill={colors.textSecondary}
                          fontSize="10"
                          textAnchor="middle"
                          fontFamily="Outfit-Regular"
                        >
                          {new Date(d.date).toLocaleString("en-US", {
                            month: "short",
                            timeZone: "UTC",
                          })}
                        </SvgText>
                        <SvgText
                          x={xScale(d.date)}
                          y={height - padding.bottom + 25}
                          fill={colors.textSecondary}
                          fontSize="10"
                          textAnchor="middle"
                          fontFamily="Outfit-Regular"
                        >
                          {new Date(d.date).toLocaleString("en-US", {
                            day: "numeric",
                            timeZone: "UTC",
                          })}
                        </SvgText>
                      </>
                    )}
                  </React.Fragment>
                );
              })}

              {displayPoint && (
                <>
                  <Line
                    x1={xScale(displayPoint.date)}
                    y1={padding.top}
                    x2={xScale(displayPoint.date)}
                    y2={height - padding.bottom}
                    stroke={selectedPalette.primary}
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />

                  <Circle
                    cx={xScale(displayPoint.date)}
                    cy={yScale(displayPoint.weight)}
                    r="6"
                    fill={selectedPalette.primary}
                    opacity="0.3"
                  />
                  <Circle
                    cx={xScale(displayPoint.date)}
                    cy={yScale(displayPoint.weight)}
                    r="3"
                    fill="#FFFFFF"
                    stroke={selectedPalette.primary}
                    strokeWidth="1.5"
                  />

                  <Rect
                    x={Math.max(0, Math.min(xScale(displayPoint.date) - 35, width - 70))}
                    y={yScale(displayPoint.weight) - 30}
                    width="70"
                    height="20"
                    rx="10"
                    fill={selectedPalette.primary}
                  />
                  <SvgText
                    x={Math.max(0, Math.min(xScale(displayPoint.date) - 35, width - 70)) + 35}
                    y={yScale(displayPoint.weight) - 20}
                    fill="#FFFFFF"
                    fontSize="12"
                    fontFamily="Outfit-SemiBold"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {`${displayPoint.weight.toFixed(2)} ${weightUnit}`}
                  </SvgText>
                </>
              )}
            </Svg>
          </View>

          <Modal
            visible={showPeriodDropdown}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowPeriodDropdown(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowPeriodDropdown(false)}
            >
              <View
                style={[
                  styles.periodDropdown,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {TIME_PERIODS.map((period) => (
                  <TouchableOpacity
                    key={period.value}
                    style={[
                      styles.periodOption,
                      selectedPeriod.value === period.value && {
                        backgroundColor: `${selectedPalette.primary}20`,
                      },
                    ]}
                    onPress={() => {
                      setSelectedPeriod(period);
                      setShowPeriodDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.periodOptionText,
                        { color: colors.text },
                        selectedPeriod.value === period.value && {
                          color: selectedPalette.primary,
                          fontFamily: "Outfit_600SemiBold",
                        },
                      ]}
                    >
                      {period.label}
                    </Text>
                    {selectedPeriod.value === period.value && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={selectedPalette.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          {displayPoint && (
            <View style={styles.selectedDateContainer}>
              <Text style={[styles.selectedDate, { color: colors.text }]}>
                {new Date(displayPoint.date).toLocaleString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </Text>
            </View>
          )}
        </CardGradient>
      </View>
    );
  };

  const calculateNiceStep = (range: number) => {
    const rough = range / 4;
    const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
    const mantissa = rough / pow10;

    let step;
    if (mantissa < 1.5) step = 1;
    else if (mantissa < 3) step = 2;
    else if (mantissa < 7) step = 5;
    else step = 10;

    return step * pow10;
  };

  // Consolidated into fetchUserProfile
  /* const fetchWorkoutStats = ... */

  // fetchWorkoutStats consolidated into fetchUserProfile
  /* useEffect(() => {
    fetchWorkoutStats();
  }, []); */

  const renderWorkoutStats = () => {
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <GymIcon
            size={24}
            color={selectedPalette.primary}
            focused={false}
          />
          <View style={styles.statText}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {workoutStats.totalWorkouts}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Workouts
            </Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <ClockIcon
            size={24}
            color={selectedPalette.primary}
          />
          <View style={styles.statText}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {Math.round(workoutStats.totalDuration / 3600)}h
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Duration
            </Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <FireIcon
            size={24}
            color={selectedPalette.primary}
          />
          <View style={styles.statText}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {workoutStats.totalCalories}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Calories
            </Text>
          </View>
        </View>
      </View>
    );
  };



  // Helper function: group raw focus data (now simply formats the API response)
  const groupFocusAreas = (data: any[]): FocusAreaIntensity[] => {
    // The API now returns grouped data based on database categories
    return data.map((item) => ({
      area: item.area,
      intensity: item.intensity || item.avg_intensity || 0, // Handle different potential response shapes
    })).filter((item) => item.intensity > 0);
  };

  const fetchFocusAreaIntensity = async (days: number, forceRefresh = false) => {
    try {
      setIsLoadingFocusArea(true);
      const data = await api.getFocusStats(days, forceRefresh);
      const groupedData = groupFocusAreas(data || []);
      setFocusAreaData(groupedData);
    } catch (error) {
      console.error("Error fetching focus area intensity:", error);
    } finally {
      setIsLoadingFocusArea(false);
    }
  };

  useEffect(() => {
    const days = selectedPeriod.days;
    fetchFocusAreaIntensity(days);
  }, [selectedPeriod]);

  const fetchMostFrequentExercises = async () => {
    try {
      console.log("Fetching exercise completions...");
      const { data, error } = await supabase
        .from("exercise_completions")
        .select(
          `
          exercise_id,
          exercises (
            name
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching exercise completions:", error);
        throw error;
      }

      console.log("Raw exercise data:", data);

      if (!data || data.length === 0) {
        setMostFrequentExercises([]);
        return;
      }

      // Process the exercise data
      const exerciseCounts = (data as ExerciseCompletion[]).reduce(
        (acc: { [key: string]: number }, item) => {
          console.log("Processing exercise item:", item);
          // Check if exercises array exists and has a name
          if (item.exercises && Array.isArray(item.exercises) && item.exercises.length > 0 && item.exercises[0].name) {
            const exerciseName = item.exercises[0].name;
            console.log("Found exercise name:", exerciseName);
            acc[exerciseName] = (acc[exerciseName] || 0) + 1;
          } else if (item.exercises && !Array.isArray(item.exercises) && (item.exercises as any).name) {
            // Handle case where it might be an object despite interface
            const exerciseName = (item.exercises as any).name;
            acc[exerciseName] = (acc[exerciseName] || 0) + 1;
          } else {
            console.log("No exercise name found in item");
          }
          return acc;
        },
        {}
      );

      console.log("Exercise counts:", exerciseCounts);

      // Convert to array and sort by count
      const sortedExercises = Object.entries(exerciseCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      console.log("Sorted exercises:", sortedExercises);
      setMostFrequentExercises(sortedExercises);
    } catch (error) {
      console.error("Error in fetchMostFrequentExercises:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMostFrequentExercises();
  }, []);

  const renderBMISection = () => {
    if (!bmi || !userHeight) return null;

    const getBMICategory = (value: number) => {
      if (value < 18.5) return { label: "Underweight", color: "#448AFF" };
      if (value < 25) return { label: "Normal", color: "#00E096" };
      if (value < 30) return { label: "Overweight", color: "#FFB946" };
      return { label: "Obese", color: "#FF5252" };
    };

    const category = getBMICategory(bmi);

    // Scale for gauge: 15 to 40
    const minBMI = 15;
    const maxBMI = 40;
    const percentage = Math.max(0, Math.min(100, ((bmi - minBMI) / (maxBMI - minBMI)) * 100));

    return (
      <View style={[styles.card, { borderColor: colors.border, padding: 0, overflow: 'hidden' }]}>
        <CardGradient
          colors={isDarkMode ? ['#252525', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ padding: 16 }}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>BMI</Text>
          </View>

          <View style={styles.bmiContent}>
            <View style={styles.bmiHeader}>
              <Text style={[styles.bmiValue, { color: colors.text }]}>{bmi}</Text>
              <View style={styles.bmiCategoryContainer}>
                <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                <Text style={[styles.categoryText, { color: colors.text }]}>{category.label}</Text>
              </View>
            </View>

            <View style={styles.gaugeContainer}>
              {/* Segments: <18.5 (14%), 18.5-25 (26%), 25-30 (20%), >30 (40%) of the 25 unit range */}
              {/* Simplified segments for the bar */}
              <View style={[styles.gaugeSegment, { flex: 3.5, backgroundColor: "#448AFF", borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]} />
              <View style={[styles.gaugeSegment, { flex: 6.5, backgroundColor: "#00E096" }]} />
              <View style={[styles.gaugeSegment, { flex: 5, backgroundColor: "#FFB946" }]} />
              <View style={[styles.gaugeSegment, { flex: 10, backgroundColor: "#FF5252", borderTopRightRadius: 4, borderBottomRightRadius: 4 }]} />

              {/* Indicator */}
              <View style={[styles.gaugeIndicator, { left: `${percentage}%` }]}>
                <View style={[styles.indicatorTriangle, { borderTopColor: colors.text }]} />
              </View>
            </View>

            <View style={styles.gaugeLabels}>
              <Text style={styles.gaugeLabel}>15</Text>
              <Text style={styles.gaugeLabel}>18.5</Text>
              <Text style={styles.gaugeLabel}>25</Text>
              <Text style={styles.gaugeLabel}>30</Text>
              <Text style={styles.gaugeLabel}>40</Text>
            </View>

            <View style={styles.heightContainer}>
              <Text style={[styles.heightLabel, { color: colors.textSecondary }]}>Height</Text>
              <View style={styles.heightValueContainer}>
                <Text style={[styles.heightValue, { color: colors.text }]}>
                  {userHeight} {heightUnit}
                </Text>
                <TouchableOpacity onPress={() => {
                  setEditingHeight(userHeight?.toString() || "");
                  setShowHeightModal(true);
                }}>
                  <Ionicons name="pencil" size={16} color={colors.textSecondary} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Modal
            visible={showHeightModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowHeightModal(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalOverlay}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Height</Text>

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={editingHeight}
                      onChangeText={setEditingHeight}
                      keyboardType="numeric"
                      placeholder="Enter height"
                      placeholderTextColor={colors.textSecondary}
                      autoFocus
                    />
                    <Text style={[styles.unitText, { color: colors.textSecondary }]}>{heightUnit}</Text>
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setShowHeightModal(false)}
                    >
                      <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: selectedPalette.primary }]}
                      onPress={saveHeight}
                    >
                      <Text style={[styles.modalButtonText, { color: "#FFF" }]}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </Modal>
        </CardGradient>
      </View>
    );
  };

  const saveHeight = async () => {
    if (!editingHeight) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const newHeight = parseFloat(editingHeight);

      const { error } = await supabase
        .from("profiles")
        .update({ height: newHeight, updated_at: new Date().toISOString() })
        .eq("id", session.user.id);

      if (error) throw error;

      setUserHeight(newHeight);
      setShowHeightModal(false);
    } catch (error) {
      console.error("Error updating height:", error);
    }
  };

  const renderFocusAreaChart = () => {
    const centerX = 150;
    const centerY = 150;
    const radius = 120;
    const numPoints = focusAreaData.length;
    const maxIntensity = 10;

    const getPoint = (index: number, intensity: number) => {
      const angle = (index * 2 * Math.PI) / numPoints - Math.PI / 2;
      const distance = (intensity / maxIntensity) * radius;
      return {
        x: centerX + distance * Math.cos(angle),
        y: centerY + distance * Math.sin(angle),
      };
    };

    const points = focusAreaData
      .map((data, index) => {
        const point = getPoint(index, data.intensity);
        return `${point.x},${point.y}`;
      })
      .join(" ");

    const backgroundLevels = [0.2, 0.4, 0.6, 0.8, 1];
    const backgroundWebs = backgroundLevels.map((level) => {
      return Array.from({ length: numPoints }, (_, i) => {
        const point = getPoint(i, maxIntensity * level);
        return `${point.x},${point.y}`;
      }).join(" ");
    });

    return (
      <Svg width={300} height={300}>
        {backgroundWebs.map((points, i) => (
          <Polygon
            key={`web-${i}`}
            points={points}
            fill="none"
            stroke={colors.border}
            strokeWidth="0.5"
          />
        ))}

        {focusAreaData.map((_, i) => {
          const point = getPoint(i, maxIntensity);
          return (
            <Line
              key={`axis-${i}`}
              x1={centerX}
              y1={centerY}
              x2={point.x}
              y2={point.y}
              stroke={colors.border}
              strokeWidth="0.5"
            />
          );
        })}

        <Polygon
          points={points}
          fill={`${selectedPalette.primary}40`}
          stroke={selectedPalette.primary}
          strokeWidth="2"
        />

        {focusAreaData.map((data, i) => {
          const point = getPoint(i, maxIntensity + 0.5);
          return (
            <G key={`label-${i}`}>
              <SvgText
                x={point.x}
                y={point.y}
                fill={colors.textSecondary}
                fontSize="12"
                fontWeight="500"
                textAnchor="middle"
                alignmentBaseline="middle"
                fontFamily="Outfit-Regular"
              >
                {data.area}
              </SvgText>
              <SvgText
                x={point.x}
                y={point.y + 15}
                fill={colors.textSecondary}
                fontSize="10"
                fontWeight="400"
                textAnchor="middle"
                alignmentBaseline="middle"
                fontFamily="Outfit-Regular"
              >
                {data.intensity.toFixed(1)}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    );
  };

  const renderMostFrequentExercises = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={selectedPalette.primary} />
        </View>
      );
    }

    if (mostFrequentExercises.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            No exercise data available
          </Text>
        </View>
      );
    }

    const maxCount = Math.max(...mostFrequentExercises.map((e) => e.count));

    return (
      <View style={styles.chartContainer}>
        {mostFrequentExercises.map((exercise) => {
          const percentage = maxCount > 0 ? (exercise.count / maxCount) * 100 : 0;

          return (
            <View key={exercise.name} style={styles.exerciseItem}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                <Text
                  style={[styles.exerciseName, { color: colors.text, marginBottom: 0, flex: 1, marginRight: 8 }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {exercise.name}
                </Text>
                <Text style={[styles.exerciseCount, { color: colors.textSecondary }]}>
                  {exercise.count} times
                </Text>
              </View>

              <View
                style={{
                  height: 8,
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  borderRadius: 4,
                  width: '100%',
                  overflow: 'hidden'
                }}
              >
                <Animated.View
                  style={{
                    height: '100%',
                    width: `${percentage}%`,
                    backgroundColor: selectedPalette.primary,
                    borderRadius: 4,
                  }}
                  entering={FadeInDown.duration(500)}
                />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const onRefresh = React.useCallback(async () => {
    console.log("Starting refresh...");
    setRefreshing(true);
    try {
      const unit = await loadWeightUnitPreference(); // This calls fetchUserProfile internally now? No wait, loadWeightUnitPreference calls fetchUserProfile.
      // We should update loadWeightUnitPreference to pass true if we want to force refresh?
      // Actually fetchUserProfile is what we want. 
      // loadWeightUnitPreference calls fetchUserProfile() which uses cache by default.
      // But on refresh we want FORCE refresh.

      // Let's call fetchUserProfile(true) directly here or update loadWeightUnitPreference signature.
      // Updating `loadWeightUnitPreference` is cleaner if we keep it.

      await Promise.all([
        fetchUserProfile(true),
        fetchWeightHistory(selectedPeriod.days, unit, true),
        fetchFocusAreaIntensity(selectedPeriod.days, true),
        fetchMostFrequentExercises(),
      ]);
      console.log("Refresh completed successfully");
    } catch (error) {
      console.error("Error during refresh:", error);
    } finally {
      setRefreshing(false);
    }
  }, [selectedPeriod.days]);

  return (
    <ThemeBackground style={styles.container}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScreenHeader title="Reports" rightAction={<NavWalletButton />} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={selectedPalette.primary}
              colors={[selectedPalette.primary]}
              progressBackgroundColor={colors.surface}
            />
          }
        >
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Progress Reports
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Track your fitness journey
            </Text>
          </View>

          {renderWeightProgressChart()}
          {renderBMISection()}

          <View
            style={[
              styles.card,
              {
                borderColor: colors.border,
                padding: 0,
                overflow: 'hidden'
              },
            ]}
          >
            <CardGradient
              colors={isDarkMode ? ['#252525', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ padding: 16 }}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Workout Statistics
              </Text>
              {renderWorkoutStats()}
            </CardGradient>
          </View>

          <View
            style={[
              styles.card,
              {
                borderColor: colors.border,
                padding: 0,
                overflow: 'hidden'
              },
            ]}
          >
            <CardGradient
              colors={isDarkMode ? ['#252525', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ padding: 16 }}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Most Frequent Exercises
              </Text>
              {renderMostFrequentExercises()}
            </CardGradient>
          </View>

          <View
            style={[
              styles.card,
              {
                borderColor: colors.border,
                padding: 0,
                overflow: 'hidden'
              },
            ]}
          >
            <CardGradient
              colors={isDarkMode ? ['#252525', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ padding: 16 }}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Focus Areas
                </Text>
              </View>
              <View style={styles.focusAreaChart}>
                {isLoadingFocusArea ? (
                  <ActivityIndicator size="large" color={selectedPalette.primary} />
                ) : focusAreaData.length === 0 ? (
                  <View style={styles.noDataContainer}>
                    <Text
                      style={[styles.noDataText, { color: colors.textSecondary }]}
                    >
                      No focus area data available for this period
                    </Text>
                  </View>
                ) : (
                  renderFocusAreaChart()
                )}
              </View>
            </CardGradient>
          </View>
        </ScrollView >
      </SafeAreaView >
    </ThemeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  contentContainer: {
    paddingBottom: 80,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "30%",
  },
  statText: {
    marginLeft: 12,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
  },
  statLabel: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
  },
  exerciseList: {
    marginTop: 8,
  },
  exerciseItem: {
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
    marginBottom: 4,
  },
  exerciseBarContainer: {
    height: 20,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  exerciseBar: {
    height: 8,
    borderRadius: 4,
  },
  exerciseCount: {
    marginLeft: 8,
    fontSize: 12,
    fontFamily: "Outfit-Medium",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  periodSelectorText: {
    fontSize: 14,
    fontFamily: "Outfit_500Medium",
  },
  dropdownIcon: {
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  periodDropdown: {
    width: "80%",
    maxWidth: 300,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  periodOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  periodOptionText: {
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
  },
  focusAreaChart: {
    height: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  noDataContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  barContainer: {
    marginBottom: 10,
    width: "100%",
  },
  chartContainer: {
    paddingVertical: 16,
    width: "100%",
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    marginBottom: 16,
  },
  selectedDateContainer: {
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  modalContent: {
    width: "80%",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    width: "100%",
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: "Outfit-Regular",
  },
  unitText: {
    fontSize: 18,
    fontFamily: "Outfit-Medium",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.2)",
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },

  selectedDate: {
    fontSize: 14,
    fontFamily: "Outfit_500Medium",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
    marginBottom: 8,
    marginTop: -4,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Outfit-Bold",
  },
  bmiContent: {
    marginTop: 8,
  },
  bmiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  bmiValue: {
    fontSize: 48,
    fontFamily: "Outfit-Bold",
  },
  bmiCategoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
  gaugeContainer: {
    height: 12,
    flexDirection: "row",
    marginBottom: 8,
    position: "relative",
    gap: 4,
  },
  gaugeSegment: {
    height: "100%",
    borderRadius: 4,
  },
  gaugeIndicator: {
    position: "absolute",
    top: -8,
    marginLeft: -6,
    alignItems: "center",
  },
  indicatorTriangle: {
    width: 0,
    height: 0,
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  gaugeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  gaugeLabel: {
    fontSize: 12,
    fontFamily: "Outfit-Regular",
    color: "#888",
  },
  heightContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 16,
  },
  heightLabel: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
  heightValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  heightValue: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
  },
});
