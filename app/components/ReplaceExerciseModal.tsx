import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    ActivityIndicator,
} from "react-native";
import { useTheme } from "../../src/context/theme";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import { supabase } from "../../src/lib/supabase";
import ExerciseFilterModal, { FilterOptions } from "./ExerciseFilterModal";
import AnimatedExerciseImage from "./AnimatedExerciseImage";
import ExerciseImage from "./ExerciseImage";

interface ReplaceExerciseModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSelect: (exercise: any) => void;
    currentExerciseName: string;
}

export default function ReplaceExerciseModal({
    isVisible,
    onClose,
    onSelect,
    currentExerciseName,
}: ReplaceExerciseModalProps) {
    const { isDarkMode, selectedPalette } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFilterVisible, setIsFilterVisible] = useState(false);

    const [filters, setFilters] = useState<FilterOptions>({
        focusArea: [],
        difficulty: [],
        type: [],
        equipment: []
    });

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
        inputBackground: isDarkMode ? "#2A2A2A" : "#F5F5F5",
    };

    const fetchExercises = async () => {
        setLoading(true);
        try {
            // Direct client-side query since Edge Function deployment is unstable
            // RLS permits public reading of exercises
            const { data: allExercises, error } = await supabase
                .from("exercises")
                .select(`
                    id,
                    name,
                    image_url_male,
                    image_url_female,
                    gif_url,
                    exercise_type,
                    place,
                    equipments,
                    exercise_focus_areas (
                        area,
                        weightage
                    ),
                    exercise_mistakes (
                        title,
                        subtitle
                    ),
                    exercise_tips (
                        tip
                    ),
                    exercise_animations (
                        gender,
                        frame_urls,
                        frame_count
                    )
                `);

            if (error) {
                console.error("Error fetching exercises:", error);
                throw error;
            }

            let filtered = allExercises || [];

            // Robust Search: Normalize text (remove non-alphanumeric)
            if (searchQuery && searchQuery.trim() !== "") {
                const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
                const query = normalize(searchQuery);

                filtered = filtered.filter((ex: any) =>
                    normalize(ex.name).includes(query)
                );
            }

            // Client-side Filtering
            if (filters) {
                if (filters.focusArea && filters.focusArea.length > 0) {
                    filtered = filtered.filter((ex: any) => {
                        if (!ex.exercise_focus_areas) return false;
                        return ex.exercise_focus_areas.some((fa: any) =>
                            filters.focusArea.includes(fa.area)
                        );
                    });
                }
                if (filters.equipment && filters.equipment.length > 0) {
                    filtered = filtered.filter((ex: any) => {
                        if (!ex.equipments) return false;
                        return ex.equipments.some((eq: string) =>
                            filters.equipment.includes(eq)
                        );
                    });
                }
                if (filters.type && filters.type.length > 0) {
                    filtered = filtered.filter((ex: any) =>
                        filters.type.includes(ex.exercise_type)
                    );
                }
            }

            setResults(filtered);

        } catch (err) {
            console.error("Unexpected error fetching exercises:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isVisible) {
            fetchExercises();
        }
    }, [isVisible, searchQuery, filters]);

    const handleFilterApply = (newFilters: FilterOptions) => {
        setFilters(newFilters);
    };

    // Helper to count active filters
    const activeFilterCount = Object.values(filters).flat().length;

    const renderExerciseItem = ({ item }: { item: any }) => {
        // Get animation frames for the user's gender (default to male)
        const maleFrames = item.exercise_animations?.find((anim: any) => anim.gender === 'male')?.frame_urls || [];
        const femaleFrames = item.exercise_animations?.find((anim: any) => anim.gender === 'female')?.frame_urls || [];
        const frameUrls = maleFrames.length > 0 ? maleFrames : femaleFrames;

        // Get static image URL if no animation frames available
        const staticImageUrl = item.image_url_male || item.image_url_female || item.gif_url;

        return (
            <TouchableOpacity
                style={styles.exerciseItem}
                onPress={() => onSelect(item)}
            >
                {frameUrls.length > 0 ? (
                    <AnimatedExerciseImage
                        frameUrls={frameUrls}
                        size={60}
                        backgroundColor={isDarkMode ? '#2A2A2A' : '#F5F5F5'}
                    />
                ) : (
                    <ExerciseImage
                        uri={staticImageUrl}
                        width={60}
                        height={60}
                        borderRadius={12}
                        backgroundColor={isDarkMode ? '#2A2A2A' : '#F5F5F5'}
                        showLoadingIndicator={true}
                    />
                )}
                <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                        {item.name}
                    </Text>
                    <View style={styles.exerciseTags}>
                        {/* Simple tags */}
                        {item.exercise_type && (
                            <View style={[styles.tag, { backgroundColor: colors.surface }]}>
                                <Text style={[styles.tagText, { color: colors.textSecondary }]}>{item.exercise_type}</Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={styles.radioButton}>
                    {/* Unselected state circle */}
                    <View style={[styles.circle, { borderColor: colors.border }]} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            isVisible={isVisible}
            style={styles.modal}
            useNativeDriver
            hideModalContentWhileAnimating
            onBackButtonPress={onClose}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        {currentExerciseName ? (
                            <>
                                <View style={styles.currentExerciseRow}>
                                    <Ionicons name="person" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                                    <Text style={[styles.currentLabel, { color: colors.textSecondary }]}>Current: {currentExerciseName}</Text>
                                </View>
                                <Text style={[styles.title, { color: colors.text }]}>Replace it with...</Text>
                            </>
                        ) : (
                            <Text style={[styles.title, { color: colors.text, marginTop: 10 }]}>Add Exercise</Text>
                        )}
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Filters & Search */}
                <View style={styles.filterSection}>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            { backgroundColor: activeFilterCount > 0 ? selectedPalette.primary : colors.border },
                            activeFilterCount > 0 && { borderWidth: 0 }
                        ]}
                        onPress={() => setIsFilterVisible(true)}
                    >
                        <Ionicons name="filter" size={20} color={activeFilterCount > 0 ? "#FFF" : colors.text} />
                        {activeFilterCount > 0 ? (
                            <Text style={{ color: "#FFF", fontWeight: 'bold' }}>Filtered ({results.length})</Text>
                        ) : (
                            <Text style={{ color: colors.text }}>All Areas ({results.length})</Text>
                        )}
                    </TouchableOpacity>

                    {/* Chip Row for quick Access (mocked for now, or use active filters) */}
                </View>

                <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground }]}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        placeholder="Search exercises"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.searchInput, { color: colors.text }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* List */}
                <Text style={[styles.sectionTitle, { color: selectedPalette.primary }]}>Recommended</Text>

                {loading ? (
                    <ActivityIndicator size="large" color={selectedPalette.primary} style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={results}
                        renderItem={renderExerciseItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                    />
                )}

                <ExerciseFilterModal
                    isVisible={isFilterVisible}
                    onClose={() => setIsFilterVisible(false)}
                    onApply={handleFilterApply}
                    initialFilters={filters}
                    exerciseCount={results.length}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modal: {
        margin: 0,
        justifyContent: "flex-end",
    },
    container: {
        height: "90%",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    currentExerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4
    },
    currentLabel: {
        fontSize: 14,
        fontFamily: "Outfit-Regular",
    },
    title: {
        fontSize: 24,
        fontFamily: "Outfit-Bold",
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterSection: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'center',
        gap: 12
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 50,
        borderRadius: 25,
        marginBottom: 20
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: "Outfit-Regular",
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: "Outfit-Bold",
        marginBottom: 10
    },
    listContent: {
        paddingBottom: 40
    },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    exerciseImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#ccc'
    },
    exerciseInfo: {
        flex: 1,
        marginLeft: 16
    },
    exerciseName: {
        fontSize: 16,
        fontFamily: "Outfit-Bold",
        marginBottom: 4
    },
    exerciseTags: {
        flexDirection: 'row'
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4
    },
    tagText: {
        fontSize: 12,
        fontFamily: "Outfit-Regular",
    },
    radioButton: {
        padding: 10
    },
    circle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2
    }
});
