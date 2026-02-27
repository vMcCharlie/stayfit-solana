import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../src/lib/supabase';
import { useTheme } from '../../../src/context/theme';
import { Database } from '../../../src/types/database.types';
import AchievementModal from '../../../app/components/AchievementModal';
import { getAchievementAsset, getLockedAssetForCode } from '../../../src/assets/achievements';
import { syncAchievements } from '../../../src/services/achievementSync';
import { LockIcon } from '../../../app/components/TabIcons';

type Achievement = Database['public']['Tables']['achievements']['Row'];
type UserAchievement = Database['public']['Tables']['user_achievements']['Row'];

interface AchievementItemProps {
    achievement: Achievement;
    userProgress?: UserAchievement | null;
    onPress: (achievement: Achievement) => void;
}

// Metallic Gradient Helper (Rugged/Brushed Look)
const getTierGradient = (level: number) => {
    switch (level) {
        case 1: // Bronze (Rugged Copper)
            return [
                '#5c3a1e', '#8B5A2B', '#5c3a1e', // Dark start
                '#CD7F32', '#aa6628', '#CD7F32', // Mid tone variations
                '#F0C2A2', '#CD7F32',            // Highlight
                '#8B5A2B', '#4a2e16'             // Dark end
            ];
        case 2: // Silver (Brushed Steel)
            return [
                '#404040', '#686868', '#404040', // Deep grey
                '#A9A9A9', '#808080', '#A9A9A9', // Mid variations
                '#E8E8E8', '#C0C0C0',            // Highlight
                '#686868', '#2F2F2F'             // Dark end
            ];
        case 3: // Gold (Raw Nugget)
            return [
                '#5e450b', '#8B6914', '#5e450b', // Deep gold
                '#DAA520', '#b8860b', '#DAA520', // Mid variations
                '#FFD700', '#FFFACD',            // Bright Highlight
                '#DAA520', '#6d500e'             // Dark end
            ];
        case 4: // Platinum (Rugged Amethyst)
            return [
                '#1a002e', '#2E004F', '#1a002e', // Deepest Purple
                '#4B0082', '#360061', '#4B0082', // Mid variations
                '#9932CC', '#E6E6FA',            // Highlight
                '#4B0082', '#1a002e'             // Dark end
            ];
        default: // Fallback
            return ['#222', '#444', '#222', '#555', '#333', '#111'];
    }
};

const AchievementItem = ({ achievement, userProgress, onPress }: AchievementItemProps) => {
    const { isDarkMode, selectedPalette } = useTheme();
    const unlockedLevel = userProgress?.current_level || 0;
    const isUnlocked = unlockedLevel > 0;

    // Determine asset
    let assetSource;
    let tiers = achievement.tiers as any[];

    if (unlockedLevel > 0) {
        const currentTier = tiers.find((t: any) => t.level === unlockedLevel);
        if (currentTier) {
            assetSource = getAchievementAsset(currentTier.asset_name);
        } else {
            const maxTier = tiers[tiers.length - 1];
            assetSource = getAchievementAsset(maxTier.asset_name);
        }
    } else {
        assetSource = getLockedAssetForCode(achievement.code);
    }

    const colors = {
        text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
        subtext: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
    };

    // Calculate max level
    const maxLevel = tiers && tiers.length > 0 ? tiers[tiers.length - 1].level : 4;

    // Helper for Tier Name
    const getTierName = (level: number) => {
        switch (level) {
            case 0: return "Locked";
            case 1: return "Bronze";
            case 2: return "Silver";
            case 3: return "Gold";
            case 4: return "Platinum";
            default: return "Platinum";
        }
    };

    return (
        <TouchableOpacity
            style={[styles.gridItem]}
            onPress={() => onPress(achievement)}
            activeOpacity={0.8}
        >
            <View style={styles.iconContainer}>
                <Image
                    source={assetSource}
                    style={[styles.icon, !isUnlocked && { opacity: 0.5 }]}
                    resizeMode="contain"
                    blurRadius={!isUnlocked ? 3 : 0}
                />
                {!isUnlocked && (
                    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                        <LockIcon size={32} color={colors.subtext} />
                    </View>
                )}
            </View>

            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {achievement.name}
            </Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>
                {getTierName(unlockedLevel)}
            </Text>
        </TouchableOpacity>
    );
};

