import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/theme';
import { ThemeBackground } from './components/ThemeBackground';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../src/lib/supabase';

export default function ReferralDetail() {
    const { isDarkMode, selectedPalette } = useTheme();
    const [profile, setProfile] = React.useState<any>(null);

    React.useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('invite_code').eq('id', user.id).single();
                setProfile(data);
            }
        };
        fetchProfile();
    }, []);

    const colors = {
        background: isDarkMode ? selectedPalette.dark?.background || '#000' : selectedPalette.light?.background || '#FFF',
        surface: isDarkMode ? selectedPalette.dark?.surface || '#1A1A1A' : selectedPalette.light?.surface || '#FFF',
        text: isDarkMode ? selectedPalette.dark?.text || '#FFF' : selectedPalette.light?.text || '#000',
        textSecondary: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
        primary: "#00C853",
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
        // Maybe show a toast
    };

    return (
        <ThemeBackground style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                {/* Custom Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="close" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Promo</Text>
                    <TouchableOpacity style={styles.pastBtn}>
                        <Text style={[styles.pastText, { color: colors.primary }]}>Past</Text>
                    </TouchableOpacity>
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
                    <Text style={[styles.headline, { color: colors.text }]}>Invite a friend. Get +0.01 Multiplier.</Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Invite friends to StayFit Seeker. Once they sign up and complete a 7-day streak, you'll both get a persistent +0.01 multiplier bonus.
                    </Text>

                    {/* Features */}
                    <View style={styles.featureItem}>
                        <View style={styles.featureIcon}>
                            <Ionicons name="infinite" size={20} color={colors.text} />
                        </View>
                        <View style={styles.featureContent}>
                            <Text style={[styles.featureTitle, { color: colors.text }]}>Stackable Multipliers</Text>
                            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                                Every friend who hits their first 7-day streak increases your earnings forever.
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
                                Multipliers are applied immediately to all future XP earnings.
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
                        <Text style={styles.mainBtnText}>Invite contacts</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onShare} style={styles.shareLinkBtn}>
                        <Text style={[styles.shareLinkText, { color: colors.primary }]}>Share link</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </ThemeBackground>
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
});
