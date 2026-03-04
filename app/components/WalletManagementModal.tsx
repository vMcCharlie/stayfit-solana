import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Pressable,
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/theme";
import { useAuth } from "../../src/context/auth";
import CustomAlert from "./CustomAlert";

interface WalletManagementModalProps {
    visible: boolean;
    onClose: () => void;
    walletAddress: string | null;
}

export default function WalletManagementModal({
    visible,
    onClose,
    walletAddress,
}: WalletManagementModalProps) {
    const { isDarkMode, selectedPalette } = useTheme();
    const { disconnectWallet } = useAuth();
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: "",
        message: "",
        buttons: [] as any[],
    });

    const colors = {
        surface: isDarkMode ? "#1A1A1A" : "#FFFFFF",
        text: isDarkMode ? "#FFFFFF" : "#1A1A1A",
        textSecondary: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
        border: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        error: "#FF5252",
    };

    const handleDisconnect = () => {
        setAlertConfig({
            visible: true,
            title: "Disconnect Wallet",
            message: "Are you sure you want to disconnect your Solana wallet? You will lose access to your XP multipliers and token giveaways until you reconnect.",
            buttons: [
                {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => setAlertConfig({ ...alertConfig, visible: false }),
                },
                {
                    text: "Disconnect",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await disconnectWallet();
                            setAlertConfig({ ...alertConfig, visible: false });
                            onClose();
                        } catch (err) {
                            console.error("Failed to disconnect wallet:", err);
                        }
                    },
                },
            ],
        });
    };

    return (
        <>
            <Modal
                visible={visible}
                transparent={true}
                animationType="fade"
                onRequestClose={onClose}
            >
                <Pressable style={styles.modalOverlay} onPress={onClose}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <View style={[styles.modalIconBg, { backgroundColor: selectedPalette.primary + '20' }]}>
                                <Ionicons name="wallet" size={32} color={selectedPalette.primary} />
                            </View>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Solana Wallet</Text>
                            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                                {walletAddress ? "Connected & Active" : "Manage your connection"}
                            </Text>
                        </View>

                        <View style={[styles.addressCard, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]}>
                            <Text style={[styles.addressLabel, { color: colors.textSecondary }]}>Wallet Address</Text>
                            <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={1} ellipsizeMode="middle">
                                {walletAddress || "Not Connected"}
                            </Text>
                        </View>

                        <ScrollView style={styles.infoList} showsVerticalScrollIndicator={false}>
                            <View style={styles.infoItem}>
                                <Ionicons name="flash" size={20} color={selectedPalette.primary} />
                                <View style={styles.infoTextWrapper}>
                                    <Text style={[styles.infoItemTitle, { color: colors.text }]}>XP Multiplier</Text>
                                    <Text style={[styles.infoItemDesc, { color: colors.textSecondary }]}>
                                        Connected wallets holding SKR tokens receive up to 5x boost on all earned XP.
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.infoItem}>
                                <Ionicons name="gift" size={20} color="#FFD700" />
                                <View style={styles.infoTextWrapper}>
                                    <Text style={[styles.infoItemTitle, { color: colors.text }]}>$GAINS Distribution</Text>
                                    <Text style={[styles.infoItemDesc, { color: colors.textSecondary }]}>
                                        Your connected wallet will be used for the upcoming $GAINS token giveaways based on your XP balance.
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.infoItem}>
                                <Ionicons name="shield-checkmark" size={20} color="#00E5FF" />
                                <View style={styles.infoTextWrapper}>
                                    <Text style={[styles.infoItemTitle, { color: colors.text }]}>Verified Activity</Text>
                                    <Text style={[styles.infoItemDesc, { color: colors.textSecondary }]}>
                                        Blockchain verification ensures your fitness achievements are authentic and immutable.
                                    </Text>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.disconnectBtn, { borderColor: colors.error }]}
                                onPress={handleDisconnect}
                            >
                                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                                <Text style={[styles.disconnectBtnText, { color: colors.error }]}>Disconnect Wallet</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.closeBtn, { backgroundColor: selectedPalette.primary }]}
                                onPress={onClose}
                            >
                                <Text style={styles.closeBtnText}>Done</Text>
                            </TouchableOpacity>
                        </View>
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
        </>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        width: "100%",
        borderRadius: 28,
        padding: 24,
        maxHeight: "80%",
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
    addressCard: {
        width: "100%",
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        alignItems: "center",
    },
    addressLabel: {
        fontFamily: "Outfit-Medium",
        fontSize: 12,
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    addressText: {
        fontFamily: "Outfit-Bold",
        fontSize: 16,
    },
    infoList: {
        width: "100%",
        marginBottom: 24,
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 16,
        marginBottom: 20,
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
    footer: {
        gap: 12,
    },
    disconnectBtn: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        gap: 8,
    },
    disconnectBtnText: {
        fontFamily: "Outfit-Bold",
        fontSize: 16,
    },
    closeBtn: {
        width: "100%",
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: "center",
    },
    closeBtnText: {
        color: "#FFF",
        fontFamily: "Outfit-Bold",
        fontSize: 16,
    },
});
