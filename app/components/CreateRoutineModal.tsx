import React, { useState, useEffect, memo, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/context/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "../../src/services/api";
import { ThemeBackground } from "./ThemeBackground";
import DraggableFlatList, {
    ScaleDecorator,
    RenderItemParams,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuth } from "../../src/context/auth";
import ReplaceExerciseModal from "./ReplaceExerciseModal";
import ExerciseImage from "./ExerciseImage";
import { GymIcon } from "./TabIcons";

const { width } = Dimensions.get("window");

interface CreateRoutineModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface WorkoutItem {
    id: string; // Unique ID for list rendering (randomly generated)
    name: string;
    image: string;
    exerciseId: string;
    reps?: number;
    duration?: string;
    rawDuration?: number;
    orderPosition: number;
    is_per_side?: boolean;
    frameUrls?: string[];
    frameCount?: number;
}

// Format time utility function
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
};

const defaultImage =
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop";

// Memoized workout item component (Adapted from routineedit.tsx)
const WorkoutItemComponent = memo(
    ({
        item,
        drag,
        isActive,
        onIncrease,
        onDecrease,
        onRemove,
        colors,
        primaryColor,
        isDarkMode,
    }: {
        item: WorkoutItem;
        drag: () => void;
        isActive: boolean;
        onIncrease: () => void;
        onDecrease: () => void;
        onRemove: () => void;
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
                            backgroundColor: colors.surface, // Use surface for clean card look
                            opacity: isActive ? 0.9 : 1,
                            transform: isActive ? [{ scale: 0.98 }] : [],
                            // Remove border, rely on shadow/elevation
                            // borderColor: colors.border,
                            // borderWidth: 1,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: isDarkMode ? 0.3 : 0.1,
                            shadowRadius: 4,
                            elevation: 2,
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
                        width={56}
                        height={56}
                        borderRadius={10}
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
                                    { backgroundColor: colors.background }, // Inner contrast
                                ]}
                                onPress={onDecrease}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="remove" size={18} color={colors.text} />
                            </TouchableOpacity>

                            <Text style={[styles.workoutMeta, { color: colors.text }]}>
                                {item.duration || `x${item.reps}`}
                            </Text>

                            <TouchableOpacity
                                style={[
                                    styles.adjustButton,
                                    { backgroundColor: colors.background },
                                ]}
                                onPress={onIncrease}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="add" size={18} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={onRemove}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name="trash-outline"
                            size={22}
                            color="#FF4B4B"
                        />
                    </TouchableOpacity>
                </TouchableOpacity>
            </ScaleDecorator>
        );
    }
);

