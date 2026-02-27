
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Switch,
    ActivityIndicator,
    Modal,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/theme";
import Animated, {
    SlideInUp,
    SlideOutDown,
    FadeIn,
    FadeOut,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../src/services/api";
import { supabase } from "../../src/lib/supabase";

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditProfileModal({
    visible,
    onClose,
    onSuccess,
}: EditProfileModalProps) {
    const { isDarkMode, selectedPalette } = useTheme();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [weight, setWeight] = useState("");
    const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
    const [goalWeight, setGoalWeight] = useState("");
    const [height, setHeight] = useState("");
    const [heightFt, setHeightFt] = useState("");
    const [heightIn, setHeightIn] = useState("");
    const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");

    const [fitnessGoal, setFitnessGoal] = useState<string | null>(null);
    const [fitnessLevel, setFitnessLevel] = useState<string | null>(null);
    const [workoutFrequency, setWorkoutFrequency] = useState<number>(4);
    const [gender, setGender] = useState<string | null>(null);

    const colors = {
        background: isDarkMode
            ? selectedPalette.dark.background
            : selectedPalette.light.background,
        surface: isDarkMode
            ? selectedPalette.dark.surface
            : selectedPalette.light.surface,
        surfaceSecondary: isDarkMode
            ? `${selectedPalette.primary}15`
            : `${selectedPalette.primary}10`,
        text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
        textSecondary: isDarkMode
            ? "rgba(255, 255, 255, 0.7)"
            : "rgba(0, 0, 0, 0.6)",
        border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        inputBackground: isDarkMode
            ? `${selectedPalette.primary}15`
            : `${selectedPalette.primary}10`,
    };

    useEffect(() => {
        if (visible) {
            loadProfileData();
        }
    }, [visible]);

    const loadProfileData = async () => {
        try {
            setLoading(true);
            // Force refresh to ensure we have the latest data from the server, 
            // bypassing any stale local cache (which caused initialization issues)
            const profileData = await api.getProfile(true);
            const profile = profileData.profile;

            if (profile) {
                if (profile.weight) setWeight(profile.weight.toString());
                if (profile.weight_unit) setWeightUnit(profile.weight_unit as "kg" | "lbs");

                if (profile.goal_weight) setGoalWeight(profile.goal_weight.toString());

                if (profile.height_unit) setHeightUnit(profile.height_unit as "cm" | "ft");

                if (profile.height) {
                    if (profile.height_unit === "ft") {
                        const h = profile.height;
                        // stored as CM, convert to ft/in
                        const totalInches = h / 2.54;
                        const ft = Math.floor(totalInches / 12);
                        const inch = Math.round(totalInches % 12);
                        setHeightFt(ft.toString());
                        setHeightIn(inch.toString());
                    } else {
                        setHeight(profile.height.toString());
                    }
                }

                if (profile.fitness_goal) setFitnessGoal(profile.fitness_goal);
                if (profile.fitness_level) setFitnessLevel(profile.fitness_level);
                if (profile.workout_frequency) setWorkoutFrequency(profile.workout_frequency);
                if (profile.gender) setGender(profile.gender);
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Calculate height in CM to save (if we want to normalize)
            // OR save as is if DB expects it.
            // Based on onboarding: "height: finalHeight" where finalHeight is calculated.
            // If unit is FT, it saves converted CM.
            // If unit is CM, it saves CM.
            // So we should save height in CM always? 
            // Let's conform to the existing pattern: save height and height_unit.

            let finalHeight = 0;
            if (heightUnit === "cm") {
                finalHeight = parseFloat(height || "0");
            } else {
                finalHeight = Math.round((parseInt(heightFt || "0") * 12 + parseInt(heightIn || "0")) * 2.54);
            }

            const updates: any = {
                weight: parseFloat(weight || "0"),
                weight_unit: weightUnit,
                goal_weight: parseFloat(goalWeight || "0"),
                height: finalHeight,
                height_unit: heightUnit,
                fitness_goal: fitnessGoal,
                fitness_level: fitnessLevel,
                workout_frequency: workoutFrequency,
                gender: gender,
            };

            await api.updateProfile(updates);

            // Refresh local cache/context if needed
            // (This might be handled by api or context)

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error saving profile:", error);
            // Show error handling UI/Toast ideally
        } finally {
            setSaving(false);
        }
    };

    const goals = [
        { id: "build_muscle", title: "Build Muscle" },
        { id: "lose_weight", title: "Lose Weight" },
        { id: "stay_active", title: "Keep Fit" },
        { id: "improve_endurance", title: "Get Stronger" }, // mapped from 'Get Stronger' to 'improve_endurance' or similar?
        // Checking fitness-goal.tsx: 
        // IDs: "Build Muscle", "Lose Weight", "Keep Fit", "Get Stronger" (Titles)
        // Onboarding saves: "build_muscle", "lose_weight", "improve_endurance", "stay_active"
        // Wait, fitness-goal.tsx line 23: build_muscle, lose_weight, improve_endurance, stay_active.
        // AND mapped from goals array... wait, `goals` array in fitness-goal.tsx has IDs "Build Muscle" ...
        // BUT `setSelectedGoal(goal.id as FitnessGoal)` in fitness-goal.tsx line 156.
        // And `goals` array (line 72) has IDs like "Build Muscle" (with space).
        // BUT the type FitnessGoal (line 22) uses snake_case.
        // This looks like a bug or mismatch in obtaining the ID in the original file, OR I misread it.
        // Looking at fitness-goal.tsx: 
        // goals = [{id: "Build Muscle"...}]
        // setSelectedGoal(goal.id as FitnessGoal) -- casting "Build Muscle" to "build_muscle"?
        // If the original code was blindly casting, it might be saving "Build Muscle" string.
        // Let's assume standard snake_case is INTENDED. I will use the values that seem correct for the backend enum if it exists.
        // Or I can just match the strings from the UI if the backend is flexible.
        // Let's stick to the visible titles for UI and snake_case for IDs if possible, or just string match.
        // "Build Muscle" -> "build_muscle"
    ];
    // Actually, to be safe, I should probably check what's IN the DB or use the display values.
    // I'll provide a mapping.

    const goalOptions = [
        { label: "Build Muscle", value: "Build Muscle" },
        { label: "Lose Weight", value: "Lose Weight" },
        { label: "Keep Fit", value: "Keep Fit" },
        { label: "Get Stronger", value: "Get Stronger" },
    ];

    const levelOptions = [
        { label: "Beginner", value: "Beginner" },
        { label: "Intermediate", value: "Intermediate" },
        { label: "Advanced", value: "Advanced" },
    ];


    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.overlayTouch} onPress={onClose} activeOpacity={1} />

                <View style={[styles.container, { backgroundColor: colors.surface }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={selectedPalette.primary} />
                        </View>
                    ) : (
                        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>

                            {/* Body Metrics */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Body Metrics</Text>

                                {/* Weight */}
                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.label, { color: colors.text }]}>Weight</Text>
                                        <View style={styles.inputRow}>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, flex: 1 }]}
                                                value={weight}
                                                onChangeText={setWeight}
                                                keyboardType="numeric"
                                                placeholder="0"
                                                placeholderTextColor={colors.textSecondary}
                                            />
                                            <TouchableOpacity
                                                style={[styles.unitToggle, { backgroundColor: colors.surfaceSecondary }]}
                                                onPress={() => setWeightUnit(prev => prev === 'kg' ? 'lbs' : 'kg')}
                                            >
                                                <Text style={[styles.unitText, { color: selectedPalette.primary }]}>{weightUnit}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                {/* Goal Weight */}
                                <View style={[styles.row, { marginTop: 16 }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.label, { color: colors.text }]}>Goal Weight</Text>
                                        <View style={styles.inputRow}>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, flex: 1 }]}
                                                value={goalWeight}
                                                onChangeText={setGoalWeight}
                                                keyboardType="numeric"
                                                placeholder="0"
                                                placeholderTextColor={colors.textSecondary}
                                            />
                                            <View style={[styles.unitToggle, { backgroundColor: colors.surfaceSecondary, opacity: 0.7 }]}>
                                                <Text style={[styles.unitText, { color: selectedPalette.primary }]}>{weightUnit}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Height */}
                                <View style={[styles.row, { marginTop: 16 }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.label, { color: colors.text }]}>Height</Text>
                                        <View style={styles.inputRow}>
                                            {heightUnit === 'cm' ? (
                                                <TextInput
                                                    style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, flex: 1 }]}
                                                    value={height}
                                                    onChangeText={setHeight}
                                                    keyboardType="numeric"
                                                    placeholder="0"
                                                    placeholderTextColor={colors.textSecondary}
                                                />
                                            ) : (
                                                <View style={{ flex: 1, flexDirection: 'row', gap: 10 }}>
                                                    <TextInput
                                                        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, flex: 1 }]}
                                                        value={heightFt}
                                                        onChangeText={setHeightFt}
                                                        keyboardType="numeric"
                                                        placeholder="ft"
                                                        placeholderTextColor={colors.textSecondary}
                                                    />
                                                    <TextInput
                                                        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, flex: 1 }]}
                                                        value={heightIn}
                                                        onChangeText={setHeightIn}
                                                        keyboardType="numeric"
                                                        placeholder="in"
                                                        placeholderTextColor={colors.textSecondary}
                                                    />
                                                </View>
                                            )}
                                            <TouchableOpacity
                                                style={[styles.unitToggle, { backgroundColor: colors.surfaceSecondary }]}
                                                onPress={() => setHeightUnit(prev => prev === 'cm' ? 'ft' : 'cm')}
                                            >
                                                <Text style={[styles.unitText, { color: selectedPalette.primary }]}>{heightUnit}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={[styles.divider, { backgroundColor: colors.border }]} />

                            {/* Fitness Profile */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Fitness Profile</Text>

                                {/* Gender */}
                                <Text style={[styles.label, { color: colors.text, marginTop: 8 }]}>Gender</Text>
                                <View style={styles.chipsContainer}>
                                    {['Male', 'Female', 'Other'].map((g) => (
                                        <TouchableOpacity
                                            key={g}
                                            style={[
                                                styles.chip,
                                                { backgroundColor: gender === g ? selectedPalette.primary : colors.surfaceSecondary }
                                            ]}
                                            onPress={() => setGender(g)}
                                        >
                                            <Text style={[
                                                styles.chipText,
                                                { color: gender === g ? '#FFF' : colors.text }
                                            ]}>{g}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Goal */}
                                <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Main Goal</Text>
                                <View style={styles.chipsContainer}>
                                    {goalOptions.map((opt) => (
                                        <TouchableOpacity
                                            key={opt.value}
                                            style={[
                                                styles.chip,
                                                { backgroundColor: fitnessGoal === opt.value ? selectedPalette.primary : colors.surfaceSecondary }
                                            ]}
                                            onPress={() => setFitnessGoal(opt.value)}
                                        >
                                            <Text style={[
                                                styles.chipText,
                                                { color: fitnessGoal === opt.value ? '#FFF' : colors.text }
                                            ]}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Level */}
                                <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Fitness Level</Text>
                                <View style={styles.chipsContainer}>
                                    {levelOptions.map((opt) => (
                                        <TouchableOpacity
                                            key={opt.value}
                                            style={[
                                                styles.chip,
                                                { backgroundColor: fitnessLevel === opt.value ? selectedPalette.primary : colors.surfaceSecondary }
                                            ]}
                                            onPress={() => setFitnessLevel(opt.value)}
                                        >
                                            <Text style={[
                                                styles.chipText,
                                                { color: fitnessLevel === opt.value ? '#FFF' : colors.text }
                                            ]}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Frequency */}
                                <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Workouts per Week</Text>
                                <View style={styles.frequencyContainer}>
                                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                        <TouchableOpacity
                                            key={num}
                                            style={[
                                                styles.freqApi,
                                                {
                                                    backgroundColor: workoutFrequency === num ? selectedPalette.primary : colors.surfaceSecondary,
                                                    borderColor: workoutFrequency === num ? selectedPalette.primary : 'transparent',
                                                }
                                            ]}
                                            onPress={() => setWorkoutFrequency(num)}
                                        >
                                            <Text style={[
                                                styles.freqText,
                                                { color: workoutFrequency === num ? '#FFF' : colors.text }
                                            ]}>{num}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                        </ScrollView>
                    )}

                    <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: selectedPalette.primary }]}
                            onPress={handleSave}
                            disabled={saving || loading}
                        >
                            {saving ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    overlayTouch: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        height: "90%",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 20,
        fontFamily: "Outfit-Bold",
    },
    closeButton: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: "Outfit-SemiBold",
        marginBottom: 16,
        textTransform: "uppercase",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    label: {
        fontSize: 16,
        fontFamily: "Outfit-Medium",
        marginBottom: 8,
    },
    inputRow: {
        flexDirection: "row",
        gap: 12,
    },
    input: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 18,
        fontFamily: "Outfit-Medium",
    },
    unitToggle: {
        width: 60,
        height: 50,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    unitText: {
        fontSize: 16,
        fontFamily: "Outfit-Bold",
    },
    divider: {
        height: 1,
        width: "100%",
    },
    chipsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    chipText: {
        fontSize: 14,
        fontFamily: "Outfit-Medium",
    },
    frequencyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    freqApi: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    freqText: {
        fontSize: 16,
        fontFamily: "Outfit-Bold",
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
    saveButton: {
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
    },
    saveButtonText: {
        color: "white",
        fontSize: 18,
        fontFamily: "Outfit-Bold",
    },
});
