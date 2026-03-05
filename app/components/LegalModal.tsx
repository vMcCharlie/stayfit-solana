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

interface LegalModalProps {
    visible: boolean;
    onClose: () => void;
    type: 'terms' | 'privacy';
}

export default function LegalModal({ visible, onClose, type }: LegalModalProps) {
    const { isDarkMode, selectedPalette } = useTheme();

    const colors = {
        background: isDarkMode ? '#121212' : '#FFFFFF',
        text: isDarkMode ? '#FFFFFF' : '#1A1A1A',
        textSecondary: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
        surface: isDarkMode ? '#1E1E1E' : '#F8F9FA',
        border: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    };

    const content = {
        terms: {
            title: 'Terms of Use',
            lastUpdated: 'March 7, 2026',
            sections: [
                {
                    title: '1. Acceptance of Terms',
                    body: 'By accessing or using StayFit, you agree to be bound by these Terms of Use. If you do not agree to all of these terms, do not use our services.',
                },
                {
                    title: '2. Description of Service',
                    body: 'StayFit provides users with fitness tracking, workout routines, and social features. We reserve the right to modify or discontinue the service at any time.',
                },
                {
                    title: '3. User Conduct',
                    body: 'You are responsible for all your activity in connection with the service. You shall not use the service for any illegal or unauthorized purpose.',
                },
                {
                    title: '4. Privacy',
                    body: 'Your use of the service is also governed by our Privacy Policy, which is incorporated into these terms by reference.',
                },
                {
                    title: '5. Limitation of Liability',
                    body: 'StayFit shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the service.',
                },
            ],
        },
        privacy: {
            title: 'Privacy Policy',
            lastUpdated: 'March 7, 2026',
            sections: [
                {
                    title: '1. Information We Collect',
                    body: 'We collect information you provide directly to us, such as when you create an account, update your profile, or log a workout. We also collect usage data automatically.',
                },
                {
                    title: '2. How We Use Information',
                    body: 'We use the information we collect to provide and maintain our services, personalize your experience, and improve our app.',
                },
                {
                    title: '3. Data Sharing',
                    body: 'We do not share your personal information with third parties except as described in this policy or with your consent.',
                },
                {
                    title: '4. Data Security',
                    body: 'We take reasonable measures to help protect your personal information from loss, theft, misuse, and unauthorized access.',
                },
                {
                    title: '5. Your Choices',
                    body: 'You can access and update certain information through your account settings. You can also contact us for data deletion requests.',
                },
            ],
        },
    };

    const currentContent = content[type];

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
                    entering={SlideInUp.springify().damping(20)}
                    exiting={SlideOutDown.duration(200)}
                    style={[styles.container, { backgroundColor: colors.background }]}
                >
                    <View style={styles.header}>
                        <View style={styles.headerIndicator} />
                        <View style={styles.headerTop}>
                            <Text style={[styles.title, { color: colors.text }]}>{currentContent.title}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
                            Last updated: {currentContent.lastUpdated}
                        </Text>
                    </View>

                    <ScrollView
                        style={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollInner}
                    >
                        {currentContent.sections.map((section, index) => (
                            <View key={index} style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                                <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>{section.body}</Text>
                            </View>
                        ))}

                        <View style={styles.footerInfo}>
                            <Ionicons name="shield-checkmark-outline" size={48} color={selectedPalette.primary} />
                            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                                StayFit is committed to protecting your data and ensuring a safe fitness environment.
                            </Text>
                        </View>
                    </ScrollView>

                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <TouchableOpacity
                            style={[styles.doneButton, { backgroundColor: selectedPalette.primary }]}
                            onPress={onClose}
                        >
                            <Text style={styles.doneButtonText}>Done</Text>
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
        height: '85%',
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
    lastUpdated: {
        fontSize: 14,
        fontFamily: 'Outfit-Regular',
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    scrollContent: {
        flex: 1,
    },
    scrollInner: {
        padding: 24,
        paddingTop: 8,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Outfit-Bold',
        marginBottom: 8,
    },
    sectionBody: {
        fontSize: 15,
        fontFamily: 'Outfit-Regular',
        lineHeight: 22,
    },
    footerInfo: {
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    footerText: {
        textAlign: 'center',
        marginTop: 16,
        fontSize: 14,
        fontFamily: 'Outfit-Medium',
        lineHeight: 20,
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
