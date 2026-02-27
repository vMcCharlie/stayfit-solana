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
                    title: "How do I track my workouts?",
                    description: "Navigate to the home tab, select a routine, and tap 'Start Workout'. You can follow the guided exercises and log your progress.",
                },
                {
                    id: "2",
                    title: "Can I modify the routines?",
                    description: "Yes! Before starting a workout, you can edit the routine to adjust reps, duration, or swap exercises to fit your needs.",
                },
                {
                    id: "3",
                    title: "How do I change my weight or height units?",
                    description: "Go to Settings > Units. You can toggle between kg/lbs for weight and cm/ft for height.",
                },
                {
                    id: "4",
                    title: "How do I log my progress photos?",
                    description: "Go to the 'More' tab, select 'Log Progress Photo', and upload or take a new photo to track your journey.",
                },
                {
                    id: "5",
                    title: "Is my profile public to everyone?",
                    description: "By default, no. You can choose to make your profile public in Settings > Account > Public Profile.",
                },
                {
                    id: "6",
                    title: "I have a subscription but I can't access Pro features.",
                    description: "Please try restoring your purchase or contact support if the issue persists at support@stayfit.app.",
                },
                {
                    id: "7",
                    title: "How do I delete my account?",
                    description: "We're sad to see you go! You can permanently delete your account in Settings > Account > Delete Account.",
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
