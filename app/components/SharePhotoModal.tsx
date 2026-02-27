import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    ImageBackground,
    Platform,
    Dimensions
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { format } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/context/theme";
import { api } from "../../src/services/api";

interface SharePhotoModalProps {
    visible: boolean;
    photoUrl: string;
    photoDate: string; // ISO String
    onClose: () => void;
}

export default function SharePhotoModal({
    visible,
    photoUrl,
    photoDate,
    onClose,
}: SharePhotoModalProps) {
    const { isDarkMode, selectedPalette } = useTheme();
    const insets = useSafeAreaInsets();
    const viewShotRef = useRef<ViewShot>(null);

    // Weighted logic removed per user request
    const [sharing, setSharing] = useState(false);



    const handleShare = async () => {
        if (sharing) return;
        setSharing(true);
        try {
            if (viewShotRef.current) {
                // Wait a tick for rendering updates if needed
                await new Promise(resolve => setTimeout(resolve, 100));

                const uri = await captureRef(viewShotRef, {
                    format: "png",
                    quality: 1.0,
                    result: "tmpfile"
                });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri);
                }
            }
        } catch (error) {
            console.error("Error sharing photo card:", error);
            alert("Failed to generate share image");
        } finally {
            setSharing(false);
        }
    };



    if (!visible) return null;

    const formattedDate = format(new Date(photoDate), "EEEE, d MMMM yyyy");

    // 9:16 Aspect Ratio Card
    // Fixed width 400 for consistency in ViewShot, we scale it down for preview if needed
    // Actually for ViewShot it's better to have exact pixels. 
    // We render it completely invisible (off-screen) for capture? 
    // User said "show a rendered image for the card", so we should show the preview.

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={StyleSheet.absoluteFill} />

                {/* Header with Close */}
                <View style={[styles.header, { marginTop: insets.top }]}>
                    <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <Ionicons name="close" size={24} color={isDarkMode ? '#FFF' : '#000'} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFF' : '#000' }]}>Share Progress</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Card Container - We capture THIS view */}
                <View style={styles.cardWrapper}>
                    <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
                        <View style={[styles.card, { backgroundColor: '#000' }]}>

                            {/* Full Background Image */}
                            <Image
                                source={{ uri: photoUrl }}
                                style={StyleSheet.absoluteFill}
                                resizeMode="cover"
                            />

                            {/* Overlay Gradient */}
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                                style={StyleSheet.absoluteFill}
                            />

                            {/* Top Content: Date */}
                            <View style={styles.cardHeader}>
                                <View style={styles.dateBadge}>
                                    <Text style={styles.dateText}>{formattedDate}</Text>
                                </View>
                            </View>

                            {/* Bottom Content: Logo & Info */}
                            <View style={styles.cardFooter}>
                                <View style={styles.logoRow}>
                                    <Image
                                        source={require("../../assets/images/logo-white.png")}
                                        style={styles.logo}
                                        resizeMode="contain"
                                    />
                                    <Text style={styles.appName}>Stay Fit</Text>
                                </View>


                            </View>
                        </View>
                    </ViewShot>
                </View>

                {/* Options & Action */}
                <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>


                    <TouchableOpacity
                        style={[styles.shareButton, { backgroundColor: selectedPalette.primary }]}
                        onPress={handleShare}
                        disabled={sharing}
                    >
                        {sharing ? (
                            <Text style={styles.shareButtonText}>Preparing...</Text>
                        ) : (
                            <>
                                <Ionicons name="share-social" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.shareButtonText}>Share</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(320, SCREEN_WIDTH * 0.75); // Fits well on screen
const CARD_HEIGHT = CARD_WIDTH * (16 / 9);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 10, // Reduced margin
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Outfit-Bold',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardWrapper: {
        // We render it at a specific size for aspect ratio 9:16
        // Keep it visible for preview
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 0, // ViewShot capture usually rectangular, container rounds it
        position: 'relative',
        justifyContent: 'space-between'
    },
    cardHeader: {
        padding: 24,
        paddingTop: 40, // More top padding
        alignItems: 'center',
    },
    dateBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    dateText: {
        color: '#FFF',
        fontFamily: 'Outfit-Medium',
        fontSize: 14
    },
    cardFooter: {
        padding: 32,
        paddingBottom: 40,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    logo: {
        width: 24,
        height: 24,
        marginBottom: -4 // visual alignment
    },
    appName: {
        color: '#FFF',
        fontSize: 24,
        fontFamily: 'Outfit-Bold',
        marginLeft: 12,
    },

    controls: {
        width: '100%',
        paddingHorizontal: 24,
        marginTop: 24,
    },

    shareButton: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    shareButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: 'Outfit-Bold',
    }
});