export default function AchievementsList({ userId, isPublicView = false }: { userId?: string, isPublicView?: boolean }) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [userAchievements, setUserAchievements] = useState<Record<string, UserAchievement>>({});
    const [loading, setLoading] = useState(true);
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const { isDarkMode, selectedPalette } = useTheme();

    const formatDate = (date: Date) => {
        return date.toLocaleDateString();
    };

    const colors = {
        text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
        surface: isDarkMode ? selectedPalette.dark.surface : selectedPalette.light.surface,
        textSecondary: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
    };



    useEffect(() => {
        if (userId) {
            if (isPublicView) {
                // For public view, just fetch existing achievements without syncing
                fetchAchievements();
            } else {
                // For own profile, sync to ensure data is up to date, then fetch
                syncAchievements(userId).then(() => {
                    fetchAchievements();
                });
            }
        }
    }, [userId, isPublicView]);

    const fetchAchievements = async () => {
        try {
            const { data: defs, error: defError } = await supabase
                .from('achievements')
                .select('*')
                .order('category'); // Ordering by category might group them nicely, but grid is continuous

            if (defError) throw defError;

            const { data: progress, error: progError } = await supabase
                .from('user_achievements')
                .select('*')
                .eq('user_id', userId!);

            if (progError) throw progError;

            const progressMap: Record<string, UserAchievement> = {};
            progress?.forEach(p => {
                progressMap[p.achievement_code] = p;
            });
            setUserAchievements(progressMap);

            // Sort achievements: Unlocked (higher level first) -> Locked
            const sortedAchievements = [...(defs || [])].sort((a, b) => {
                const progA = progressMap[a.code];
                const progB = progressMap[b.code];
                const levelA = progA?.current_level || 0;
                const levelB = progB?.current_level || 0;

                // 1. Unlocked vs Locked
                const isUnlockedA = levelA > 0;
                const isUnlockedB = levelB > 0;

                if (isUnlockedA && !isUnlockedB) return -1;
                if (!isUnlockedA && isUnlockedB) return 1;

                // 2. Sort by Level (Descending) for unlocked items
                if (isUnlockedA && isUnlockedB) {
                    if (levelA !== levelB) {
                        return levelB - levelA;
                    }
                }

                // 3. Fallback to default order (index/id) - here stable sort or original index
                return 0;
            });

            setAchievements(sortedAchievements);

        } catch (error) {
            console.error("Error fetching achievements:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePress = (achievement: Achievement) => {
        setSelectedAchievement(achievement);
        setModalVisible(true);
    };

    if (loading) {
        return <ActivityIndicator size="small" color={selectedPalette.primary} />;
    }

    const displayedAchievements = isPublicView
        ? achievements.filter(a => (userAchievements[a.code]?.current_level || 0) > 0)
        : achievements;

    if (displayedAchievements.length === 0 && isPublicView && !loading) {
        return (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Image
                    source={require('../../../assets/images/logo-black.png')}
                    style={{ width: 60, height: 60, opacity: 0.3, marginBottom: 16, tintColor: colors.textSecondary }}
                    resizeMode="contain"
                />
                <Text style={{ color: colors.textSecondary, fontFamily: "Outfit-Regular", textAlign: 'center', marginBottom: 8 }}>
                    No unlocked achievements yet.
                </Text>
                <Text style={{ color: colors.textSecondary, fontFamily: "Outfit-Regular", textAlign: 'center', fontSize: 12 }}>
                    Check History to see recent workouts!
                </Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View style={styles.gridContainer}>
                {displayedAchievements.map((item) => (
                    <AchievementItem
                        key={item.id}
                        achievement={item}
                        userProgress={userAchievements[item.code]}
                        onPress={handlePress}
                    />
                ))}
            </View>

            <AchievementModal
                visible={modalVisible}
                achievement={selectedAchievement}
                userProgress={selectedAchievement ? userAchievements[selectedAchievement.code] : null}
                onClose={() => setModalVisible(false)}
                colors={colors}
                isDarkMode={isDarkMode}
                selectedPalette={selectedPalette}
                formatDate={formatDate}
                isPublicView={isPublicView}
            />
        </View>
    );
}

const { width } = Dimensions.get('window');
const gap = 12;
const parentPadding = 32; // 16 left + 16 right from Profile screen usually
// Available width = Screen - ParentPadding
// We want 3 items with 2 gaps
// ItemWidth = (AvailableWidth - (gap * 2)) / 3
const itemWidth = (width - parentPadding - (gap * 2)) / 3;

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        // Removed paddingHorizontal to use parent's padding space efficiently
        gap: gap,
        paddingBottom: 20,
    },
    gridItem: {
        width: itemWidth,
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: '80%', // Reduced from 100% to make image smaller
        aspectRatio: 1,
        marginBottom: 8,
        justifyContent: 'center',
        alignItems: 'center',
        // Optional: add background or border if desired, but user wants clean
    },
    icon: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 12, // Reduced slightly
        fontFamily: 'Outfit-Bold',
        textAlign: 'center',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 10,
        fontFamily: 'Outfit-Regular',
        textAlign: 'center',
        opacity: 0.6
    }
});
