import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    Platform,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { updateOnboardingStep } from "../../src/lib/onboarding";
import { useTheme } from "../../src/context/theme";

export default function BodyMetricsScreen() {
    const router = useRouter();
    const { isDarkMode, selectedPalette } = useTheme();
    const insets = useSafeAreaInsets();

    // State for units
    const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
    const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg");

    // State for values
    const [heightCm, setHeightCm] = useState("");
    const [heightFt, setHeightFt] = useState("");
    const [heightIn, setHeightIn] = useState("");

    const [weight, setWeight] = useState("");
    const [goalWeight, setGoalWeight] = useState("");

    const [loading, setLoading] = useState(false);

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
        surfaceSecondary: isDarkMode
            ? `${selectedPalette.primary}15`
            : `${selectedPalette.primary}10`,
        border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        inputBackground: isDarkMode ? "rgba(255,255,255,0.05)" : "#F5F5F5",
    };

    const handleBack = () => {
        router.back();
    };

    const handleNext = async () => {
        try {
            setLoading(true);

            // Calculate final metric values
            let finalHeight = 0;
            if (heightUnit === "cm") {
                finalHeight = parseFloat(heightCm);
            } else {
                finalHeight = Math.round((parseInt(heightFt || "0") * 12 + parseInt(heightIn || "0")) * 2.54);
            }

            const finalWeight = parseFloat(weight);
            const finalGoalWeight = parseFloat(goalWeight);

            // Validate
            if (!finalHeight || !finalWeight || !finalGoalWeight) {
                // In a real app we'd show a toast/alert, but button is disabled if empty anyway
                return;
            }

            await updateOnboardingStep("body-metrics", {
                height: finalHeight,
                height_unit: heightUnit,
                weight: finalWeight,
                weight_unit: weightUnit,
                goal_weight: finalGoalWeight,
                goal_weight_unit: weightUnit,
            });

            router.push("/onboarding/wallet");
        } catch (error) {
            console.error("Error saving body metrics:", error);
        } finally {
            setLoading(false);
        }
    };

    // Switch Weight Unit (converts values)
    const toggleWeightUnit = () => {
        const newUnit = weightUnit === "kg" ? "lb" : "kg";
        setWeightUnit(newUnit);

        // Optional: Convert existing values when switching
        // if (weight) {
        //   const w = parseFloat(weight);
        //   setWeight(newUnit === "lb" ? (w * 2.20462).toFixed(1) : (w / 2.20462).toFixed(1));
        // }
        // if (goalWeight) {
        //   const g = parseFloat(goalWeight);
        //   setGoalWeight(newUnit === "lb" ? (g * 2.20462).toFixed(1) : (g / 2.20462).toFixed(1));
        // }
    };

    const isFormValid = () => {
        const isHeightValid = heightUnit === "cm" ? !!heightCm : (!!heightFt && heightIn !== "");
        return isHeightValid && !!weight && !!goalWeight;
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar style={isDarkMode ? "light" : "dark"} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                >
                    <View style={[styles.content, { backgroundColor: colors.background }]}>

                        {/* Top Navigation Bar */}
                        <Animated.View entering={FadeIn.duration(300)} style={styles.topSection}>
                            {/* Section Title */}
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>You</Text>

                            {/* Segmented Progress Bar */}
                            <View style={styles.progressSegments}>
                                <View style={[styles.segment, styles.segmentSmall, { backgroundColor: selectedPalette.primary }]} />
                                <View style={[styles.segment, styles.segmentLarge, { backgroundColor: selectedPalette.primary }]} />
                                <View style={[styles.segment, styles.segmentMedium, { backgroundColor: selectedPalette.primary }]} />
                                <View style={[styles.segment, styles.segmentMedium, { backgroundColor: selectedPalette.primary, opacity: 0.5 }]} />
                                <View style={[styles.segment, styles.segmentSmall, { backgroundColor: colors.surfaceSecondary }]} />
                            </View>
                        </Animated.View>

                        <ScrollView
                            style={styles.scrollView}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollViewContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Page Heading */}
                            <Text style={[styles.pageHeading, { color: colors.text }]}>Just a few more questions</Text>

                            <Animated.View entering={FadeInDown.duration(400).delay(150)}>

                                {/* Height Section */}
                                <View style={styles.section}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>How tall are you?</Text>
                                    <View style={styles.row}>
                                        {heightUnit === "cm" ? (
                                            <TextInput
                                                style={[styles.input, {
                                                    flex: 1,
                                                    backgroundColor: colors.inputBackground,
                                                    color: colors.text,
                                                    borderColor: colors.border
                                                }]}
                                                placeholder="0"
                                                placeholderTextColor={colors.textSecondary}
                                                keyboardType="numeric"
                                                value={heightCm}
                                                onChangeText={setHeightCm}
                                                maxLength={3}
                                            />
                                        ) : (
                                            <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
                                                <TextInput
                                                    style={[styles.input, {
                                                        flex: 1,
                                                        backgroundColor: colors.inputBackground,
                                                        color: colors.text,
                                                        borderColor: colors.border
                                                    }]}
                                                    placeholder="Ft"
                                                    placeholderTextColor={colors.textSecondary}
                                                    keyboardType="numeric"
                                                    value={heightFt}
                                                    onChangeText={setHeightFt}
                                                    maxLength={1}
                                                />
                                                <TextInput
                                                    style={[styles.input, {
                                                        flex: 1,
                                                        backgroundColor: colors.inputBackground,
                                                        color: colors.text,
                                                        borderColor: colors.border
                                                    }]}
                                                    placeholder="In"
                                                    placeholderTextColor={colors.textSecondary}
                                                    keyboardType="numeric"
                                                    value={heightIn}
                                                    onChangeText={setHeightIn}
                                                    maxLength={2}
                                                />
                                            </View>
                                        )}

                                        <TouchableOpacity
                                            style={[styles.unitToggle, { backgroundColor: `${selectedPalette.primary}20` }]}
                                            onPress={() => setHeightUnit(prev => prev === "cm" ? "ft" : "cm")}
                                        >
                                            <Text style={[styles.unitText, { color: selectedPalette.primary }]}>
                                                {heightUnit === "cm" ? "cm" : "ft/in"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Weight Section */}
                                <View style={styles.section}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>How much do you weigh?</Text>
                                    <View style={styles.row}>
                                        <TextInput
                                            style={[styles.input, {
                                                flex: 1,
                                                backgroundColor: colors.inputBackground,
                                                color: colors.text,
                                                borderColor: colors.border
                                            }]}
                                            placeholder="0"
                                            placeholderTextColor={colors.textSecondary}
                                            keyboardType="numeric"
                                            value={weight}
                                            onChangeText={setWeight}
                                            maxLength={5}
                                        />
                                        <TouchableOpacity
                                            style={[styles.unitToggle, { backgroundColor: `${selectedPalette.primary}20` }]}
                                            onPress={toggleWeightUnit}
                                        >
                                            <Text style={[styles.unitText, { color: selectedPalette.primary }]}>
                                                {weightUnit}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={[styles.caption, { color: colors.textSecondary }]}>
                                        It's OK to estimate, you can update later.
                                    </Text>
                                </View>

                                {/* Goal Weight Section */}
                                <View style={styles.section}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>What's your goal weight?</Text>
                                    <View style={styles.row}>
                                        <TextInput
                                            style={[styles.input, {
                                                flex: 1,
                                                backgroundColor: colors.inputBackground,
                                                color: colors.text,
                                                borderColor: colors.border
                                            }]}
                                            placeholder="0"
                                            placeholderTextColor={colors.textSecondary}
                                            keyboardType="numeric"
                                            value={goalWeight}
                                            onChangeText={setGoalWeight}
                                            maxLength={5}
                                        />
                                        <View style={[styles.unitToggle, { backgroundColor: `${selectedPalette.primary}20` }]}>
                                            <Text style={[styles.unitText, { color: selectedPalette.primary }]}>
                                                {weightUnit}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.caption, { color: colors.textSecondary }]}>
                                        This helps us personalize your workout plan. You can always change it later.
                                    </Text>
                                </View>

                            </Animated.View>
                        </ScrollView>

                        {/* Bottom Buttons */}
                        <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
                            <TouchableOpacity
                                style={[styles.backButton, { backgroundColor: colors.inputBackground }]}
                                onPress={handleBack}
                            >
                                <Ionicons name="arrow-back" size={24} color={colors.text} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.nextButton,
                                    { backgroundColor: selectedPalette.primary },
                                    (!isFormValid() || loading) && styles.nextButtonDisabled
                                ]}
                                onPress={handleNext}
                                disabled={!isFormValid() || loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.nextButtonText}>Next</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                    </View>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    topSection: {
        paddingTop: Platform.OS === "ios" ? 20 : 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: "Outfit-SemiBold",
        textAlign: "center",
        marginBottom: 16,
    },
    progressSegments: {
        flexDirection: "row",
        gap: 6,
        marginBottom: 24,
    },
    segment: {
        height: 4,
        borderRadius: 2,
    },
    segmentSmall: {
        flex: 0.5,
    },
    segmentMedium: {
        flex: 1.2,
    },
    segmentLarge: {
        flex: 2,
    },
    segmentActive: {
        opacity: 1,
    },
    pageHeading: {
        fontSize: 28,
        fontFamily: "Outfit-Bold",
        marginBottom: 24,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingBottom: 20,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontFamily: "Outfit-SemiBold",
        marginBottom: 12,
    },
    row: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 8,
    },
    input: {
        height: 56,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 20,
        fontFamily: "Outfit-Bold",
    },
    unitToggle: {
        width: 80,
        height: 56,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    unitText: {
        fontSize: 18,
        fontFamily: "Outfit-Bold",
    },
    caption: {
        fontSize: 13,
        fontFamily: "Outfit-Regular",
        lineHeight: 18,
    },
    bottomBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 16,
        gap: 16,
    },
    backButton: {
        width: 56,
        height: 56,
        borderRadius: 28, // Circle
        justifyContent: "center",
        alignItems: "center",
    },
    nextButton: {
        flex: 1,
        height: 56,
        borderRadius: 28, // Pill shape similar to design
        justifyContent: "center",
        alignItems: "center",
    },
    nextButtonDisabled: {
        opacity: 0.5,
    },
    nextButtonText: {
        color: "white",
        fontSize: 18,
        fontFamily: "Outfit-Bold",
    },
});
