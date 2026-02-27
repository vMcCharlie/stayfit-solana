import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    Image,
    Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    Easing,
    runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

import { Database } from "../../src/types/database.types";
import { getAchievementAsset, getLockedAssetForCode } from "../../src/assets/achievements";
import { supabase } from "../../src/lib/supabase";

type Achievement = Database['public']['Tables']['achievements']['Row'];
type UserAchievement = Database['public']['Tables']['user_achievements']['Row'];

// Props interface
interface AchievementModalProps {
    visible: boolean;
    achievement: Achievement | null;
    userProgress?: UserAchievement | null; // Added prop
    onClose: () => void;
    colors: any;
    isDarkMode: boolean;
    selectedPalette: any;
    formatDate: (date: Date) => string;
    isPublicView?: boolean;
}

// Helper for Tier Colors and Names
const getTierInfo = (level: number, maxLevel: number = 4) => {
    switch (level) {
        case 0: return { name: "Locked", color: "rgba(150, 150, 150, 0.2)", textColor: "#999" };
        case 1: return { name: "Bronze", color: "#CD7F32", textColor: "#CD7F32" }; // Bronze
        case 2: return { name: "Silver", color: "#C0C0C0", textColor: "#C0C0C0" }; // Silver
        case 3: return { name: "Gold", color: "#FFD700", textColor: "#FFD700" }; // Gold
        case 4: return { name: "Platinum", color: "#E5E4E2", textColor: "#E5E4E2" }; // Platinum/Purple
        default: return { name: "Platinum", color: "#A020F0", textColor: "#A020F0" }; // Fallback/Purple
    }
};

const getBackgroundAccent = (level: number) => {
    if (level === 0) return "rgba(0,0,0,0.05)";
    if (level === 1) return "rgba(205, 127, 50, 0.2)";
    if (level === 2) return "rgba(192, 192, 192, 0.2)";
    if (level === 3) return "rgba(255, 215, 0, 0.2)";
    return "rgba(160, 32, 240, 0.2)"; // Purple for high levels
}

