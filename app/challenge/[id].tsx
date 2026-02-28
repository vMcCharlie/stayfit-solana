
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from "expo-image";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/theme';
import { api, Challenge, ChallengeDay, UserChallenge } from '../../src/services/api';
import { ThemeBackground } from '../../app/components/ThemeBackground';
import { useCustomAlert } from "../../src/hooks/useCustomAlert";
import CustomAlert from "../../app/components/CustomAlert";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function ChallengeDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { isDarkMode, selectedPalette, colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { alertProps, showAlert } = useCustomAlert();

    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [days, setDays] = useState<ChallengeDay[]>([]);
    const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    const [userGender, setUserGender] = useState<'male' | 'female'>('male'); // Default

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [challenges, profile] = await Promise.all([
                api.getChallenges(),
                api.getProfile()
            ]);

            const current = challenges.find(c => c.id === id);
            setChallenge(current || null);

            if (profile.profile.gender === 'female') {
                setUserGender('female');
            }

            const [daysData, statusData] = await Promise.all([
                api.getChallengeDays(id as string),
                api.getChallengeStatus(id as string)
            ]);
            setDays(daysData);
            setUserChallenge(statusData);

        } catch (e) {
            console.error("Error loading challenge details", e);
            showAlert("Error", "Failed to load challenge details");
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        try {
            setJoining(true);
            const uc = await api.joinChallenge(id as string);
            setUserChallenge(uc);
            showAlert("Joined!", "You have started the challenge. Good luck!");
        } catch (e) {
            console.error(e);
            showAlert("Error", "Failed to join challenge");
        } finally {
            setJoining(false);
        }
    };

    const handleDayPress = async (day: ChallengeDay) => {
        if (!userChallenge) {
            showAlert("Join Challenge", "Please join the challenge first to start workouts.");
            return;
        }

        const currentDayIndex = userChallenge.current_day_index;
        const dayIdx = day.day_number - 1;

        if (dayIdx > currentDayIndex) {
            showAlert("Locked", "Complete previous days to unlock this workout.");
            return;
        }

        // Check if already completed?
        // User requirements: "routines can be repeated". but usually completed days are marked.
        // We allow re-playing completed days but it won't advance progress beyond max.

        if (day.is_rest_day) {
            // Mark rest day complete immediately or via prompt
            showAlert(
                "Rest Day",
                "Take some time to recover today. Mark as completed?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Complete Rest Day",
                        onPress: async () => {
                            await api.completeChallengeDay(userChallenge.id, day.day_number, 'rest');
                            loadData(); // Refresh status
                        }
                    }
                ]
            );
        } else if (day.routine_id) {
            // Navigate to routine player with Challenge Logic params
            router.push({
                pathname: '../components/routine', // Relative path from app/challenge/[id] -> app/components/routine ?? typical expo router resolution?
                // Wait, components are not pages in expo router usually unless declared. 
                // But in index.tsx they navigated to "../components/routine". I'll use the same.
                // Assuming "app/challenge/.." -> "app/components/routine"
                // Or absolute "/components/routine" if registered? 
                // index.tsx used "../components/routine". index is in "(tabs)".
                // challenge/[id] is in "challenge". So steps: up to app -> components/routine.
                // "../components/routine" from "challenge" folder should work.
                params: {
                    routineId: day.routine_id,
                    context: 'challenge',
                    userChallengeId: userChallenge.id,
                    dayNumber: day.day_number.toString(),
                    challengeId: challenge?.id
                }
            });
        }
    };

    if (loading) {
        return (
            <ThemeBackground style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={selectedPalette.primary} />
            </ThemeBackground>
        );
    }

    if (!challenge) {
        return (
            <ThemeBackground style={styles.loadingContainer}>
                <Text style={{ color: colors.text }}>Challenge not found</Text>
            </ThemeBackground>
        );
    }

    // Determine display image
    const displayImage = userGender === 'female' && (challenge as any).image_url_female
        ? (challenge as any).image_url_female
        : (challenge as any).image_url_male || challenge.image_url;

    const currentDayNum = userChallenge ? userChallenge.current_day_index + 1 : 1;

    return (
        <ThemeBackground style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>
                {/* Header */}
                <View style={styles.header}>
                    <Image
                        source={{ uri: displayImage || undefined }}
                        style={StyleSheet.absoluteFillObject}
                        contentFit="cover"
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>{challenge.name.toUpperCase()}</Text>
                        <Text style={styles.headerDesc}>{challenge.description}</Text>
                        <View style={styles.metaContainer}>
                            <View style={[styles.badge, { backgroundColor: selectedPalette.primary }]}>
                                <Text style={styles.badgeText}>{challenge.duration_days} DAYS</Text>
                            </View>
                            <Text style={styles.progressText}>
                                {userChallenge ? `${Math.round((userChallenge.current_day_index / challenge.duration_days) * 100)}% Completed` : 'Not Started'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Join Section - Removed from here to move to sticky footer */}

                {/* Days List */}
                <View style={styles.daysList}>
                    {days.map((day, index) => {
                        const isCompleted = userChallenge && (day.day_number <= userChallenge.current_day_index); // Simple logic: if current index is 5, days 1-5 completed? No, index 0 = day 1?
                        // DB seeded current_day_index = 0 usually means "ready for day 1"? 
                        // No, typically index tracks "last completed". 
                        // Let's verify edge function: `if day > current_day_index ... newIndex = day.number`.
                        // So current_day_index=5 means day 5 is done. 
                        // Check status:
                        // Completed: day.day_number <= userChallenge.current_day_index
                        // Locked: day.day_number > userChallenge.current_day_index + 1
                        // Current: day.day_number == userChallenge.current_day_index + 1

                        const lastCompletedIndex = userChallenge?.current_day_index || 0;
                        const completed = userChallenge ? (day.day_number <= lastCompletedIndex) : false;
                        const locked = userChallenge ? (day.day_number > lastCompletedIndex + 1) : true;
                        const isCurrent = userChallenge ? (day.day_number === lastCompletedIndex + 1) : (!userChallenge && index === 0);
                        // If not joined, show all unlocked? No, show all locked except day 1 maybe? Or just generic list.
                        // User said "keep next routines locked".

                        const displayLocked = !userChallenge || locked;

                        return (
                            <TouchableOpacity
                                key={day.id}
                                activeOpacity={displayLocked ? 1 : 0.7}
                                onPress={() => handleDayPress(day)}
                                style={{ marginBottom: 12 }}
                            >
                                <LinearGradient
                                    colors={
                                        displayLocked
                                            ? (isDarkMode ? ['#121212', '#121212'] : ['#F5F5F5', '#F5F5F5']) // Locked: Flat grey
                                            : (isDarkMode ? ['#252525', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']) // Unlocked: Gradient
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={[
                                        styles.dayCard,
                                        {
                                            borderColor: isCurrent ? selectedPalette.primary : (isDarkMode ? '#333' : '#E0E0E0'),
                                            borderWidth: isCurrent ? 2 : 1,
                                            transform: isCurrent ? [{ scale: 1.02 }] : [],
                                            shadowOpacity: isCurrent ? 0.2 : 0.05,
                                            opacity: displayLocked ? 0.6 : 1, // Grey out locked
                                        }
                                    ]}
                                >
                                    <View style={styles.dayLeft}>
                                        <View style={[
                                            styles.dayNumberContainer,
                                            {
                                                backgroundColor: completed ? selectedPalette.primary : (isDarkMode ? '#333' : '#F0F0F0'),
                                                borderColor: isCurrent && !completed ? selectedPalette.primary : 'transparent',
                                                borderWidth: isCurrent && !completed ? 1 : 0
                                            }
                                        ]}>
                                            {completed ? (
                                                <Ionicons name="checkmark" size={16} color="#fff" />
                                            ) : (
                                                <Text style={[
                                                    styles.dayNumberText,
                                                    { color: isCurrent ? selectedPalette.primary : (isDarkMode ? '#FFF' : '#333') }
                                                ]}>
                                                    {day.day_number}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={{ marginLeft: 16, flex: 1 }}>
                                            <Text style={[styles.dayTitle, { color: colors.text }]}>Day {day.day_number}</Text>
                                            <Text style={[styles.daySubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                                                {day.is_rest_day ? 'Rest & Recovery' : (day.workout_routines?.name || day.instructions)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.dayRight}>
                                        {displayLocked && !completed && (
                                            <Ionicons name="lock-closed" size={20} color={colors.textSecondary} />
                                        )}
                                        {!displayLocked && !completed && (
                                            <Ionicons name="play-circle" size={28} color={selectedPalette.primary} />
                                        )}
                                        {completed && (
                                            <Text style={{ fontSize: 12, color: selectedPalette.primary, fontFamily: 'Outfit-Medium' }}>Done</Text>
                                        )}
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Sticky Footer for both Join and Start Day */}
            {(!userChallenge || (userChallenge && days.length > 0)) && (
                <View style={[styles.stickyFooter, {
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    paddingBottom: insets.bottom + 20
                }]}>
                    {!userChallenge ? (
                        <TouchableOpacity
                            style={[styles.startButton, { backgroundColor: selectedPalette.primary }]}
                            onPress={handleJoin}
                            disabled={joining}
                        >
                            {joining ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.startButtonText}>Join Challenge</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.startButton, { backgroundColor: selectedPalette.primary }]}
                            onPress={() => {
                                const nextDay = days.find(d => d.day_number === (userChallenge.current_day_index + 1));
                                if (nextDay) handleDayPress(nextDay);
                                else showAlert("Challenge Completed!", "You have finished all days!");
                            }}
                        >
                            <Text style={styles.startButtonText}>
                                Start Day {userChallenge.current_day_index + 1}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <CustomAlert {...alertProps} />
        </ThemeBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { height: 300, justifyContent: 'flex-end' },
    backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)' },
    headerContent: { padding: 20 },
    headerTitle: { color: '#fff', fontSize: 28, fontFamily: 'Outfit-Bold', marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
    headerDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontFamily: 'Outfit-Regular', marginBottom: 16 },
    metaContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: '#fff', fontSize: 12, fontFamily: 'Outfit-Bold' },
    progressText: { color: '#fff', fontFamily: 'Outfit-Medium', fontSize: 14 },
    joinContainer: { padding: 20 },
    joinButton: { padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    joinButtonText: { color: '#fff', fontSize: 18, fontFamily: 'Outfit-Bold' },
    daysList: { padding: 16 },
    // dayCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    dayCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 20, overflow: 'hidden' }, // Removed shadow from container, handle in gradient or parent if needed
    dayLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    dayNumberContainer: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }, // Squircle
    dayNumberText: { fontFamily: 'Outfit-Bold', fontSize: 18 },
    dayTitle: { fontSize: 17, fontFamily: 'Outfit-Bold', marginBottom: 4 },
    daySubtitle: { fontSize: 14, fontFamily: 'Outfit-Regular' },
    dayRight: { alignItems: 'center', justifyContent: 'center', paddingLeft: 12 },
    stickyFooter: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 0, position: 'absolute', bottom: 0, left: 0, right: 0 },
    startButton: { padding: 18, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
    startButtonText: { color: '#fff', fontSize: 18, fontFamily: 'Outfit-Bold' }
});
