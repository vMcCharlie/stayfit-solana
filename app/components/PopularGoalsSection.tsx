import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/theme';

interface Routine {
    id: string;
    name: string;
    level: string;
    total_duration?: number;
    image_url?: string | null;
    image_url_male?: string | null;
    image_url_female?: string | null;
    [key: string]: any;
}

interface PopularGoalsSectionProps {
    routines: Routine[];
    userGender?: 'male' | 'female';
}

const GOALS = ["Build Muscle", "Burn Fat", "Keep Fit"];

export default function PopularGoalsSection({ routines, userGender = 'male' }: PopularGoalsSectionProps) {
    const { isDarkMode, selectedPalette } = useTheme();
    const router = useRouter();
    const [selectedGoal, setSelectedGoal] = useState("Build Muscle");

    const colors = {
        text: isDarkMode ? "#FFF" : "#000",
        textSecondary: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
        surface: isDarkMode ? "#1E1E1E" : "#F5F5F5",
        border: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    };

    const filterRoutinesByGoal = (goal: string) => {
        const goalLower = goal.toLowerCase();

        return routines.filter(r => {
            const name = r.name.toLowerCase();
            const cat = (r.category || "").toLowerCase();

            if (goalLower === "build muscle") {
                return (
                    name.includes("muscle") || name.includes("build") || name.includes("strength") ||
                    name.includes("arm") || name.includes("chest") || name.includes("back") ||
                    name.includes("pump") || name.includes("bulk")
                ) && !name.includes("fat") && !name.includes("burn");
            } else if (goalLower === "burn fat") {
                return (
                    name.includes("burn") || name.includes("fat") || name.includes("loss") ||
                    name.includes("hiit") || name.includes("cardio") || name.includes("sweat") ||
                    name.includes("slim") || name.includes("shred")
                );
            } else { // Keep Fit
                return (
                    name.includes("fit") || name.includes("tone") || name.includes("yoga") ||
                    name.includes("stretch") || name.includes("mobility") || name.includes("beginner") ||
                    (!name.includes("muscle") && !name.includes("burn"))
                );
            }
        }).slice(0, 3); // Take top 3
    };

    const displayRoutines = filterRoutinesByGoal(selectedGoal);

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: colors.text }]}>Popular Goals</Text>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {GOALS.map((goal) => (
                    <TouchableOpacity
                        key={goal}
                        onPress={() => setSelectedGoal(goal)}
                        style={[
                            styles.tab,
                            {
                                backgroundColor: selectedGoal === goal ? selectedPalette.primary : (isDarkMode ? '#333' : '#E0E0E0'),
                            }
                        ]}
                    >
                        <Text style={[
                            styles.tabText,
                            {
                                color: selectedGoal === goal ? '#FFF' : colors.textSecondary,
                                fontFamily: selectedGoal === goal ? 'Outfit-Bold' : 'Outfit-Medium'
                            }
                        ]}>
                            {goal}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            <View style={styles.listContainer}>
                {displayRoutines.length === 0 ? (
                    <Text style={{ color: colors.textSecondary, textAlign: 'center', marginVertical: 20 }}>
                        No routines found for this goal.
                    </Text>
                ) : (
                    displayRoutines.map(routine => {
                        const displayImage = userGender === "female" && routine.image_url_female
                            ? routine.image_url_female
                            : routine.image_url_male || routine.image_url;

                        return (
                            <TouchableOpacity
                                key={routine.id}
                                style={[styles.card, { backgroundColor: isDarkMode ? '#252525' : '#FFF' }]}
                                onPress={() => router.push({
                                    pathname: "/components/routine",
                                    params: { routineId: routine.id, coverImage: displayImage }
                                })}
                            >
                                <ExpoImage
                                    source={{ uri: displayImage || undefined }}
                                    style={styles.cardImage}
                                    contentFit="cover"
                                />
                                <View style={styles.cardContent}>
                                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                                        {routine.name}
                                    </Text>
                                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                                        {Math.round(routine.total_duration || 0)} min • {routine.level}
                                    </Text>
                                </View>
                                <View style={styles.arrowContainer}>
                                    <Ionicons name="arrow-forward-circle" size={28} color={isDarkMode ? '#FFF' : '#333'} />
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>

            <TouchableOpacity
                style={styles.moreButton}
                onPress={() => router.push({
                    pathname: "/components/goal_routines",
                    params: { goalName: selectedGoal }
                })}
            >
                <Text style={[styles.moreText, { color: selectedPalette.primary }]}>More &gt;</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        fontFamily: 'Outfit-Bold',
        marginBottom: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 12,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    tabText: {
        fontSize: 14,
    },
    listContainer: {
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#CCC',
    },
    cardContent: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        fontFamily: 'Outfit-Regular',
    },
    arrowContainer: {
        padding: 4,
    },
    moreButton: {
        alignItems: 'flex-end',
        marginTop: 12,
    },
    moreText: {
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
    }
});
