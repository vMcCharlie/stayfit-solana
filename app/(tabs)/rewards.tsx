import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/theme";
import { ThemeBackground } from "../components/ThemeBackground";
import { LinearGradient } from "expo-linear-gradient";
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../../src/lib/supabase';
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../src/context/auth";

// Gamification constants
const XP_PER_WORKOUT = 500;
const REFERRAL_BONUS_MULTIPLIER = 0.01;

export default function Rewards() {
    const { isDarkMode, selectedPalette } = useTheme();
    const { connectWallet, user: authUser } = useAuth();
    const [profile, setProfile] = React.useState<any>(null);
    const [transactions, setTransactions] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profileData);

            // Fetch XP Transactions
            const { data: txData } = await supabase
                .from('xp_transactions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);
            setTransactions(txData || []);
        } catch (error) {
            console.error("Error fetching rewards data:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [])
    );

    const colors = {
        background: isDarkMode ? selectedPalette.dark?.background || "#000" : selectedPalette.light?.background || "#FFF",
        surface: isDarkMode ? selectedPalette.dark?.surface || "#1A1A1A" : selectedPalette.light?.surface || "#FFF",
        text: isDarkMode ? selectedPalette.dark?.text || "#FFF" : selectedPalette.light?.text || "#000",
        textSecondary: isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.5)",
        border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        success: "#00C853",
        primary: "#00C853",
    };

    const formatXp = (amount: number) => {
        return new Intl.NumberFormat().format(amount);
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMins = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMins / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        if (diffInMins > 0) return `${diffInMins} min ago`;
        return 'Just now';
    };

    const handleAddReferral = () => {
        Alert.prompt(
            "Add Referral Code",
            "Enter your friend's referral code to get +0.01 Referral Boost once they hit a streak!",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Submit",
                    onPress: async (code: string | undefined) => {
                        if (!code) return;
                        try {
                            // Find user with this code
                            const { data: friend } = await supabase
                                .from('profiles')
                                .select('id')
                                .eq('invite_code', code.toUpperCase())
                                .single();

                            if (!friend) {
                                Alert.alert("Error", "Invalid referral code.");
                                return;
                            }

                            if (friend.id === authUser?.id) {
                                Alert.alert("Error", "You cannot refer yourself.");
                                return;
                            }

                            // Create referral
                            const { error } = await supabase
                                .from('referrals')
                                .insert({
                                    referrer_id: friend.id,
                                    referred_id: authUser?.id,
                                    status: 'joined'
                                });

                            if (error) {
                                if (error.code === '23505') {
                                    Alert.alert("Error", "You have already been referred.");
                                } else {
                                    Alert.alert("Error", "Could not add referral code.");
                                }
                            } else {
                                Alert.alert("Success", "Referral code added! Complete a 7-day streak to unlock the bonus for your friend.");
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            ]
        );
    };

    const handleConnectWallet = async () => {
        try {
            const address = await connectWallet();
            if (address) {
                Alert.alert("Success", `Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
                fetchData();
            }
        } catch (err: any) {
            Alert.alert("Connection Failed", err.message);
        }
    };

    const handleShowInfo = () => {
        Alert.alert(
            "XP & SKR Boosts",
            "• XP (Experience Points) are earned by completing workouts.\n\n" +
            "• $GAINS Token: Your XP balance is your ticket to the future Stay Fit ($GAINS) token giveaway.\n\n" +
            "• SKR Boost: Hold SKR in your connected wallet to unlock higher XP multipliers and premium features.\n\n" +
            "• Referral Boost: Each friend you refer who completes a 7-day streak gives you a permanent +0.01 boost.",
            [{ text: "Got it" }]
        );
    };

    return (
        <ThemeBackground style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={["top"]}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Header Balance Section */}
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Total XP Balance</Text>
                                <TouchableOpacity style={styles.infoIcon} onPress={handleShowInfo}>
                                    <Ionicons name="help-circle-outline" size={18} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.balanceValue, { color: colors.text }]}>
                                {profile ? formatXp(profile.xp_balance || 0) : "0"}
                            </Text>
                            <View style={styles.statsRow}>
                                <View style={styles.growthContainer}>
                                    <Ionicons name="caret-up" size={12} color={colors.success} />
                                    <Text style={[styles.growthValue, { color: colors.success }]}> 0 (0%) THIS WEEK</Text>
                                </View>
                                {profile?.xp_multiplier > 1.0 && (
                                    <View style={[styles.multiplierBadge, { backgroundColor: colors.primary + '20' }]}>
                                        <Ionicons name="flash" size={12} color={colors.primary} />
                                        <Text style={[styles.multiplierText, { color: colors.primary }]}> {profile.xp_multiplier.toFixed(2)}x SKR Boost</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.walletSelector, { backgroundColor: isDarkMode ? "#222" : "#F5F5F5" }]}
                            onPress={handleConnectWallet}
                        >
                            <Ionicons name="wallet-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                            <Text style={[styles.walletLabel, { color: colors.text }]}>
                                {profile?.wallet_address ? `${profile.wallet_address.slice(0, 4)}...${profile.wallet_address.slice(-4)}` : "Connect"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: selectedPalette.primary }]}
                        >
                            <Ionicons name="list-outline" size={20} color="white" style={styles.actionIcon} />
                            <Text style={[styles.actionText, { color: "white" }]}>Tasks</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: selectedPalette.primary }]}
                            onPress={handleAddReferral}
                        >
                            <Ionicons name="person-add-outline" size={20} color="white" style={styles.actionIcon} />
                            <Text style={[styles.actionText, { color: "white" }]}>Add Referral Code</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Referral Banner */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.bannerContainer}
                        onPress={() => router.push('/referral-detail')}
                    >
                        <LinearGradient
                            colors={["#111111", "#000000"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.bannerGradient}
                        >
                            <View style={styles.bannerContent}>
                                <Text style={styles.bannerTitle}>Invite a friend and get +0.01 Referral Boost</Text>
                                <View style={styles.bannerBtn}>
                                    <Text style={styles.bannerBtnText}>share invite</Text>
                                    <Ionicons name="chevron-forward" size={14} color="#888" />
                                </View>
                            </View>
                            <View style={styles.bannerArt}>
                                <Ionicons name="gift" size={50} color="rgba(255,255,255,0.1)" style={{ position: "absolute", top: 10, right: 10 }} />
                                <Ionicons name="sparkles" size={40} color="rgba(255,255,255,0.05)" style={{ position: "absolute", bottom: 10, right: 40 }} />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Activity Section -> History */}
                    <View style={styles.activityHeader}>
                        <Text style={[styles.activityTitle, { color: colors.text }]}>History</Text>
                        <TouchableOpacity style={styles.seeAllBtn}>
                            <Text style={[styles.seeAllText, { color: colors.textSecondary }]}>See all</Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.activityList}>
                        {transactions.length === 0 && !loading && (
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No history yet. Start working out to earn XP!</Text>
                        )}
                        {transactions.map((tx) => (
                            <View key={tx.id} style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <View style={styles.activityIconWrapper}>
                                    <Ionicons
                                        name={tx.amount >= 0 ? "add-circle-outline" : "remove-circle-outline"}
                                        size={24}
                                        color={tx.amount >= 0 ? colors.success : colors.textSecondary}
                                    />
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={[styles.activityType, { color: colors.text }]}>
                                        {tx.description || tx.type}
                                    </Text>
                                    <Text style={[styles.activityDate, { color: colors.textSecondary }]}>
                                        {getTimeAgo(tx.created_at)}
                                    </Text>
                                </View>
                                <View style={styles.activityAmounts}>
                                    <Text style={[
                                        styles.activityPrimaryAmount,
                                        { color: tx.amount >= 0 ? colors.success : colors.text },
                                    ]}>
                                        {tx.amount >= 0 ? "+" : ""}{formatXp(tx.amount)} XP
                                    </Text>
                                    <Text style={[styles.activitySecondaryAmount, { color: colors.textSecondary }]}>
                                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>

                </ScrollView>
            </SafeAreaView>
        </ThemeBackground >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, backgroundColor: "transparent" },
    scrollContent: { padding: 20, paddingBottom: 100 },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 30,
        marginTop: 10,
    },
    balanceLabel: { fontFamily: "Outfit-Medium", fontSize: 16, marginBottom: 8 },
    balanceValue: { fontFamily: "Outfit-Bold", fontSize: 40, marginBottom: 8 },
    growthContainer: { flexDirection: "row", alignItems: "center" },
    growthValue: { fontFamily: "Outfit-Medium", fontSize: 14 },
    walletSelector: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    walletLabel: { fontFamily: "Outfit-Medium", fontSize: 14, marginRight: 8 },
    actionsRow: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        marginBottom: 30,
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12, // Matches profile.tsx paddingVertical
        paddingHorizontal: 16, // Matches profile.tsx paddingHorizontal
        borderRadius: 12, // Matches profile.tsx borderRadius
        gap: 8, // Matches profile.tsx gap
    },
    actionIcon: { marginRight: 0 }, // Gap handled by 'gap' property
    actionText: { fontFamily: "Outfit-Medium", fontSize: 16 }, // Matching profile.tsx fontFamily
    actionBtnIconOnly: {
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
            android: { elevation: 3 },
        }),
    },
    bannerContainer: { marginBottom: 40, borderRadius: 20, overflow: "hidden" },
    bannerGradient: {
        padding: 24,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 140,
    },
    bannerContent: { flex: 1, zIndex: 2, paddingRight: 60 },
    bannerTitle: { color: "#FFF", fontFamily: "Outfit-Bold", fontSize: 24, marginBottom: 16, lineHeight: 30 },
    bannerBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.1)",
        alignSelf: "flex-start",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    bannerBtnText: { color: "#CCC", fontFamily: "Outfit-Medium", fontSize: 14, marginRight: 4 },
    bannerArt: { position: "absolute", top: 0, bottom: 0, right: 0, width: 120, zIndex: 1 },
    activityHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    activityTitle: { fontFamily: "Outfit-SemiBold", fontSize: 20 },
    seeAllBtn: { flexDirection: "row", alignItems: "center" },
    seeAllText: { fontFamily: "Outfit-Medium", fontSize: 14, marginRight: 4 },
    activityList: { gap: 12 },
    activityCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
            android: { elevation: 1 },
        }),
    },
    activityIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(150,150,150,0.1)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    activityInfo: { flex: 1 },
    activityType: { fontFamily: "Outfit-Medium", fontSize: 16, marginBottom: 4 },
    activityDate: { fontFamily: "Outfit-Regular", fontSize: 14 },
    activityAmounts: { alignItems: "flex-end" },
    activityPrimaryAmount: { fontFamily: "Outfit-Bold", fontSize: 18, marginBottom: 4 },
    activitySecondaryAmount: { fontFamily: "Outfit-Regular", fontSize: 14 },
    labelRow: { flexDirection: "row", alignItems: "center" },
    infoIcon: { marginLeft: 6, marginBottom: 8 },
    statsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    multiplierBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    multiplierText: { fontFamily: "Outfit-Bold", fontSize: 12 },
    emptyText: { fontFamily: "Outfit-Medium", fontSize: 16, textAlign: "center", marginTop: 40 },
});
