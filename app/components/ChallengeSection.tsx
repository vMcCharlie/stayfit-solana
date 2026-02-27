
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useTheme } from '../../src/context/theme';
import { api, Challenge } from '../../src/services/api';
import ChallengeCard from './ChallengeCard';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Props {
    gender: 'male' | 'female';
}

export default function ChallengeSection({ gender }: Props) {
    const { colors, isDarkMode } = useTheme();
    const router = useRouter();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadChallenges();
    }, []);

    const loadChallenges = async () => {
        try {
            const data = await api.getChallenges();
            setChallenges(data);
        } catch (e) {
            console.error("Failed to load challenges", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={{ height: 240, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" />
            </View>
        )
    }

    if (challenges.length === 0) return null;

    return (
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.container}>
            <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Challenges</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={Dimensions.get('window').width * 0.85 + 16}
                snapToAlignment="start"
            >
                {challenges.map(item => (
                    <ChallengeCard
                        key={item.id}
                        challenge={item}
                        gender={gender}
                        onPress={() => router.push({ pathname: '/challenge/[id]', params: { id: item.id } })}
                    />
                ))}
            </ScrollView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontFamily: 'Outfit-Bold',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingRight: 8, // correct padding logic
    }
});