export default function AchievementModal({
    visible,
    achievement,
    userProgress: propUserProgress, // Rename prop to distinguish from state/internal logic
    onClose,
    colors,
    isDarkMode,
    selectedPalette,
    formatDate,
    isPublicView = false,
}: AchievementModalProps) {
    const modalOpacity = useSharedValue(0);
    const modalTranslateY = useSharedValue(1000);
    const [userProgressState, setUserProgressState] = useState<UserAchievement | null>(null);
    // Use prop directly if available, else null (we removed the internal fetch)
    const userProgress = propUserProgress || userProgressState;
    const insets = useSafeAreaInsets();
    const viewShotRef = useRef<ViewShot>(null);

    // If viewing another user's profile (isPublicView), we might need to pass their progress in directly
    // OR fetch it specifically for THAT user if we knew their ID.
    // However, AchievementModal doesn't currently accept userId as a prop.
    // The previous implementation of `fetchUserProgress` fetches for `supabase.auth.getUser()`, which is the CURRENT user.

    // To fix this, we need to know whose progress to show.
    // If `isPublicView` is true, we should probably receive `userProgress` as a prop instead of fetching it here,
    // OR we need to know the target userId.

    // Looking at AchievementsList.tsx, it has `userAchievements` map. 
    // It passes `selectedAchievement` (definition) but NOT the specific user progress row to the modal.

    // Refactoring plan: 
    // 1. Add `initialUserProgress` prop to AchievementModal.
    // 2. Pass the specific `userAchievement` from AchievementsList to AchievementModal.

    // Since I can't change the props interface easily without changing the parent, let's verify if I can change the parent.
    // Yes, I read AchievementsList.tsx.

    useEffect(() => {
        if (visible && achievement) {
            // Open animation
            modalOpacity.value = withTiming(1, { duration: 250 });
            modalTranslateY.value = withTiming(0, {
                duration: 350,
                easing: Easing.out(Easing.exp),
            });

            // If no prop provided and NOT public view, try fetching (backward compatibility)
            // But we prefer explicit prop now.
            if (!propUserProgress && !isPublicView) {
                fetchUserProgress(achievement.code);
            }
        }
    }, [visible, achievement, modalOpacity, modalTranslateY, propUserProgress, isPublicView]);

    const fetchUserProgress = async (code: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', user.id)
            .eq('achievement_code', code)
            .maybeSingle();

        if (data) setUserProgressState(data);
    };


    const animatedOverlayStyle = useAnimatedStyle(() => {
        return {
            opacity: modalOpacity.value,
        };
    });

    const animatedContentStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: modalTranslateY.value }],
        };
    });

    const handleClose = () => {
        modalOpacity.value = withTiming(0, { duration: 200 });
        modalTranslateY.value = withTiming(1000, { duration: 300 }, () => {
            runOnJS(onClose)();
        });
    };

    const handleShare = async () => {
        try {
            if (viewShotRef.current) {
                const uri = await captureRef(viewShotRef, {
                    format: "png",
                    quality: 0.9,
                });
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri);
                }
            }
        } catch (error) {
            console.error("Error sharing achievement:", error);
        }
    };

    if (!achievement && !visible) return null;

    // Determine asset
    let assetSource;
    const unlockedLevel = userProgress?.current_level || 0;
    const isUnlocked = unlockedLevel > 0;
    const tierInfo = getTierInfo(unlockedLevel);
    const accentColor = getBackgroundAccent(unlockedLevel);

    if (achievement && isUnlocked) {
        const tiers = achievement.tiers as any[];
        const currentTier = tiers.find((t: any) => t.level === unlockedLevel);
        if (currentTier) {
            assetSource = getAchievementAsset(currentTier.asset_name);
        } else {
            const maxTier = tiers[tiers.length - 1];
            assetSource = getAchievementAsset(maxTier.asset_name);
        }
    } else if (achievement) {
        assetSource = getLockedAssetForCode(achievement.code);
    }

    // Rarity Helper
    const getRarityText = (level: number) => {
        switch (level) {
            case 4: return "Top 0.1% of Users";
            case 3: return "Top 5% of Users";
            case 2: return "Top 15% of Users";
            default: return "Top 25% of Users";
        }
    };

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

    // Hidden Component for Sharing (9:16 Ratio)
    const ShareCard = () => (
        <LinearGradient
            colors={getTierGradient(unlockedLevel)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.shareCardContainer, { overflow: 'hidden' }]}
        >
            <View style={[styles.shareCardContent, { borderColor: "black" }]}>
                {/* Spacer */}
                <View style={{ flex: 1 }} />

                {/* Icon */}
                <View style={[styles.shareIconContainer, { backgroundColor: "rgba(0,0,0,0.1)" }]}>
                    <Image source={assetSource} style={styles.shareIcon} resizeMode="contain" />
                </View>

                {/* Text Group */}
                <View style={{ alignItems: 'center', marginVertical: 40 }}>
                    <Text style={[styles.shareTitle, { color: "black" }]}>
                        {isUnlocked ? "I earned the" : "Check out this achievement!"}
                    </Text>
                    <Text style={[styles.shareAchievementName, { color: "black" }]}>
                        {achievement?.name}
                    </Text>

                    {/* Status Pill */}
                    {isUnlocked && (
                        <View style={{
                            backgroundColor: "black",
                            paddingHorizontal: 16,
                            paddingVertical: 6,
                            borderRadius: 20,
                            marginBottom: 16,
                        }}>
                            <Text style={{
                                fontSize: 20, // Slightly larger for share card
                                fontFamily: "Outfit-Bold",
                                color: tierInfo.textColor,
                                textTransform: "uppercase",
                                letterSpacing: 0.5
                            }}>
                                {tierInfo.name} Status
                            </Text>
                        </View>
                    )}

                    {/* Rarity Badge */}
                    {isUnlocked && (
                        <View style={styles.rarityBadge}>
                            <Text style={styles.rarityText}>
                                {getRarityText(unlockedLevel)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Spacer */}
                <View style={{ flex: 1 }} />

                {/* Footer: Logo + App Name */}
                <View style={styles.shareFooterContainer}>
                    <Image
                        source={require("../../assets/images/logo-black.png")}
                        style={styles.shareLogoFooter}
                        resizeMode="contain"
                    />
                    <Text style={[styles.shareAppName, { color: "black" }]}>
                        Stay Fit
                    </Text>
                </View>
            </View>
        </LinearGradient>
    );

    return (
        <Modal
            transparent
            visible={visible}
            onRequestClose={handleClose}
            statusBarTranslucent
            animationType="none"
        >
            {/* Hidden ViewShot for capture */}
            <View style={{ position: 'absolute', left: -5000, top: 0 }}>
                <ViewShot ref={viewShotRef} options={{ format: "png", quality: 0.9 }}>
                    <ShareCard />
                </ViewShot>
            </View>

            <View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        zIndex: 100,
                        elevation: 100,
                    },
                ]}
            >
                <Animated.View style={[StyleSheet.absoluteFill, animatedOverlayStyle]}>
                    <BlurView
                        intensity={20}
                        tint={isDarkMode ? "dark" : "light"}
                        style={StyleSheet.absoluteFill}
                    >
                        <LinearGradient
                            colors={[
                                isDarkMode ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)",
                                isDarkMode ? "rgba(0,0,0,0.95)" : "rgba(255,255,255,0.95)",
                            ]}
                            style={StyleSheet.absoluteFill}
                        />
                        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
                    </BlurView>
                </Animated.View>

                <Animated.View
                    style={[
                        {
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            // Move layout styles to the inner wrapper
                        },
                        animatedContentStyle,
                    ]}
                >
                    {achievement && (
                        (() => {
                            const Wrapper = isUnlocked ? LinearGradient : View;
                            const wrapperProps = isUnlocked ? {
                                colors: getTierGradient(unlockedLevel),
                                start: { x: 0, y: 0 },
                                end: { x: 1, y: 1 },
                                style: [styles.modalContent, { paddingBottom: Math.max(insets.bottom + 24, 24) }]
                            } : {
                                style: [styles.modalContent, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom + 24, 24) }]
                            };

                            return (
                                <Wrapper {...wrapperProps}>
                                    <View style={styles.modalHeader}>
                                        {/* Share Button - Top Right */}
                                        {(isUnlocked && !isPublicView) && (
                                            <TouchableOpacity
                                                style={styles.headerShareButton}
                                                onPress={handleShare}
                                            >
                                                <Ionicons name="share-outline" size={24} color={isUnlocked ? "black" : colors.text} />
                                            </TouchableOpacity>
                                        )}

                                        <View
                                            style={[
                                                styles.modalIconContainer,
                                                {
                                                    backgroundColor: isUnlocked ? "rgba(0,0,0,0.1)" : accentColor,
                                                },
                                            ]}
                                        >
                                            {assetSource ? (
                                                <Image source={assetSource} style={styles.icon} resizeMode="contain" />
                                            ) : (
                                                <View />
                                            )}
                                        </View>
                                    </View>

                                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                                        {achievement.name}
                                    </Text>

                                    {isUnlocked && (
                                        <View style={{
                                            backgroundColor: "black",
                                            paddingHorizontal: 16,
                                            paddingVertical: 6,
                                            borderRadius: 20,
                                            marginBottom: 12,
                                        }}>
                                            <Text style={{
                                                fontSize: 16,
                                                fontFamily: "Outfit-Bold",
                                                color: tierInfo.textColor,
                                                textTransform: "uppercase",
                                                letterSpacing: 0.5
                                            }}>
                                                {tierInfo.name} Status
                                            </Text>
                                        </View>
                                    )}

                                    <Text
                                        style={[styles.modalDescription, { color: colors.textSecondary }]}
                                    >
                                        {achievement.description}
                                    </Text>

                                    {/* Progress Section */}
                                    {(() => {
                                        const tiers = achievement.tiers as any[];
                                        const nextTier = tiers.find((t: any) => t.level === unlockedLevel + 1);
                                        const currentValue = userProgress?.current_value || 0;

                                        if (!nextTier && isUnlocked) return (
                                            <View style={[styles.completedBadge, { backgroundColor: "rgba(0,0,0,0.2)" }]}>
                                                <Text style={{ color: "black", fontFamily: 'Outfit-Bold' }}>Completed!</Text>
                                            </View>
                                        );

                                        if (!nextTier) return null;

                                        if (isPublicView) return null; // Hide progress bar for public view

                                        const target = nextTier.target;
                                        const progressPercent = Math.min(100, Math.max(0, (currentValue / target) * 100));

                                        return (
                                            <View style={styles.progressSection}>
                                                <View style={styles.progressHeader}>
                                                    <Text style={[styles.progressTitle, { color: isUnlocked ? "black" : colors.text }]}>
                                                        Next: {getTierInfo(nextTier.level).name}
                                                    </Text>
                                                    <Text style={[styles.progressValue, { color: isUnlocked ? "#333" : colors.textSecondary }]}>
                                                        {currentValue} / {target}
                                                    </Text>
                                                </View>
                                                <View style={[styles.progressBarBg, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]}>
                                                    <View
                                                        style={[
                                                            styles.progressBarFill,
                                                            {
                                                                width: `${progressPercent}%`,
                                                                backgroundColor: isUnlocked ? "black" : selectedPalette.primary
                                                            }
                                                        ]}
                                                    />
                                                </View>
                                                <Text style={[styles.progressInstruction, { color: isUnlocked ? "#333" : colors.textSecondary }]}>
                                                    Reach {target} to unlock {getTierInfo(nextTier.level).name}
                                                </Text>
                                            </View>
                                        );
                                    })()}

                                    <TouchableOpacity
                                        style={[
                                            styles.closeButton,
                                            { backgroundColor: isUnlocked ? "black" : selectedPalette.primary },
                                        ]}
                                        onPress={handleClose}
                                    >
                                        <Text style={styles.closeButtonText}>Close</Text>
                                    </TouchableOpacity>
                                </Wrapper>
                            );
                        })()
                    )}
                </Animated.View>
            </View>
        </Modal>
    );

}

