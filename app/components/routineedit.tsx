import React, { useState, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/theme";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ExerciseImage from "./ExerciseImage";
import ReplaceExerciseModal from "./ReplaceExerciseModal";

const { width } = Dimensions.get("window");

// Format time utility function
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

// Default image for exercises
const defaultImage =
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop";

interface WorkoutItem {
  id: string;
  name: string;
  reps?: number;
  duration?: string;
  orderPosition: number;
  // focus_areas: string[]; // Removed as it wasn't present in parent
  is_per_side?: boolean;
  image: string;
  exerciseId: string;
  rawDuration?: number;
  localDuration?: number;
  localReps?: number;
  frameUrls?: string[];
  frameCount?: number;
}

interface RoutineEditProps {
  workouts: WorkoutItem[];
  onClose: () => void;
  onSave: (updatedWorkouts: WorkoutItem[]) => void;
}

// Memoized workout item component
const WorkoutItemComponent = memo(
  ({
    item,
    drag,
    isActive,
    onIncrease,
    onDecrease,
    onReplace,
    colors,
    primaryColor,
    isDarkMode,
  }: {
    item: WorkoutItem;
    drag: () => void;
    isActive: boolean;
    onIncrease: () => void;
    onDecrease: () => void;
    onReplace: () => void;
    colors: any;
    primaryColor: string;
    isDarkMode: boolean;
  }) => {
    return (
      <ScaleDecorator activeScale={0.98}>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.workoutItem,
            {
              backgroundColor: colors.background,
              opacity: isActive ? 0.9 : 1,
              transform: isActive ? [{ scale: 0.98 }] : [],
            },
          ]}
        >
          <TouchableOpacity onPressIn={drag} style={styles.dragHandle}>
            <MaterialCommunityIcons
              name="drag-horizontal-variant"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <ExerciseImage
            uri={item.image}
            width={64}
            height={64}
            borderRadius={12}
            backgroundColor={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}
            showLoadingIndicator={true}
            style={{ marginRight: 12 }}
          />

          <View style={styles.workoutInfo}>
            <Text
              style={[styles.workoutName, { color: colors.text }]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            <View style={styles.adjustmentContainer}>
              <TouchableOpacity
                style={[
                  styles.adjustButton,
                  { backgroundColor: colors.surface },
                ]}
                onPress={onDecrease}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="remove" size={20} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.workoutMeta, { color: colors.text }]}>
                {item.duration || `x${item.reps}`}
              </Text>

              <TouchableOpacity
                style={[
                  styles.adjustButton,
                  { backgroundColor: colors.surface },
                ]}
                onPress={onIncrease}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="add" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.replaceButton}
            onPress={onReplace}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="swap-horizontal"
              size={24}
              color={primaryColor}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  }
);

