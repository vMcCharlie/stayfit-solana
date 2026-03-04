import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/theme';
import { ThemeBackground } from './components/ThemeBackground';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/auth';
import { Modal, Pressable, TextInput, ActivityIndicator } from 'react-native';
import CustomAlert, { AlertButton } from './components/CustomAlert';

const REFERRAL_BONUS_MULTIPLIER = 0.01;
const REFERRAL_XP_BONUS = 5000;

export default function ReferralDetail() {
    const { isDarkMode, selectedPalette } = useTheme();
    const { user: authUser } = useAuth();
    const [profile, setProfile] = React.useState<any>(null);
    const [redeemModalVisible, setRedeemModalVisible] = React.useState(false);
    const [referralCode, setReferralCode] = React.useState("");
    const [isRedeeming, setIsRedeeming] = React.useState(false);
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

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('invite_code').eq('id', user.id).single();
            setProfile(data);
        }
    };

    React.useEffect(() => {
        fetchProfile();
    }, []);

    const colors = {
        background: isDarkMode ? selectedPalette.dark?.background || '#000' : selectedPalette.light?.background || '#FFF',
        surface: isDarkMode ? selectedPalette.dark?.surface || '#1A1A1A' : selectedPalette.light?.surface || '#FFF',
        text: isDarkMode ? selectedPalette.dark?.text || '#FFF' : selectedPalette.light?.text || '#000',
        textSecondary: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
        primary: selectedPalette.primary,
        border: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    };

    const inviteCode = profile?.invite_code || "STAYFIT";

    const onShare = async () => {
        try {
            const result = await Share.share({
                message: `Join me on StayFit Seeker! Use my invite code: ${inviteCode} to get a head start on your fitness journey. https://stayfitseeker.app/download`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(inviteCode);
    };

    const handleRedeem = async () => {
        if (!referralCode.trim()) {
            showAlert("Error", "Please enter a referral code.");
            return;
        }

        setIsRedeeming(true);
        try {
            const { data, error } = await supabase.functions.invoke('rewards-manager', {
                body: {
                    action: 'redeem_referral',
                    code: referralCode.trim()
                }
            });

            if (error) {
                // The edge function returns consistent error messages
                const errorMessage = error.message || "Failed to redeem code. Please try again later.";
                showAlert("Error", errorMessage);
                console.error("Redeem Error:", error);
            } else if (data?.success) {
                showAlert("Success", `Referral code redeemed! Complete a 7-day streak to earn ${REFERRAL_XP_BONUS.toLocaleString()} XP and a +${REFERRAL_BONUS_MULTIPLIER} Referral Boost.`);
                setRedeemModalVisible(false);
                setReferralCode("");
            } else {
                showAlert("Error", data?.error || "An unexpected error occurred.");
            }
        } catch (err) {
            console.error("Redeem Catch Error:", err);
            showAlert("Error", "An unexpected error occurred.");
        } finally {
            setIsRedeeming(false);
        }
    };

    return (
        <ThemeBackground style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                {/* Custom Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Refer a friend</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Illustration Placeholder */}
                    <View style={styles.illustrationContainer}>
                        <View style={styles.giftBoxWrapper}>
                            <Ionicons name="gift" size={120} color={colors.primary} />
                            <View style={styles.sparkle1}>
                                <Ionicons name="sparkles" size={24} color={colors.primary} alpha={0.5} />
                            </View>
                            <View style={styles.sparkle2}>
                                <Ionicons name="sparkles" size={32} color={colors.primary} alpha={0.8} />
                            </View>
                        </View>
                    </View>

                    <Text style={[styles.expiryText, { color: colors.textSecondary }]}>Never expires</Text>
                    <Text style={[styles.headline, { color: colors.text }]}>Invite a friend. Get +{REFERRAL_BONUS_MULTIPLIER} Referral Boost with no limit.</Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Invite friends to StayFit Seeker. Once they sign up and complete a 7-day streak, you'll both get ${REFERRAL_XP_BONUS.toLocaleString()} XP and a persistent +{REFERRAL_BONUS_MULTIPLIER} Referral Boost. There is no maximum limit—the more you refer, the more you earn!
                    </Text>

                    {/* Features */}
                    <View style={styles.featureItem}>
                        <View style={styles.featureIcon}>
                            <Ionicons name="infinite" size={20} color={colors.text} />
                        </View>
                        <View style={styles.featureContent}>
                            <Text style={[styles.featureTitle, { color: colors.text }]}>Stackable Boosts</Text>
                            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                                Every friend who hits their first 7-day streak increases your Referral Boost forever.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureItem}>
                        <View style={styles.featureIcon}>
                            <Ionicons name="flash" size={20} color={colors.text} />
                        </View>
                        <View style={styles.featureContent}>
                            <Text style={[styles.featureTitle, { color: colors.text }]}>Instant Activation</Text>
                            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                                Boosts are applied immediately to all future XP earnings.
                            </Text>
                        </View>
                    </View>

                    {/* Invite Code Section */}
                    <View style={[styles.codeSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>YOUR INVITE CODE</Text>
                        <TouchableOpacity onPress={copyToClipboard} style={styles.codeRow}>
                            <Text style={[styles.codeText, { color: colors.text }]}>{inviteCode}</Text>
                            <Ionicons name="copy-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Bottom Actions */}
                <View style={styles.bottomActions}>
                    <TouchableOpacity onPress={onShare} style={[styles.mainBtn, { backgroundColor: colors.primary }]}>
                        <Text style={styles.mainBtnText}>Share Link</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setRedeemModalVisible(true)} style={styles.shareLinkBtn}>
                        <Text style={[styles.shareLinkText, { color: colors.primary }]}>Redeem a referral code</Text>
                    </TouchableOpacity>
                </View>

                {/* Redeem Modal */}
                <Modal
                    visible={redeemModalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setRedeemModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <Pressable style={styles.modalDismiss} onPress={() => setRedeemModalVisible(false)} />
                        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                            <View style={styles.modalHeader}>
                                <View style={[styles.modalIconBg, { backgroundColor: `${selectedPalette.primary}20` }]}>
                                    <Ionicons name="gift" size={32} color={selectedPalette.primary} />
                                </View>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Redeem Code</Text>
                                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Enter a friend's referral code</Text>
                            </View>

                            <TextInput
                                style={[styles.codeInput, {
                                    color: colors.text,
                                    borderColor: colors.border,
                                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                                }]}
                                placeholder="8-character code"
                                placeholderTextColor={colors.textSecondary}
                                value={referralCode}
                                onChangeText={setReferralCode}
                                autoCapitalize="characters"
                                maxLength={8}
                            />

                            <TouchableOpacity
                                onPress={handleRedeem}
                                disabled={isRedeeming}
                                style={[styles.redeemBtn, { backgroundColor: colors.primary, opacity: isRedeeming ? 0.7 : 1 }]}
                            >
                                {isRedeeming ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.redeemBtnText}>Redeem Now</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setRedeemModalVisible(false)} style={styles.cancelLink}>
                                <Text style={[styles.cancelLinkText, { color: colors.textSecondary }]}>Maybe later</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <CustomAlert
                    visible={alertConfig.visible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    buttons={alertConfig.buttons}
                    onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
                />
            </SafeAreaView>
        </ThemeBackground >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontFamily: 'Outfit-Medium', fontSize: 18 },
    pastBtn: { padding: 4 },
    pastText: { fontFamily: 'Outfit-Medium', fontSize: 16 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
    illustrationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 250,
        marginBottom: 20,
    },
    giftBoxWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    sparkle1: { position: 'absolute', top: 20, left: -40, opacity: 0.5 },
    sparkle2: { position: 'absolute', bottom: 40, right: -50, opacity: 0.8 },
    expiryText: { fontFamily: 'Outfit-Medium', fontSize: 14, marginBottom: 16 },
    headline: { fontFamily: 'Outfit-Bold', fontSize: 28, lineHeight: 34, marginBottom: 16 },
    description: { fontFamily: 'Outfit-Medium', fontSize: 16, lineHeight: 24, marginBottom: 32 },
    featureItem: { flexDirection: 'row', marginBottom: 24 },
    featureIcon: { marginTop: 4, marginRight: 16 },
    featureContent: { flex: 1 },
    featureTitle: { fontFamily: 'Outfit-Bold', fontSize: 16, marginBottom: 4 },
    featureDesc: { fontFamily: 'Outfit-Regular', fontSize: 14, lineHeight: 20 },
    codeSection: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        marginTop: 10,
        alignItems: 'center',
    },
    codeLabel: { fontFamily: 'Outfit-Bold', fontSize: 12, letterSpacing: 1, marginBottom: 8 },
    codeRow: { flexDirection: 'row', alignItems: 'center' },
    codeText: { fontFamily: 'Outfit-Bold', fontSize: 24, marginRight: 12 },
    bottomActions: {
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 10 : 20,
        paddingTop: 10,
    },
    mainBtn: {
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    mainBtnText: { color: '#FFF', fontFamily: 'Outfit-Bold', fontSize: 18 },
    shareLinkBtn: {
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shareLinkText: { fontFamily: 'Outfit-Bold', fontSize: 16 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalDismiss: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        width: '100%',
        borderRadius: 30,
        padding: 24,
        alignItems: 'center',
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    modalIconBg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontFamily: 'Outfit-Bold',
        fontSize: 24,
        marginBottom: 4,
    },
    modalSubtitle: {
        fontFamily: 'Outfit-Medium',
        fontSize: 14,
    },
    codeInput: {
        width: '100%',
        height: 60,
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 20,
        fontSize: 20,
        fontFamily: 'Outfit-Bold',
        textAlign: 'center',
        letterSpacing: 4,
        marginBottom: 20,
    },
    redeemBtn: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    redeemBtnText: {
        color: '#FFF',
        fontFamily: 'Outfit-Bold',
        fontSize: 18,
    },
    cancelLink: {
        paddingVertical: 8,
    },
    cancelLinkText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 14,
    },
});
