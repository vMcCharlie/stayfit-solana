import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from '../../src/context/theme';
import { useAuth } from '../../src/context/auth';
import { api } from '../../src/services/api';
import { cache } from '../../src/utils/cache';
import ScreenHeader from './ScreenHeader';
import { ThemeBackground } from './ThemeBackground';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Should match the key in index.tsx
const ROUTINES_CACHE_KEY = "cached_workout_routines_list";

export default function GoalRoutines() {
    const { goalName } = useLocalSearchParams();
    const router = useRouter();
    const { isDarkMode, selectedPalette } = useTheme();
    const { user } = useAuth();

    const [routines, setRoutines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const goal = Array.isArray(goalName) ? goalName[0] : goalName;

    useEffect(() => {
        loadRoutines();
    }, [goal]);

    const loadRoutines = async () => {
        try {
            setLoading(true);
            let allRoutines: any[] = [];

            // 1. Try Cache First (Fastest)
            const cachedData = await cache.load<any[]>(ROUTINES_CACHE_KEY);
            if (cachedData) {
                console.log('Loaded routines from cache in Goal Routines');
                allRoutines = cachedData;
            } else {
                // 2. Fetch from API if cache miss
                console.log('Fetching routines from API in Goal Routines');
                allRoutines = await api.getWorkoutRoutines();
                // Optionally save back to cache if index.tsx hasn't run yet?
                // Probably safe to do so to populate it.
                await cache.save(ROUTINES_CACHE_KEY, allRoutines);
            }

            const filtered = allRoutines.filter(r => {
                const name = r.name.toLowerCase();
                const goalLower = (goal || "").toLowerCase();

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
            });

            // Calculate durations if missing
            const processed = filtered.map(r => ({
                ...r,
                total_duration: r.total_duration || (r.name.includes("5-Minute") ? 5 : (r.exercise_count || 0) * 1.5),
            }));

            setRoutines(processed);

        } catch (error) {
            console.error("Failed to load routines", error);
        } finally {
            setLoading(false);
        }
    };

    const colors = {
        text: isDarkMode ? "#FFF" : "#000",
        textSecondary: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
        cardBg: isDarkMode ? "#1E1E1E" : "#FFF",
    };

    return (
        <ThemeBackground style={styles.container}>
            <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'transparent' }}>
                <ScreenHeader
                    title={goal}
                    leftAction={
                        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                    }
                />

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={selectedPalette.primary} />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {routines.map((routine) => {
                            const displayImage = routine.image_url_male || routine.image_url;

                            return (
                                <TouchableOpacity
                                    key={routine.id}
                                    style={[styles.card, { backgroundColor: colors.cardBg }]}
                                    onPress={() => router.push({
                                        pathname: "../components/routine",
                                        params: { routineId: routine.id, coverImage: displayImage }
                                    })}
                                >
                                    <ExpoImage
                                        source={{ uri: displayImage || undefined }}
                                        style={styles.cardImage}
                                        contentFit="cover"
                                    />
                                    <View style={styles.cardContent}>
                                        <Text style={[styles.cardTitle, { color: colors.text }]}>
                                            {routine.name}
                                        </Text>
                                        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                                            {routine.level} • {Math.round(routine.total_duration || 0)} mins
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                        {routines.length === 0 && (
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                No routines found.
                            </Text>
                        )}
                    </ScrollView>
                )}
            </SafeAreaView>
        </ThemeBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 16,
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardImage: {
        width: 60,
        height: 60,
        borderRadius: 10,
        backgroundColor: '#CCC',
    },
    cardContent: {
        flex: 1,
        marginLeft: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        fontFamily: 'Outfit-Regular',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
        fontFamily: 'Outfit-Medium',
    }
});
