import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/theme';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface SkrTiersModalProps {
    visible: boolean;
    onClose: () => void;
    balance: number;
}

const TIERS = [
    {
        name: 'None',
        range: '0',
        min: 0,
        max: 0,
        multiplier: '1x',
        benefits: ['Basic tracking', 'Community access'],
        color: '#808080',
    },
    {
        name: 'Bronze',
        range: '1 - 3,999',
        min: 1,
        max: 3999,
        multiplier: '1.2x',
        benefits: ['Custom workout routines', 'Bronze badge', '1.2x XP'],
        color: '#CD7F32',
    },
    {
        name: 'Silver',
        range: '4,000 - 39,999',
        min: 4000,
        max: 39999,
        multiplier: '1.5x',
        benefits: ['Unlimited rest days', 'Exclusive routines', '1.5x XP'],
        color: '#C0C0C0',
    },
    {
        name: 'Gold',
        range: '40,000 - 399,999',
        min: 40000,
        max: 399999,
        multiplier: '2.5x',
        benefits: ['Staking rewards', 'Early access', '2.5x XP'],
        color: '#FFD700',
    },
    {
        name: 'Platinum',
        range: '400,000+',
        min: 400000,
        max: Infinity,
        multiplier: '5x',
        benefits: ['Personalized AI coach', 'VIP events', '5x XP'],
        color: '#E5E4E2',
    },
];

export default function SkrTiersModal({ visible, onClose, balance }: SkrTiersModalProps) {
    const { isDarkMode, selectedPalette } = useTheme();

    const colors = {
        background: isDarkMode ? '#121212' : '#FFFFFF',
        text: isDarkMode ? '#FFFFFF' : '#1A1A1A',
        textSecondary: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
        surface: isDarkMode ? '#1E1E1E' : '#F8F9FA',
        border: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    };

    const currentTier = TIERS.find(t => balance >= t.min && balance <= t.max) || TIERS[0];

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={styles.overlay}
            >
                <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
                <Animated.View
                    entering={SlideInUp.duration(200)}
                    exiting={SlideOutDown.duration(200)}
                    style={[styles.container, { backgroundColor: colors.background }]}
                >
                    <View style={styles.header}>
                        <View style={styles.headerIndicator} />
                        <View style={styles.headerTop}>
                            <Text style={[styles.title, { color: colors.text }]}>SKR Tiers</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView
                        style={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollInner}
                    >
                        <View style={[styles.balanceCard, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Your Balance</Text>
                            <View style={styles.balanceRow}>
                                <Ionicons name="wallet-outline" size={28} color={selectedPalette.primary} />
                                <Text style={[styles.balanceValue, { color: colors.text }]}>{balance.toLocaleString()} SKR</Text>
                            </View>
                            <View style={[styles.tierIndicator, { backgroundColor: currentTier.color }]}>
                                <Text style={styles.tierIndicatorText}>{currentTier.name} Tier</Text>
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Membership Benefits</Text>

                        <View style={[styles.table, { borderColor: colors.border }]}>
                            <View style={[styles.tableHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                                <Text style={[styles.headerCell, { color: colors.text, flex: 1.2 }]}>Tier / Range</Text>
                                <Text style={[styles.headerCell, { color: colors.text, flex: 0.8 }]}>XP Mult.</Text>
                                <Text style={[styles.headerCell, { color: colors.text, flex: 2 }]}>Key Benefits</Text>
                            </View>

                            {TIERS.map((tier, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.tableRow,
                                        { borderBottomColor: colors.border },
                                        currentTier.name === tier.name && { backgroundColor: tier.color + '15' }
                                    ]}
                                >
                                    <View style={[styles.cell, { flex: 1.2 }]}>
                                        <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                                        <Text style={[styles.tierRange, { color: colors.textSecondary }]}>{tier.range}</Text>
                                    </View>
                                    <View style={[styles.cell, { flex: 0.8 }]}>
                                        <Text style={[styles.multiplierText, { color: colors.text }]}>{tier.multiplier}</Text>
                                    </View>
                                    <View style={[styles.cell, { flex: 2 }]}>
                                        {tier.benefits.map((benefit, bIndex) => (
                                            <Text key={bIndex} style={[styles.benefitText, { color: colors.textSecondary }]} numberOfLines={1}>
                                                • {benefit}
                                            </Text>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
                            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                                Hold SKR tokens in your connected wallet to automatically unlock higher tiers and bigger rewards.
                            </Text>
                        </View>
                    </ScrollView>

                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <TouchableOpacity
                            style={[styles.doneButton, { backgroundColor: selectedPalette.primary }]}
                            onPress={onClose}
                        >
                            <Text style={styles.doneButtonText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    dismissArea: {
        flex: 1,
    },
    container: {
        height: '75%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 16,
        alignItems: 'center',
    },
    headerIndicator: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginBottom: 16,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    title: {
        fontSize: 24,
        fontFamily: 'Outfit-Bold',
    },
    closeButton: {
        padding: 4,
    },
    scrollContent: {
        flex: 1,
    },
    scrollInner: {
        padding: 24,
        paddingTop: 8,
    },
    balanceCard: {
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 32,
    },
    balanceLabel: {
        fontSize: 14,
        fontFamily: 'Outfit-Medium',
        marginBottom: 8,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    balanceValue: {
        fontSize: 32,
        fontFamily: 'Outfit-Bold',
    },
    tierIndicator: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
    },
    tierIndicatorText: {
        color: '#FFF',
        fontSize: 14,
        fontFamily: 'Outfit-Bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Outfit-Bold',
        marginBottom: 16,
    },
    table: {
        borderWidth: 1,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
    },
    tableHeader: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
    },
    headerCell: {
        fontSize: 12,
        fontFamily: 'Outfit-Bold',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    cell: {
        justifyContent: 'center',
    },
    tierName: {
        fontSize: 15,
        fontFamily: 'Outfit-Bold',
    },
    tierRange: {
        fontSize: 11,
        fontFamily: 'Outfit-Regular',
    },
    multiplierText: {
        fontSize: 15,
        fontFamily: 'Outfit-Bold',
        textAlign: 'center',
    },
    benefitText: {
        fontSize: 12,
        fontFamily: 'Outfit-Medium',
        lineHeight: 16,
    },
    infoBox: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 8,
        marginBottom: 40,
    },
    infoText: {
        fontSize: 13,
        fontFamily: 'Outfit-Regular',
        lineHeight: 18,
        flex: 1,
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1,
    },
    doneButton: {
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
    },
});