const styles = StyleSheet.create({
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        alignItems: "center",
        minHeight: 400,
    },
    modalHeader: {
        marginBottom: 16,
        width: '100%',
        alignItems: 'center',
        position: 'relative'
    },
    headerShareButton: {
        position: 'absolute',
        right: 0,
        top: 0,
        padding: 8,
        zIndex: 10
    },
    modalIconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: "center",
        alignItems: "center",
        padding: 10,
        marginTop: 10,
    },
    icon: {
        width: '100%',
        height: '100%'
    },
    modalTitle: {
        fontSize: 24,
        fontFamily: "Outfit-Bold",
        marginBottom: 4,
        textAlign: "center",
    },
    modalTierLabel: {
        fontSize: 18,
        fontFamily: "Outfit-Bold",
        marginBottom: 12,
        textAlign: "center"
    },
    modalDescription: {
        fontSize: 16,
        fontFamily: "Outfit-Regular",
        textAlign: "center",
        marginBottom: 24,
        paddingHorizontal: 20
    },
    progressSection: {
        width: "100%",
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    progressTitle: {
        fontSize: 16,
        fontFamily: "Outfit-Bold",
    },
    progressValue: {
        fontSize: 14,
        fontFamily: "Outfit-Medium",
    },
    progressBarBg: {
        width: "100%",
        height: 8,
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 8,
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 4,
    },
    progressInstruction: {
        fontSize: 12,
        fontFamily: "Outfit-Regular",
        textAlign: "center",
    },
    closeButton: {
        width: "100%",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
    },
    closeButtonText: {
        color: "white",
        fontSize: 16,
        fontFamily: "Outfit-Bold",
    },
    completedBadge: {
        padding: 12,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 8,
        marginBottom: 24
    },
    shareCardContainer: {
        width: 400,
        height: 711, // 9:16 Aspect Ratio
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    shareCardContent: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        borderWidth: 3, // Thicker border for large card
        borderColor: 'black',
        borderRadius: 20,
        padding: 24,
        borderStyle: 'dashed',
        zIndex: 1,
        justifyContent: 'space-between'
    },
    shareFooterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        marginBottom: 12
    },
    shareLogoFooter: {
        width: 32,
        height: 32,
        borderRadius: 6,
        marginRight: 10,
    },
    shareIconContainer: {
        width: 200,
        height: 200,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        // Margins handled by spacers now
    },
    shareIcon: {
        width: '75%', // Smaller relative to container to show bubble
        height: '75%'
    },
    shareTitle: {
        fontSize: 24,
        fontFamily: 'Outfit-Medium',
        marginBottom: 12,
        textAlign: 'center'
    },
    shareAchievementName: {
        fontSize: 36, // Larger for vertical impact
        fontFamily: 'Outfit-Bold',
        marginBottom: 16,
        textAlign: 'center',
        lineHeight: 40
    },
    shareAppName: {
        fontSize: 24,
        fontFamily: 'Outfit-Bold',
        // Removed textTransform: 'uppercase'
        // Increased size slightly to 20 to match logo height visually
    },
    rarityBadge: {
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 2,
        borderColor: 'black',
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    rarityText: {
        fontSize: 18,
        fontFamily: 'Outfit-Bold',
        color: 'black',
        textTransform: 'uppercase',
        letterSpacing: 1
    }
});
