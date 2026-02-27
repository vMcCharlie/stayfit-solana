import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
} from "react-native";
import { useTheme } from "../../src/context/theme";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";

import { getBodyFocusIcon } from "../../src/assets/icons/body_focus_area";
import { useAuth } from "../../src/context/auth";

export interface FilterOptions {
    focusArea: string[];
    difficulty: string[];
    type: string[];
    equipment: string[];
}

interface ExerciseFilterModalProps {
    isVisible: boolean;
    onClose: () => void;
    onApply: (filters: FilterOptions) => void;
    initialFilters: FilterOptions;
    exerciseCount?: number;
}

const FOCUS_AREAS = [
    { name: "Abs" },
    { name: "Chest" },
    { name: "Back" },
    { name: "Arm" },
    { name: "Leg" },
    { name: "Glutes" },
    { name: "Shoulder" },
];

const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];
const EXERCISE_TYPES = ["Warm up", "Stretch", "Training"]; // Mapped to 'reps'/'duration' or handled via logic? 'Training' might be generalized.
const EQUIPMENT_TYPES = [
    "No equipment",
    "Dumbbell",
    "Band",
    "Chair",
    "Bench",
    "Mat",
    "Barbell",
    "Pull-up bar"
];

// Fallback for missing images
// We'll use a simple icon mapping for now since we don't know if assets exist
const BodyPartIcon = ({ name, selected, isDarkMode, gender }: { name: string, selected: boolean, isDarkMode: boolean, gender: any }) => {
    const iconSource = getBodyFocusIcon(gender, name, isDarkMode);

    return (
        <View style={[styles.bodyPartImageContainer, selected && styles.bodyPartImageSelected]}>
            <Image
                source={iconSource}
                style={styles.bodyPartImage}
                resizeMode="contain"
            />
        </View>
    )
}

