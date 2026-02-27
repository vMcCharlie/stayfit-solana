import React, { useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from "react-native";
import Modal from "react-native-modal";
import { useTheme } from "../../src/context/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

interface ExerciseInfoModalProps {
    isVisible: boolean;
    onClose: () => void;
    exercise: any; // Using any for flexibility based on the various shapes exercise data comes in
}

export default function ExerciseInfoModal({
    isVisible,
    onClose,
    exercise,
}: ExerciseInfoModalProps) {
    const { isDarkMode, selectedPalette } = useTheme();
    const scrollViewRef = useRef<ScrollView>(null);
    const [scrollOffset, setScrollOffset] = useState(0);

    if (!exercise) return null;

    const colors = {
        background: isDarkMode ? "#1A1A1A" : "#FFFFFF",
        surface: isDarkMode ? "#2A2A2A" : "#F5F5F5",
        text: isDarkMode ? "#FFFFFF" : "#000000",
        textSecondary: isDarkMode
            ? "rgba(255, 255, 255, 0.7)"
            : "rgba(0, 0, 0, 0.6)",
        primary: selectedPalette.primary,
        border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        error: "#FF4B4B",
        warning: "#FFB020",
        success: "#4CAF50",
    };

    // Safely extract data arrays
    const focusAreas = Array.isArray(exercise.focusAreas)
        ? exercise.focusAreas
        : [];
    const mistakes = Array.isArray(exercise.mistakes) ? exercise.mistakes : [];
    const tips = Array.isArray(exercise.tips) ? exercise.tips : [];
    const instructions = exercise.instructions || "";

    const handleOnScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        setScrollOffset(event.nativeEvent.contentOffset.y);
    };

    const handleScrollTo = (p: { x?: number; y?: number; animated?: boolean }) => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo(p);
        }
    };

    return (
        <Modal
            isVisible={isVisible}
            onBackdropPress={onClose}
            onBackButtonPress={onClose}
            onSwipeComplete={onClose}
            swipeDirection={["down"]}
            style={styles.modal}
            propagateSwipe={true}
            scrollTo={handleScrollTo}
            scrollOffset={scrollOffset}
            scrollOffsetMax={400} // Adjust based on content height - prevents swipe when scrolled
            backdropOpacity={0.6}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Handle Bar */}
                <View style={styles.handleContainer}>
                    <View style={[styles.handle, { backgroundColor: colors.border }]} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {exercise.name || "Exercise Info"}
                    </Text>
                    <TouchableOpacity
                        onPress={onClose}
                        style={[styles.closeButton, { backgroundColor: colors.surface }]}
                    >
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    ref={scrollViewRef}
                    onScroll={handleOnScroll}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Focus Areas */}
                    {focusAreas.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Focus Areas
                            </Text>
                            <View style={styles.tagsContainer}>
                                {focusAreas.map((area: any, index: number) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.tag,
                                            {
                                                backgroundColor: colors.surface,
                                                borderColor: colors.border,
                                            },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name="target"
                                            size={16}
                                            color={colors.primary}
                                        />
                                        <Text style={[styles.tagText, { color: colors.text }]}>
                                            {area.area || area.name}
                                        </Text>
                                        {area.intensity && (
                                            <View
                                                style={[
                                                    styles.intensityDot,
                                                    {
                                                        backgroundColor:
                                                            area.intensity > 0.7
                                                                ? colors.error
                                                                : area.intensity > 0.4
                                                                    ? colors.warning
                                                                    : colors.success,
                                                    },
                                                ]}
                                            />
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Instructions */}
                    {instructions ? (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Instructions
                            </Text>
                            <View
                                style={[styles.card, { backgroundColor: colors.surface }]}
                            >
                                <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                                    {instructions}
                                </Text>
                            </View>
                        </View>
                    ) : null}

                    {/* Common Mistakes */}
                    {mistakes.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Common Mistakes
                            </Text>
                            <View
                                style={[
                                    styles.card,
                                    { backgroundColor: "rgba(255, 75, 75, 0.1)" },
                                ]}
                            >
                                {mistakes.map((mistake: string, index: number) => (
                                    <View key={index} style={styles.listItem}>
                                        <Ionicons
                                            name="alert-circle-outline"
                                            size={20}
                                            color={colors.error}
                                            style={styles.listIcon}
                                        />
                                        <Text style={[styles.bodyText, { color: colors.text }]}>
                                            {mistake}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Pro Tips */}
                    {tips.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Pro Tips
                            </Text>
                            <View
                                style={[
                                    styles.card,
                                    { backgroundColor: "rgba(255, 176, 32, 0.1)" },
                                ]}
                            >
                                {tips.map((tip: string, index: number) => (
                                    <View key={index} style={styles.listItem}>
                                        <Ionicons
                                            name="bulb-outline"
                                            size={20}
                                            color={colors.warning}
                                            style={styles.listIcon}
                                        />
                                        <Text style={[styles.bodyText, { color: colors.text }]}>
                                            {tip}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={styles.bottomSpacer} />
                </ScrollView>
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
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: "85%",
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    handleContainer: {
        alignItems: "center",
        paddingVertical: 10,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        marginTop: 10,
    },
    title: {
        fontSize: 24,
        fontFamily: "Outfit-Bold",
        flex: 1,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    scrollContent: {
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: "Outfit-Bold",
        marginBottom: 12,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    tag: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        gap: 6,
    },
    tagText: {
        fontSize: 14,
        fontFamily: "Outfit-Medium",
    },
    intensityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        gap: 12,
    },
    bodyText: {
        fontSize: 16,
        fontFamily: "Outfit-Regular",
        lineHeight: 24,
        flex: 1,
    },
    listItem: {
        flexDirection: "row",
        gap: 12,
        alignItems: "flex-start",
    },
    listIcon: {
        marginTop: 2,
    },
    bottomSpacer: {
        height: 40,
    },
});