export default function CreateRoutineModal({
    isVisible,
    onClose,
    onSuccess,
}: CreateRoutineModalProps) {
    const { isDarkMode, selectedPalette } = useTheme();
    const { user } = useAuth();
    const [userGender, setUserGender] = useState<"male" | "female">("male");

    // Steps: 1 = Details, 2 = Select Exercises
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false); // For initial setup if needed
    const [saving, setSaving] = useState(false);

    // Form Data
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Other");
    const [level, setLevel] = useState("Intermediate");

    // Exercise List state
    const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>([]);

    // Add Exercise Modal
    const [isAddModalVisible, setAddModalVisible] = useState(false);

    const colors = {
        background: isDarkMode ? selectedPalette.dark.background : selectedPalette.light.background,
        surface: isDarkMode ? selectedPalette.dark.surface : "#FFFFFF",
        text: isDarkMode ? "#FFFFFF" : "#000000",
        textSecondary: isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
        border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        inputBg: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
    };

    // Load user gender for images
    useEffect(() => {
        if (isVisible) {
            api.getProfile().then(p => {
                const g = p.profile?.gender?.toLowerCase();
                if (g === 'female' || g === 'woman') setUserGender("female");
            }).catch(console.warn);
        }
    }, [isVisible]);

    const handleNext = async () => {
        if (!name.trim()) return;

        if (step === 1) {
            setStep(2);
        } else {
            // Step 2: Save
            if (workoutItems.length === 0) return;
            await saveRoutine();
        }
    };

    const handleBack = () => {
        if (step === 2) setStep(1);
        else onClose();
    }

    const saveRoutine = async () => {
        try {
            setSaving(true);

            // Map workoutItems to API format
            await api.createRoutine({
                name,
                category,
                level,
                exercises: workoutItems.map((item, index) => ({
                    id: item.exerciseId,
                    reps: item.reps, // Will be undefined if duration is set
                    duration: item.rawDuration, // Will be undefined if reps is set
                    sets: 3, // Default sets
                    order: index + 1
                }))
            });

            onSuccess();
            resetForm();
            onClose();
        } catch (error) {
            console.error("Failed to save", error);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setName("");
        setCategory("Other");
        setStep(1);
        setWorkoutItems([]);
    };

    // Exercise Helper Functions
    const handleAddExercise = (exercise: any) => {
        // Determine frames & image based on gender
        const maleFrames = exercise.exercise_animations?.find((anim: any) => anim.gender === 'male')?.frame_urls;
        const femaleFrames = exercise.exercise_animations?.find((anim: any) => anim.gender === 'female')?.frame_urls;
        const frameUrls = (userGender === 'female' && femaleFrames && femaleFrames.length > 0) ? femaleFrames : (maleFrames || []);

        const imageUrl = (userGender === 'female' && exercise.image_url_female)
            ? exercise.image_url_female
            : (exercise.image_url_male || exercise.gif_url || defaultImage);

        // DEFAULT VALUES: 60s for cardio/time-based, 10 reps for strength
        // Check exercise type or name to guess defaults? 
        // User requested: "default timer to 1 minute, and default count to 10"

        // Simple heuristic: If it has 'cardio' or type is cardio -> duration (1 min)
        // Else -> Reps (10)

        const isCardio = exercise.exercise_type?.toLowerCase() === 'cardio' ||
            exercise.exercise_type?.toLowerCase() === 'duration';

        const newItem: WorkoutItem = {
            id: Math.random().toString(36).substring(7), // Temp UI ID
            name: exercise.name,
            image: imageUrl,
            exerciseId: exercise.id,
            orderPosition: workoutItems.length + 1,
            is_per_side: exercise.is_per_side,
            frameUrls: frameUrls.length > 0 ? frameUrls : undefined,
            frameCount: frameUrls.length,

            // Set Defaults
            reps: isCardio ? undefined : 10,
            duration: isCardio ? "01:00" : undefined,
            rawDuration: isCardio ? 60 : undefined,
        };

        setWorkoutItems(prev => [...prev, newItem]);
        setAddModalVisible(false);
    };

    const handleIncrease = (index: number) => {
        setWorkoutItems(current => {
            const updated = [...current];
            const item = { ...updated[index] };

            if (item.duration) {
                const currentSecs = item.rawDuration || 60;
                const newSecs = currentSecs + 15;
                item.rawDuration = newSecs;
                item.duration = formatTime(newSecs);
            } else {
                item.reps = (item.reps || 10) + 2;
            }

            updated[index] = item;
            return updated;
        });
    };

    const handleDecrease = (index: number) => {
        setWorkoutItems(current => {
            const updated = [...current];
            const item = { ...updated[index] };

            if (item.duration) {
                const currentSecs = item.rawDuration || 60;
                const newSecs = Math.max(15, currentSecs - 15); // Min 15s
                item.rawDuration = newSecs;
                item.duration = formatTime(newSecs);
            } else {
                item.reps = Math.max(2, (item.reps || 10) - 2); // Min 2 reps
            }

            updated[index] = item;
            return updated;
        });
    };

    const handleRemove = (index: number) => {
        setWorkoutItems(current => current.filter((_, i) => i !== index));
    };

    const handleDragEnd = ({ data }: { data: WorkoutItem[] }) => {
        setWorkoutItems(data);
    };

    const renderItem = useCallback(({ item, drag, isActive, getIndex }: RenderItemParams<WorkoutItem>) => {
        const index = getIndex();
        if (index === undefined) return null;

        return (
            <WorkoutItemComponent
                item={item}
                drag={drag}
                isActive={isActive}
                onIncrease={() => handleIncrease(index)}
                onDecrease={() => handleDecrease(index)}
                onRemove={() => handleRemove(index)}
                colors={colors}
                primaryColor={selectedPalette.primary}
                isDarkMode={isDarkMode}
            />
        );
    }, [colors, selectedPalette.primary, isDarkMode]);

    if (!isVisible) return null;

    return (
        <Modal visible={isVisible} animationType="slide" transparent>
            <ThemeBackground style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <Ionicons name={step === 1 ? "close" : "arrow-back"} size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            {step === 1 ? "Create Routine" : "Build Workout"}
                        </Text>
                        <TouchableOpacity
                            onPress={handleNext}
                            disabled={!name || (step === 2 && workoutItems.length === 0)}
                            style={{ opacity: (!name || (step === 2 && workoutItems.length === 0)) ? 0.5 : 1 }}
                        >
                            <Text style={{ color: selectedPalette.primary, fontSize: 16, fontFamily: 'Outfit-Bold' }}>
                                {step === 1 ? "Next" : (saving ? "Saving..." : "Create")}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {step === 1 ? (
                        <View style={styles.form}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Routine Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g., Morning Blast"
                                placeholderTextColor={colors.textSecondary}
                            />

                            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>Category</Text>
                            <View style={styles.tags}>
                                {["Arms", "Legs", "Full Body", "Cardio", "Other"].map(c => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[
                                            styles.tag,
                                            { borderColor: category === c ? selectedPalette.primary : colors.border },
                                            category === c && { backgroundColor: selectedPalette.primary + '20' }
                                        ]}
                                        onPress={() => setCategory(c)}
                                    >
                                        <Text style={{ color: category === c ? selectedPalette.primary : colors.textSecondary, fontFamily: 'Outfit-Medium' }}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ) : (
                        <View style={{ flex: 1 }}>
                            <GestureHandlerRootView style={{ flex: 1 }}>
                                <DraggableFlatList
                                    data={workoutItems}
                                    onDragEnd={handleDragEnd}
                                    keyExtractor={(item) => item.id}
                                    renderItem={renderItem}
                                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                                    ListEmptyComponent={
                                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                                            <Ionicons name="barbell-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                                            <Text style={{ color: colors.textSecondary, marginTop: 16, fontFamily: 'Outfit-Medium' }}>
                                                Add exercises to start building your routine
                                            </Text>
                                        </View>
                                    }
                                    ListFooterComponent={
                                        <TouchableOpacity
                                            style={[styles.addExerciseButton, { borderColor: selectedPalette.primary, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)' }]}
                                            onPress={() => setAddModalVisible(true)}
                                        >
                                            <Ionicons name="add-circle" size={24} color={selectedPalette.primary} />
                                            <Text style={[styles.addExerciseText, { color: selectedPalette.primary }]}>
                                                Add Exercise to Routine
                                            </Text>
                                        </TouchableOpacity>
                                    }
                                />
                            </GestureHandlerRootView>
                        </View>
                    )}

                    {/* Reuse ReplaceExerciseModal for selection */}
                    <ReplaceExerciseModal
                        isVisible={isAddModalVisible}
                        onClose={() => setAddModalVisible(false)}
                        onSelect={handleAddExercise}
                        currentExerciseName="" // Empty since we are adding new
                    />
                </SafeAreaView>
            </ThemeBackground>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Outfit-Bold'
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    form: {
        padding: 20
    },
    label: {
        fontSize: 14,
        fontFamily: 'Outfit-Medium',
        marginBottom: 8
    },
    input: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: 'Outfit-Regular'
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10
    },
    tag: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    // Workout Item Styles
    workoutItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        marginBottom: 12,
        borderRadius: 16,
        elevation: 1,
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
        lineHeight: 22,
    },
    adjustmentContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    adjustButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    workoutMeta: {
        fontSize: 16,
        fontFamily: "Outfit-Bold",
        minWidth: 50,
        textAlign: "center",
    },
    removeButton: {
        padding: 8,
        marginLeft: 4,
    },
    // Add Button Styles
    addExerciseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginTop: 16,
        gap: 8,
    },
    addExerciseText: {
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
    }
});
