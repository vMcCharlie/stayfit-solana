import React, { useState, useEffect } from "react";
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/theme";
import { useAuth } from "../../src/context/auth";
import { api } from "../../src/services/api";
import WalletManagementModal from "./WalletManagementModal";

export default function NavWalletButton() {
    const { isDarkMode, selectedPalette } = useTheme();
    const { connectWallet, user, profileUpdated } = useAuth();
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const colors = {
        text: isDarkMode ? "#FFFFFF" : "#1A1A1A",
        primary: selectedPalette.primary,
        bg: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    };

    const fetchWalletAddress = async () => {
        try {
            const { profile } = await api.getProfile();
            if (profile?.wallet_address) {
                setWalletAddress(profile.wallet_address);
            } else {
                setWalletAddress(null);
            }
        } catch (err) {
            console.error("Failed to fetch wallet address:", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchWalletAddress();
        }
    }, [user, profileUpdated]);

    const handlePress = async () => {
        if (walletAddress) {
            setModalVisible(true);
        } else {
            try {
                setIsConnecting(true);
                await connectWallet();
            } catch (err) {
                console.error("Connection failed:", err);
            } finally {
                setIsConnecting(false);
            }
        }
    };

    return (
        <>
            <TouchableOpacity
                style={[styles.container, { backgroundColor: colors.bg }]}
                onPress={handlePress}
                disabled={isConnecting}
            >
                {isConnecting ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <>
                        <Ionicons
                            name={walletAddress ? "shield-checkmark" : "wallet-outline"}
                            size={18}
                            color={walletAddress ? colors.primary : colors.text}
                        />
                        <Text style={[styles.text, { color: colors.text }]}>
                            {walletAddress ? "Connected" : "Connect"}
                        </Text>
                    </>
                )}
            </TouchableOpacity>

            <WalletManagementModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                walletAddress={walletAddress}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    text: {
        fontFamily: "Outfit-Bold",
        fontSize: 13,
    },
});