export default function RoutineEdit({
  workouts: initialWorkouts,
  onClose,
  onSave,
}: RoutineEditProps) {
  const { isDarkMode, selectedPalette } = useTheme();
  const insets = useSafeAreaInsets();

  // Create a working copy of workouts that won't affect the parent state until save
  const [workouts, setWorkouts] = useState<WorkoutItem[]>(
    initialWorkouts.map((workout) => ({ ...workout }))
  );

  // Replace Modal State
  const [isReplaceModalVisible, setReplaceModalVisible] = useState(false);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState<number | null>(null);

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
  };

  const handleDragEnd = ({ data }: { data: WorkoutItem[] }) => {
    // Update only the working copy
    setWorkouts(data.map((item) => ({ ...item })));
  };

  const handleIncrease = (index: number) => {
    setWorkouts((current) => {
      const updated = current.map((item) => ({ ...item }));
      const item = updated[index];

      if (item.duration) {
        // For duration-based exercises, increase by 15 seconds
        const currentSeconds = item.rawDuration || 0;
        const newDuration = currentSeconds + 15;
        item.duration = formatTime(newDuration);
        item.rawDuration = newDuration;
        item.localDuration = newDuration;
      } else if (item.reps) {
        // For rep-based exercises, increase by 2
        const newReps = item.reps + 2;
        item.reps = newReps;
        item.localReps = newReps;
      }
      return updated;
    });
  };

  const handleDecrease = (index: number) => {
    setWorkouts((current) => {
      const updated = current.map((item) => ({ ...item }));
      const item = updated[index];

      if (item.duration) {
        // For duration-based exercises, decrease by 15 seconds (minimum 15 seconds)
        const currentSeconds = item.rawDuration || 0;
        const newDuration = Math.max(15, currentSeconds - 15);
        item.duration = formatTime(newDuration);
        item.rawDuration = newDuration;
        item.localDuration = newDuration;
      } else if (item.reps) {
        // For rep-based exercises, decrease by 2 (minimum 2)
        const newReps = Math.max(2, item.reps - 2);
        item.reps = newReps;
        item.localReps = newReps;
      }
      return updated;
    });
  };

  const openReplaceModal = (index: number) => {
    setReplaceTargetIndex(index);
    setReplaceModalVisible(true);
  };

  const handleExerciseSelected = (newExercise: any) => {
    if (replaceTargetIndex === null) return;

    setWorkouts((current) => {
      const updated = [...current];
      const oldItem = updated[replaceTargetIndex];

      // Get animation frames - prefer male frames, fallback to female
      const maleFrames = newExercise.exercise_animations?.find((anim: any) => anim.gender === 'male')?.frame_urls;
      const femaleFrames = newExercise.exercise_animations?.find((anim: any) => anim.gender === 'female')?.frame_urls;
      const frameUrls = maleFrames && maleFrames.length > 0 ? maleFrames : (femaleFrames || []);
      const frameCount = newExercise.exercise_animations?.find((anim: any) =>
        anim.gender === (maleFrames ? 'male' : 'female')
      )?.frame_count || frameUrls.length;

      // Determine correct image URL
      const imageUrl = newExercise.gif_url ||
        newExercise.image_url_male ||
        newExercise.image_url_female ||
        defaultImage;

      const newItem: WorkoutItem = {
        ...oldItem, // Keep id, duration settings, etc.
        name: newExercise.name,
        image: imageUrl,
        exerciseId: newExercise.id,
        is_per_side: newExercise.is_per_side,
        frameUrls: frameUrls.length > 0 ? frameUrls : undefined,
        frameCount: frameCount > 0 ? frameCount : undefined,
      };

      updated[replaceTargetIndex] = newItem;
      return updated;
    });

    setReplaceModalVisible(false);
    setReplaceTargetIndex(null);
  };

  const renderItem = ({
    item,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<WorkoutItem>) => {
    const index = getIndex();
    return (
      <WorkoutItemComponent
        item={item}
        drag={drag}
        isActive={isActive}
        onIncrease={() => index !== undefined && handleIncrease(index)}
        onDecrease={() => index !== undefined && handleDecrease(index)}
        onReplace={() => index !== undefined && openReplaceModal(index)}
        colors={colors}
        primaryColor={selectedPalette.primary}
        isDarkMode={isDarkMode}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 20) }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Edit Workout
        </Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: selectedPalette.primary },
          ]}
          onPress={() => onSave(workouts)}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Workout List */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <DraggableFlatList
          data={workouts}
          onDragEnd={handleDragEnd}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      </GestureHandlerRootView>

      {/* Replace Exercise Modal */}
      <ReplaceExerciseModal
        isVisible={isReplaceModalVisible}
        onClose={() => setReplaceModalVisible(false)}
        onSelect={handleExerciseSelected}
        currentExerciseName={
          replaceTargetIndex !== null && workouts[replaceTargetIndex]
            ? workouts[replaceTargetIndex].name
            : ""
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 20, // Increased bottom padding
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  workoutItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 12,
    borderRadius: 16, // More rounded
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  dragHandle: {
    padding: 8,
    marginRight: 4,
  },
  workoutInfo: {
    flex: 1,
    marginRight: 12,
  },
  workoutName: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
    marginBottom: 8,
    lineHeight: 22, // Better line height for multiline
  },
  adjustmentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  adjustButton: {
    width: 36, // Larger touch target
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  workoutMeta: {
    fontSize: 16,
    fontFamily: "Outfit-Bold", // Bold for emphasis
    minWidth: 50,
    textAlign: "center",
  },
  replaceButton: {
    padding: 8,
    marginLeft: 4,
  },
});
