import React, { useState } from "react";
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    Platform,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { updateOnboardingStep } from "../../src/lib/onboarding";
import { useTheme } from "../../src/context/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Using the same APP_IDENTITY from auth.tsx
const APP_IDENTITY = {
    name: "StayFit",
    uri: "https://gostay.fit",
    icon: "favicon.ico",
};

export default function WalletScreen() {
    const router = useRouter();
    const { isDarkMode, selectedPalette } = useTheme();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

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
        surfaceSecondary: isDarkMode
            ? `${selectedPalette.primary}15`
            : `${selectedPalette.primary}10`,
        border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        inputBackground: isDarkMode ? "rgba(255,255,255,0.05)" : "#F5F5F5",
    };

    const handleBack = () => {
        router.back();
    };

    const connectWallet = async () => {
        try {
            setLoading(true);
            let transact: any;
            try {
                const mwa = require("@solana-mobile/mobile-wallet-adapter-protocol-web3js");
                transact = mwa.transact;
            } catch (importErr) {
                console.warn("Solana Mobile Wallet Adapter not available");
                alert("Wallet connection is not available in this environment.");
                setLoading(false);
                return;
            }

            const { PublicKey } = require("@solana/web3.js");
            let newWalletAddress = "";
            let signatureBase64 = "";

            await transact(async (wallet: any) => {
                const authorizationResult = await wallet.authorize({
                    cluster: "mainnet-beta",
                    identity: APP_IDENTITY,
                });

                const addressUint8 = authorizationResult.accounts[0].address;
                const { Buffer } = require("buffer");
                newWalletAddress = new PublicKey(Buffer.from(addressUint8, 'base64')).toBase58();
                const authToken = authorizationResult.auth_token;

                // Save auth token temporarily so we can link it correctly when user signs up
                if (authToken) {
                    await AsyncStorage.setItem(`temp_wallet_auth_token`, authToken);
                }

                // Temporary signature for testing connectivity - user doesn't have an ID yet 
                // so we won't strictly enforce DB signature verification until they log in/create profile.
                // The edge function `redeem_referral` and others might verify ownership if we passed the ID.
                const tempId = "new_user_" + Date.now();
                const message = `Sign-in to StayFit Seeker: ${tempId} at ${Date.now()}`;
                const messageUint8 = new TextEncoder().encode(message);

                try {
                    // Try to grab a signature to prove ownership
                    const signResult = await wallet.signMessages({
                        addresses: [addressUint8],
                        payloads: [messageUint8],
                    });
                    const signatureUint8 = signResult.signatures[0];
                    signatureBase64 = Buffer.from(signatureUint8).toString("base64");
                } catch (e) {
                    // Non-fatal right now during onboarding since they haven't actually created the database row
                    console.warn("User declined signature during onboarding", e);
                }
            });

            console.log("Connected wallet address during onboarding:", newWalletAddress);
            setConnectedAddress(newWalletAddress);

            // Note: Since user has requested "auth and other details stays locally saved, so that we can use them later on if needed"
            // we save the signature to local storage too!
            await AsyncStorage.setItem('temp_wallet_address', newWalletAddress);
            if (signatureBase64) {
                await AsyncStorage.setItem('temp_wallet_signature', signatureBase64);
            }

            // Save the step
            await updateOnboardingStep("wallet" as any, {
                wallet_address: newWalletAddress,
            } as any);

            // Successfully connected - proceed with a slight delay so user sees "Connected!"
            setTimeout(() => {
                router.push("/onboarding/account");
            }, 1000);

        } catch (err: any) {
            console.error("Wallet connection failed during onboarding", err);
            // Optionally show error 
            alert("Connection failed: " + (err.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        // Just proceed without wallet
        await updateOnboardingStep("wallet" as any, {});
        router.push("/onboarding/account");
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />

            <View style={[styles.content, { backgroundColor: colors.background }]}>
                {/* Top Navigation Bar */}
                <Animated.View entering={FadeIn.duration(300)} style={styles.topSection}>
                    {/* Section Title */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Earn</Text>

                    {/* Segmented Progress Bar */}
                    <View style={styles.progressSegments}>
                        <View style={[styles.segment, styles.segmentSmall, { backgroundColor: selectedPalette.primary }]} />
                        <View style={[styles.segment, styles.segmentLarge, { backgroundColor: selectedPalette.primary }]} />
                        <View style={[styles.segment, styles.segmentMedium, { backgroundColor: selectedPalette.primary }]} />
                        <View style={[styles.segment, styles.segmentMedium, { backgroundColor: selectedPalette.primary }]} />
                        <View style={[styles.segment, styles.segmentSmall, { backgroundColor: colors.surfaceSecondary }]} />
                    </View>
                </Animated.View>

                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                >
                    <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.mainBox}>

                        <View style={[styles.iconContainer, { backgroundColor: `${selectedPalette.primary}20` }]}>
                            <Ionicons name="wallet-outline" size={60} color={selectedPalette.primary} />
                        </View>

                        {/* Page Heading */}
                        <Text style={[styles.pageHeading, { color: colors.text }]}>Connect your Wallet</Text>

                        <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
                            Connect your Solana wallet to seamlessly earn SKR tokens for hitting your fitness goals.
                        </Text>

                        <View style={[styles.perksBox, { backgroundColor: colors.inputBackground }]}>
                            <View style={styles.perkRow}>
                                <Ionicons name="flash-outline" size={20} color={selectedPalette.primary} />
                                <Text style={[styles.perkText, { color: colors.textSecondary }]}>Earn XP multipliers by holding SKR</Text>
                            </View>
                            <View style={styles.perkRow}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={selectedPalette.primary} />
                                <Text style={[styles.perkText, { color: colors.textSecondary }]}>Secure non-custodial ownership</Text>
                            </View>
                        </View>

                    </Animated.View>
                </ScrollView>

                {/* Bottom Buttons */}
                <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: colors.inputBackground }]}
                        onPress={handleBack}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[
                                styles.connectButton,
                                { backgroundColor: selectedPalette.primary },
                                loading && styles.buttonDisabled
                            ]}
                            onPress={connectWallet}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.connectButtonText}>{connectedAddress ? 'Connected!' : 'Connect Wallet'}</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.skipButton, { borderColor: colors.border }]}
                            onPress={handleSkip}
                            disabled={loading}
                        >
                            <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>Connect Later</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    topSection: {
        paddingTop: Platform.OS === "ios" ? 20 : 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: "Outfit-SemiBold",
        textAlign: "center",
        marginBottom: 16,
    },
    progressSegments: {
        flexDirection: "row",
        gap: 6,
        marginBottom: 24,
    },
    segment: {
        height: 4,
        borderRadius: 2,
    },
    segmentSmall: {
        flex: 0.5,
    },
    segmentMedium: {
        flex: 1.2,
    },
    segmentLarge: {
        flex: 2,
    },
    pageHeading: {
        fontSize: 28,
        fontFamily: "Outfit-Bold",
        marginBottom: 16,
        textAlign: 'center',
    },
    pageSubtitle: {
        fontSize: 15,
        fontFamily: "Outfit-Regular",
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingBottom: 20,
        flexGrow: 1,
        justifyContent: 'center',
    },
    mainBox: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    perksBox: {
        padding: 20,
        borderRadius: 16,
        width: '100%',
        gap: 16,
    },
    perkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    perkText: {
        fontSize: 14,
        fontFamily: "Outfit-Medium",
    },
    bottomBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 16,
        gap: 16,
    },
    backButton: {
        width: 56,
        height: 116, // Tall enough to match both buttons
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
    },
    actionButtons: {
        flex: 1,
        gap: 10,
    },
    connectButton: {
        height: 52,
        borderRadius: 26,
        justifyContent: "center",
        alignItems: "center",
    },
    connectButtonText: {
        color: "white",
        fontSize: 16,
        fontFamily: "Outfit-Bold",
    },
    skipButton: {
        height: 52,
        borderRadius: 26,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    skipButtonText: {
        fontSize: 16,
        fontFamily: "Outfit-SemiBold",
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