export default function ExerciseFilterModal({
    isVisible,
    onClose,
    onApply,
    initialFilters,
    exerciseCount,
}: ExerciseFilterModalProps) {
    const { isDarkMode, selectedPalette } = useTheme();
    const { user } = useAuth();
    // Start with a default, but try to get from user metadata if possible
    // The user object from supabase might not have the gender directly on it if it's in a slightly different shape
    // or inside user_metadata.
    const gender = user?.user_metadata?.gender || user?.user_metadata?.onboarding_data?.gender || "Male";

    const [filters, setFilters] = useState<FilterOptions>(initialFilters);

    const colors = {
        background: isDarkMode
            ? selectedPalette.dark.background
            : selectedPalette.light.background,
        surface: isDarkMode
            ? selectedPalette.dark.surface
            : selectedPalette.light.surface,
        text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
        textSecondary: isDarkMode
            ? "rgba(255, 255, 255, 0.6)"
            : "rgba(0, 0, 0, 0.5)",
        border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        primary: selectedPalette.primary,
    };

    const toggleFilter = (category: keyof FilterOptions, value: string) => {
        setFilters((prev) => {
            const current = prev[category];
            const exists = current.includes(value);
            if (exists) {
                return {
                    ...prev,
                    [category]: current.filter((item) => item !== value),
                };
            } else {
                return {
                    ...prev,
                    [category]: [...current, value],
                };
            }
        });
    };

    const clearFilter = (category: keyof FilterOptions, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [category]: prev[category].filter((item) => item !== value),
        }));
    }

    const handleApply = () => {
        // Map UI filters to Database values
        const mappedFilters: FilterOptions = {
            focusArea: filters.focusArea.flatMap(area => {
                switch (area) {
                    case "Arm": return ["Biceps", "Triceps", "Forearms"];
                    case "Leg": return ["Quads", "Hamstrings", "Calves", "Glutes"];
                    case "Shoulder": return ["Shoulders"]; // Plural in DB
                    case "Abs": return ["Abs", "Core", "core", "Obliques"]; // Handle mixed case
                    case "Back": return ["Back", "Traps", "Lats", "Lower Back"];
                    case "Chest": return ["Chest", "Pec"];
                    default: return [area];
                }
            }),
            difficulty: filters.difficulty, // DB doesn't have difficulty column yet, but passing for future
            type: filters.type.flatMap(t => {
                switch (t) {
                    case "Training": return ["Strength", "strength", "Plyometric", "Training"]; // Cover all known variations
                    case "Warm up": return ["Warmup", "warmup", "Warm up"];
                    case "Stretch": return ["Stretch", "stretch", "Flexibility"];
                    default: return [t, t.toLowerCase()];
                }
            }),
            equipment: filters.equipment.flatMap(e => {
                if (e.toLowerCase() === "no equipment") return ["none", "No equipment", "None"];
                return [e, e.toLowerCase()];
            })
        };

        onApply(mappedFilters);
        onClose();
    };

    const handleClearAll = () => {
        setFilters({
            focusArea: [],
            difficulty: [],
            type: [],
            equipment: []
        });
    }

    const renderSectionHeader = (title: string) => (
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    );

    const renderChip = (
        label: string,
        category: keyof FilterOptions,
        value: string
    ) => {
        const isSelected = filters[category].includes(value);
        return (
            <TouchableOpacity
                style={[
                    styles.chip,
                    {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: 1,
                    },
                ]}
                onPress={() => toggleFilter(category, value)}
            >
                <Text
                    style={[
                        styles.chipText,
                        { color: isSelected ? "#FFFFFF" : colors.text },
                    ]}
                >
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderBodyPart = (name: string) => {
        const isSelected = filters.focusArea.includes(name);
        return (
            <TouchableOpacity
                style={[
                    styles.bodyPartCard,
                    {
                        backgroundColor: colors.surface,
                        borderColor: isSelected ? colors.primary : "transparent",
                        borderWidth: 2
                    }
                ]}
                onPress={() => toggleFilter("focusArea", name)}
            >
                {/* Placeholder for body part image */}
                <BodyPartIcon name={name} selected={isSelected} isDarkMode={isDarkMode} gender={gender} />
                <Text style={[styles.bodyPartText, { color: colors.text, fontWeight: isSelected ? 'bold' : 'normal' }]}>{name}</Text>
            </TouchableOpacity>
        );
    };

    // Render top active filters
    const activeFiltersCount = Object.values(filters).reduce((acc, curr) => acc + curr.length, 0);

    return (
        <Modal
            isVisible={isVisible}
            onBackdropPress={onClose}
            onSwipeComplete={onClose}
            swipeDirection="down"
            style={styles.modal}
            propagateSwipe
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTitleRow}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Filtered</Text>
                        {activeFiltersCount > 0 && (
                            <TouchableOpacity onPress={handleClearAll}>
                                <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={[styles.countText, { color: colors.primary }]}>{exerciseCount || 0} exercises</Text>
                    </View>
                </View>

                {/* Active Filters Row (Wrapping) */}
                {activeFiltersCount > 0 && (
                    <View style={styles.selectedFiltersContainer}>
                        {filters.focusArea.map(f => (
                            <TouchableOpacity key={f} onPress={() => clearFilter("focusArea", f)} style={styles.activeFilterChip}>
                                <Text style={styles.activeFilterText}>{f}</Text>
                                <Ionicons name="close-circle" size={16} color="#aaa" />
                            </TouchableOpacity>
                        ))}
                        {filters.difficulty.map(f => (
                            <TouchableOpacity key={f} onPress={() => clearFilter("difficulty", f)} style={styles.activeFilterChip}>
                                <Text style={styles.activeFilterText}>{f}</Text>
                                <Ionicons name="close-circle" size={16} color="#aaa" />
                            </TouchableOpacity>
                        ))}
                        {filters.type?.map(f => (
                            <TouchableOpacity key={f} onPress={() => clearFilter("type", f)} style={styles.activeFilterChip}>
                                <Text style={styles.activeFilterText}>{f}</Text>
                                <Ionicons name="close-circle" size={16} color="#aaa" />
                            </TouchableOpacity>
                        ))}
                        {filters.equipment?.map(f => (
                            <TouchableOpacity key={f} onPress={() => clearFilter("equipment", f)} style={styles.activeFilterChip}>
                                <Text style={styles.activeFilterText}>{f}</Text>
                                <Ionicons name="close-circle" size={16} color="#aaa" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}


                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Focus Area Grid */}
                    <View style={styles.section}>
                        {renderSectionHeader("Focus Area")}
                        <View style={styles.grid}>
                            {FOCUS_AREAS.map((area) => (
                                <View key={area.name} style={styles.gridItem}>
                                    {renderBodyPart(area.name)}
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Difficulty */}
                    <View style={styles.section}>
                        {renderSectionHeader("Difficulty")}
                        <View style={styles.chipRow}>
                            {DIFFICULTY_LEVELS.map((level) => (
                                <React.Fragment key={level}>
                                    {renderChip(level, "difficulty", level)}
                                </React.Fragment>
                            ))}
                        </View>
                    </View>

                    {/* Type */}
                    <View style={styles.section}>
                        {renderSectionHeader("Type")}
                        <View style={styles.chipRow}>
                            {EXERCISE_TYPES.map((type) => (
                                <React.Fragment key={type}>
                                    {renderChip(type, "type", type)}
                                </React.Fragment>
                            ))}
                        </View>
                    </View>

                    {/* Equipment */}
                    <View style={styles.section}>
                        {renderSectionHeader("Equipment")}
                        <View style={styles.chipRow}>
                            {EQUIPMENT_TYPES.map((eq) => (
                                <React.Fragment key={eq}>
                                    {renderChip(eq, "equipment", eq.toLowerCase())}
                                </React.Fragment>
                            ))}
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Footer Buttons */}
                <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                    <TouchableOpacity style={[styles.footerButton, styles.cancelButton, { borderColor: colors.border }]} onPress={onClose}>
                        <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.footerButton, styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleApply}>
                        <Text style={[styles.buttonText, { color: "#FFF" }]}>Save</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modal: {
        justifyContent: "flex-end",
        margin: 0,
    },
    container: {
        height: "85%",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: "Outfit-Bold",
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    countText: {
        fontSize: 16,
        fontFamily: "Outfit-Medium",
    },
    content: {
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: "Outfit-Bold",
        marginBottom: 12,
    },
    chipRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    chipText: {
        fontSize: 14,
        fontFamily: "Outfit-Medium",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    gridItem: {
        width: '48%',
        marginBottom: 10
    },
    bodyPartCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 12
    },
    bodyPartImageContainer: {
        width: 40,
        height: 40,
        // backgroundColor: '#ccc', // fallback
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    bodyPartImageSelected: {
        // backgroundColor: 'rgba(255,255,255,0.2)'
    },
    bodyPartImage: {
        width: '100%',
        height: '100%',
    },
    bodyPartText: {
        fontSize: 16,
        fontFamily: "Outfit-Medium",
    },
    activeFiltersScroll: {
        maxHeight: 50,
        marginBottom: 10,
    },
    selectedFiltersContainer: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 8,
    },
    selectedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    activeFilterText: {
        fontSize: 14,
        fontFamily: "Outfit-Regular",
        color: "#333"
    },
    activeFiltersContent: {
        paddingHorizontal: 20,
        gap: 8
    },
    activeFilterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        gap: 16
    },
    footerButton: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        borderWidth: 1,
    },
    saveButton: {},
    buttonText: {
        fontSize: 16,
        fontFamily: "Outfit-Bold"
    }
});
