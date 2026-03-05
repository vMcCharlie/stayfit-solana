import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Linking,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/theme";
import Animated, { SlideInRight } from "react-native-reanimated";
import { supabase } from "../../src/lib/supabase";

interface InfoItem {
    id: string;
    title: string;
    description: string;
    image_url?: string;
    url?: string;
    created_at?: string;
}

interface InfoModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    tableName: "referols" | "faqs"; // Adjust table names as needed
    emptyMessage?: string;
}

// Temporary mock data generator if tables don't exist yet, or generic fetcher
export default function InfoModal({ visible, onClose, title, tableName, emptyMessage }: InfoModalProps) {
    const { isDarkMode, selectedPalette } = useTheme();
    const [items, setItems] = useState<InfoItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
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
        border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    };

    const fetchItems = async () => {
        // For now, since we might not have the actual tables "referols" or "faqs" created in the previous steps
        // (the user didn't explicitly ask for backend migration for these, just the UI structure),
        // I will mock the data or try to fetch if table exists. 
        // Given the instructions, "make sure for now use the domain...", I'll simulate data for now to ensure UI works.

        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        let mockData: InfoItem[] = [];
        if (tableName === "referols") {
            mockData = [
                {
                    id: "1",
                    title: "Invite Friends",
                    description: "Share your unique code with friends and earn rewards when they sign up!",
                    created_at: new Date().toISOString(),
                },
                {
                    id: "2",
                    title: "Ern 1 Month Free",
                    description: "Get 1 month of premium for every 3 friends who join.",
                    created_at: new Date().toISOString(),
                }
            ];
        } else if (tableName === "faqs") {
            mockData = [
                {
                    id: "1",
                    title: "Getting Started with StayFit",
                    description: "Welcome! To start your journey, navigate to the Workouts tab, choose a routine that matches your level, and tap 'Start'. Follow the guided instructions and animations for each exercise.",
                },
                {
                    id: "2",
                    title: "Tracking Progress & Stats",
                    description: "Your dashboard shows your daily activity, calories burned, and workout streaks. Detailed history can be found in your Profile under the 'History' tab.",
                },
                {
                    id: "3",
                    title: "Managing Units & Preferences",
                    description: "Personalize your experience in Settings > Units. You can switch between Metric (kg, cm) and Imperial (lbs, ft) units at any time.",
                },
                {
                    id: "4",
                    title: "Solana Wallet & SKR Tokens",
                    description: "Connect your Solana wallet to earn SKR tokens for your fitness achievements. Your SKR balance is displayed on your profile and provides access to premium perks.",
                },
                {
                    id: "5",
                    title: "Earning XP & Multipliers",
                    description: "Complete workouts to earn XP. You can boost your XP earnings by holding SKR tokens or maintaining a consistent workout streak.",
                },
                {
                    id: "6",
                    title: "Subscription & Premium Features",
                    description: "StayFit offers PLUS and PRO tiers for advanced tracking and exclusive routines. You can manage your subscription in the 'Membership' section of the 'More' tab.",
                },
                {
                    id: "7",
                    title: "Technical Support",
                    description: "Encountering issues? Try clearing your offline cache in Settings > Storage. If problems persist, contact our support team at help@gostay.fit.",
                }
            ];
        }

        setItems(mockData);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchItems();
        setRefreshing(false);
    };

    useEffect(() => {
        if (visible) {
            fetchItems();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View
            entering={SlideInRight.duration(300)}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {title}
                    </Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close-outline" size={28} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {loading && !refreshing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={selectedPalette.primary} />
                    </View>
                ) : (
                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    >
                        {items.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{emptyMessage || "No items found."}</Text>
                            </View>
                        ) : items.map((item) => (
                            <View
                                key={item.id}
                                style={[
                                    styles.itemCard,
                                    { backgroundColor: colors.surface },
                                ]}
                            >
                                {item.image_url && (
                                    <Image
                                        source={{ uri: item.image_url }}
                                        style={styles.itemImage}
                                    />
                                )}
                                <View style={styles.itemContent}>
                                    <Text style={[styles.itemTitle, { color: colors.text }]}>
                                        {item.title}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.itemDescription,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        {item.description}
                                    </Text>
                                    {item.created_at && (
                                        <Text
                                            style={[styles.itemDate, { color: colors.textSecondary }]}
                                        >
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </Text>
                                    )}
                                </View>
                                {item.url && (
                                    <TouchableOpacity onPress={() => Linking.openURL(item.url!)}>
                                        <Ionicons
                                            name="chevron-forward"
                                            size={24}
                                            color={colors.textSecondary}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                )}
            </SafeAreaView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        zIndex: 100,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: "Outfit-Bold",
    },
    content: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyContainer: {
        padding: 24,
        alignItems: "center",
    },
    emptyText: {
        fontSize: 16,
        fontFamily: "Outfit-Regular",
        textAlign: "center",
    },
    itemCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        position: "relative",
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontFamily: "Outfit-Bold",
        marginBottom: 4,
    },
    itemDescription: {
        fontSize: 14,
        fontFamily: "Outfit-Regular",
        marginBottom: 4,
    },
    itemDate: {
        fontSize: 12,
        fontFamily: "Outfit-Regular",
        marginTop: 4,
    },
});
