
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from "expo-image";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/theme';
import { Challenge } from '../../src/services/api';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const CARD_WIDTH = Dimensions.get('window').width * 0.85;
const CARD_HEIGHT = 200;

interface Props {
    challenge: Challenge;
    onPress: () => void;
    gender?: 'male' | 'female';
}

export default function ChallengeCard({ challenge, onPress, gender = 'male' }: Props) {
    const { selectedPalette } = useTheme();

    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }]
        };
    });

    const handlePressIn = () => {
        scale.value = withSpring(0.98);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    // Determine correct image based on gender
    // Assuming backend added image_url_male/female to Challenge interface?
    // I need to check api.ts/Challenge interface. If not there, I might need to cast or updated it.
    // For now, I'll assume they are on the object as implicit any or update interface separately.
    const displayImage = gender === 'female' && (challenge as any).image_url_female
        ? (challenge as any).image_url_female
        : (challenge as any).image_url_male || challenge.image_url;

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.touchable}
            >
                <Image
                    source={{ uri: displayImage || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438' }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                    transition={300}
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                    locations={[0, 0.5, 1]}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.content}>
                    <View style={[styles.badge, { backgroundColor: selectedPalette.primary }]}>
                        <Text style={styles.badgeText}>{challenge.duration_days} DAYS</Text>
                    </View>
                    <Text style={styles.title}>{challenge.name.toUpperCase()}</Text>
                    <Text style={styles.description} numberOfLines={2}>{challenge.description}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        marginRight: 16,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    touchable: {
        flex: 1,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#2A2A2A',
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 20,
    },
    title: {
        color: '#fff',
        fontSize: 28,
        fontFamily: 'Outfit-Bold',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'Outfit-Bold',
        letterSpacing: 1,
    },
    description: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 15,
        fontFamily: 'Outfit-Regular',
        lineHeight: 20,
    }
});
