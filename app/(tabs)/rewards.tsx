import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    Modal,
    Pressable,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/theme";
import { ThemeBackground } from "../components/ThemeBackground";
import { LinearGradient } from "expo-linear-gradient";
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../../src/lib/supabase';
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../src/context/auth";
import CustomAlert, { AlertButton } from "../components/CustomAlert";
import ScreenHeader from "../components/ScreenHeader";
import NavWalletButton from "../components/NavWalletButton";

// Gamification constants
const XP_PER_WORKOUT = 500;
const REFERRAL_BONUS_MULTIPLIER = 0.01;

export default function Rewards() {
    const { isDarkMode, selectedPalette } = useTheme();
    const { connectWallet, user: authUser, skrTier, skrBalance, triggerProfileRefresh } = useAuth();
    const [profile, setProfile] = React.useState<any>(null);
    const [transactions, setTransactions] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const [weeklyXp, setWeeklyXp] = React.useState(0);
    const [growthPercent, setGrowthPercent] = React.useState(0);
    const [infoModalVisible, setInfoModalVisible] = React.useState(false);
    const [referralCount, setReferralCount] = React.useState(0);
    const [alertConfig, setAlertConfig] = React.useState<{
        visible: boolean;
        title: string;
        message: string;
        buttons?: AlertButton[];
    }>({
        visible: false,
        title: "",
        message: "",
    });

    const showAlert = (title: string, message: string, buttons?: AlertButton[]) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            buttons,
        });
    };

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
                .limit(20);
            setTransactions(txData || []);

            // Fetch completed referral count for multiplier breakdown
            const { count: refCount } = await supabase
                .from('referrals')
                .select('*', { count: 'exact', head: true })
                .eq('referrer_id', user.id)
                .eq('status', 'streak_completed');
            setReferralCount(refCount || 0);

            // Calculate Weekly Stats
            const now = new Date();
            const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
            const startOfLastWeek = new Date(startOfWeek);
            startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

            const { data: weeklyData } = await supabase
                .from('xp_transactions')
                .select('amount, created_at')
                .gte('created_at', startOfLastWeek.toISOString());

            if (weeklyData) {
                const thisWeekTotal = weeklyData
                    .filter(tx => new Date(tx.created_at) >= startOfWeek)
                    .reduce((sum, tx) => sum + tx.amount, 0);

                const lastWeekTotal = weeklyData
                    .filter(tx => {
                        const date = new Date(tx.created_at);
                        return date >= startOfLastWeek && date < startOfWeek;
                    })
                    .reduce((sum, tx) => sum + tx.amount, 0);

                setWeeklyXp(thisWeekTotal);

                if (lastWeekTotal > 0) {
                    const percent = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
                    setGrowthPercent(Math.round(percent));
                } else if (thisWeekTotal > 0) {
                    setGrowthPercent(100);
                } else {
                    setGrowthPercent(0);
                }
            }
        } catch (error) {
            console.error("Error fetching rewards data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        triggerProfileRefresh();
        await fetchData();
    }, [triggerProfileRefresh]);

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
        success: selectedPalette.primary || "#00C853",
        primary: selectedPalette.primary || "#00C853",
    };

    const formatXp = (amount: number) => {
        return new Intl.NumberFormat().format(amount);
    };

    const getTierMultiplier = (tier: string): number => {
        switch (tier) {
            case 'Platinum': return 5.0;
            case 'Gold': return 2.5;
            case 'Silver': return 1.5;
            case 'Bronze': return 1.2;
            default: return 1.0;
        }
    };

    const tierMultiplier = getTierMultiplier(skrTier);
    const referralBoost = referralCount * REFERRAL_BONUS_MULTIPLIER;
    const liveMultiplier = tierMultiplier + referralBoost;

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
        // Since CustomAlert doesn't have an input, we redirect to referral-detail
        // The user requested to remove the "Add Referral" button anyway, but we keep the logic 
        // if they ever want to trigger it from elsewhere.
        router.push('/referral-detail');
    };

    const handleConnectWallet = async () => {
        try {
            const address = await connectWallet();
            if (address) {
                showAlert("Success", `Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
                fetchData();
            }
        } catch (err: any) {
            showAlert("Connection Failed", err.message);
        }
    };

    const handleShowInfo = () => {
        setInfoModalVisible(true);
    };

    return (
        <ThemeBackground style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={["top"]}>
                <ScreenHeader
                    title="Rewards"
                    rightAction={<NavWalletButton />}
                />
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={selectedPalette.primary}
                            colors={[selectedPalette.primary]}
                        />
                    }
                >

                    {/* Balance + Multiplier Row */}
                    <View style={styles.balanceRow}>
                        <View style={styles.balanceBlock}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Total XP Balance</Text>
                                <TouchableOpacity style={styles.infoIcon} onPress={handleShowInfo}>
                                    <Ionicons name="help-circle-outline" size={18} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.balanceValue, { color: colors.text }]}>
                                {profile ? formatXp(profile.xp_balance || 0) : "0"}
                            </Text>
                            <View style={styles.growthContainer}>
                                <Ionicons
                                    name={growthPercent >= 0 ? "caret-up" : "caret-down"}
                                    size={12}
                                    color={growthPercent >= 0 ? colors.success : "#FF5252"}
                                />
                                <Text style={[
                                    styles.growthValue,
                                    { color: growthPercent >= 0 ? colors.success : "#FF5252" }
                                ]}>
                                    {" "}{formatXp(weeklyXp)} ({growthPercent > 0 ? "+" : ""}{growthPercent}%) THIS WEEK
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.multiplierCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.multiplierCardLabel, { color: colors.textSecondary }]}>Multiplier</Text>
                            <Text style={[styles.multiplierCardValue, { color: colors.text }]}>
                                {liveMultiplier.toFixed(2)}x
                            </Text>
                            <View style={styles.multiplierBreakdown}>
                                <View style={styles.boostRow}>
                                    <View style={[styles.boostDot, { backgroundColor: "#00E5FF" }]} />
                                    <Text style={[styles.boostLabel, { color: colors.textSecondary }]}>Referral</Text>
                                    <Text style={[styles.boostValue, { color: colors.text }]}>
                                        +{referralBoost.toFixed(2)}
                                    </Text>
                                </View>
                                <View style={styles.boostRow}>
                                    <View style={[styles.boostDot, { backgroundColor: "#FFD700" }]} />
                                    <Text style={[styles.boostLabel, { color: colors.textSecondary }]}>SKR ({skrTier})</Text>
                                    <Text style={[styles.boostValue, { color: colors.text }]}>
                                        +{(tierMultiplier - 1.0).toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        </View>
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
                                <Text style={styles.bannerTitle}>Invite a friend and get 5000 XP plus 0.01 Referral boost to your XP earnings.</Text>
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
                    </View>

                    <View style={styles.activityList}>
                        {transactions.length === 0 && !loading && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="receipt-outline" size={48} color={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No history yet. Start working out to earn XP!</Text>
                            </View>
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

            {/* Info Modal */}
            <Modal
                visible={infoModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setInfoModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setInfoModalVisible(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <View style={[styles.modalIconBg, { backgroundColor: selectedPalette.primary + '20' }]}>
                                <Ionicons name="information-circle" size={32} color={selectedPalette.primary} />
                            </View>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>How to earn XP</Text>
                            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Maximize your rewards with StayFit</Text>
                        </View>

                        <View style={styles.infoList}>
                            <View style={styles.infoItem}>
                                <View style={[styles.infoBullet, { backgroundColor: selectedPalette.primary }]} />
                                <View style={styles.infoTextWrapper}>
                                    <Text style={[styles.infoItemTitle, { color: colors.text }]}>Complete Workouts</Text>
                                    <Text style={[styles.infoItemDesc, { color: colors.textSecondary }]}>Earn base XP for every workout session you complete.</Text>
                                </View>
                            </View>

                            <View style={styles.infoItem}>
                                <View style={[styles.infoBullet, { backgroundColor: "#FFD700" }]} />
                                <View style={styles.infoTextWrapper}>
                                    <Text style={[styles.infoItemTitle, { color: colors.text }]}>SKR Boost (Multiplier)</Text>
                                    <Text style={[styles.infoItemDesc, { color: colors.textSecondary }]}>Connect your wallet and hold SKR tokens to multiply your earned XP.</Text>
                                </View>
                            </View>

                            <View style={styles.infoItem}>
                                <View style={[styles.infoBullet, { backgroundColor: "#00E5FF" }]} />
                                <View style={styles.infoTextWrapper}>
                                    <Text style={[styles.infoItemTitle, { color: colors.text }]}>Referral Rewards</Text>
                                    <Text style={[styles.infoItemDesc, { color: colors.textSecondary }]}>
                                        Invite friends to join! When they hit a 7-day streak, you'll earn 5,000 XP and a permanent +{REFERRAL_BONUS_MULTIPLIER} boost.
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.infoItem}>
                                <View style={[styles.infoBullet, { backgroundColor: selectedPalette.primary }]} />
                                <View style={styles.infoTextWrapper}>
                                    <Text style={[styles.infoItemTitle, { color: colors.text }]}>$GAINS Token Giveaway</Text>
                                    <Text style={[styles.infoItemDesc, { color: colors.textSecondary }]}>Your Total XP determines your share in the upcoming $GAINS token distribution.</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.closeModalBtn, { backgroundColor: selectedPalette.primary }]}
                            onPress={() => setInfoModalVisible(false)}
                        >
                            <Text style={styles.closeModalBtnText}>Got it!</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
        </ThemeBackground >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, backgroundColor: "transparent" },
    scrollContent: { padding: 20, paddingBottom: 100 },
    balanceRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 20,
        gap: 12,
    },
    balanceBlock: {
        flex: 1,
    },
    balanceLabel: { fontFamily: "Outfit-Medium", fontSize: 16, marginBottom: 8 },
    balanceValue: { fontFamily: "Outfit-Bold", fontSize: 36, marginBottom: 6 },
    growthContainer: { flexDirection: "row", alignItems: "center" },
    growthValue: { fontFamily: "Outfit-Medium", fontSize: 12 },
    multiplierCard: {
        width: 120,
        borderRadius: 16,
        borderWidth: 1,
        padding: 12,
        alignItems: "center",
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
            android: { elevation: 2 },
        }),
    },
    multiplierCardLabel: { fontFamily: "Outfit-Medium", fontSize: 12, marginBottom: 4 },
    multiplierCardValue: { fontFamily: "Outfit-Bold", fontSize: 28, marginBottom: 8 },
    multiplierBreakdown: { width: "100%", gap: 6 },
    boostRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    boostDot: { width: 6, height: 6, borderRadius: 3 },
    boostLabel: { fontFamily: "Outfit-Regular", fontSize: 11, flex: 1 },
    boostValue: { fontFamily: "Outfit-Bold", fontSize: 11 },
    walletHeaderText: { fontFamily: "Outfit-Bold", fontSize: 13, marginLeft: 6 },
    walletHeaderBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
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
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 8,
        minHeight: 52,
    },
    actionIcon: { marginRight: 0 },
    actionText: { fontFamily: "Outfit-Bold", fontSize: 13, textAlign: "center" },
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
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 60,
        gap: 12
    },
    emptyText: { fontFamily: "Outfit-Medium", fontSize: 16, textAlign: "center" },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        width: "100%",
        borderRadius: 24,
        padding: 24,
        alignItems: "center",
    },
    modalHeader: {
        alignItems: "center",
        marginBottom: 24,
    },
    modalIconBg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontFamily: "Outfit-Bold",
        fontSize: 24,
        marginBottom: 4,
    },
    modalSubtitle: {
        fontFamily: "Outfit-Medium",
        fontSize: 14,
    },
    infoList: {
        width: "100%",
        gap: 20,
        marginBottom: 30,
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    infoBullet: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 6,
    },
    infoTextWrapper: {
        flex: 1,
    },
    infoItemTitle: {
        fontFamily: "Outfit-Bold",
        fontSize: 16,
        marginBottom: 2,
    },
    infoItemDesc: {
        fontFamily: "Outfit-Regular",
        fontSize: 13,
        lineHeight: 18,
    },
    closeModalBtn: {
        width: "100%",
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: "center",
    },
    closeModalBtnText: {
        color: "#FFF",
        fontFamily: "Outfit-Bold",
        fontSize: 16,
    },
});
