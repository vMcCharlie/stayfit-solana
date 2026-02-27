import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../src/context/theme";
import { Ionicons } from "@expo/vector-icons";

interface ScreenHeaderProps {
    title?: string;
    rightAction?: React.ReactNode;
    leftAction?: React.ReactNode;
    showLogo?: boolean;
}

export default function ScreenHeader({
    title = "Stay Fit",
    rightAction,
    leftAction,
    showLogo = true
}: ScreenHeaderProps) {
    const { isDarkMode, selectedPalette } = useTheme();

    const colors = {
        text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
    };

    return (
        <View style={styles.headerContainer}>
            <View style={styles.headerLeft}>
                {leftAction ? (
                    leftAction
                ) : (
                    showLogo && (
                        <Image
                            source={
                                isDarkMode
                                    ? require("../../assets/images/logo-white.png")
                                    : require("../../assets/images/logo-black.png")
                            }
                            style={styles.logo}
                        />
                    )
                )}
                <Text style={[styles.headerTitle, { color: colors.text, marginLeft: leftAction ? 12 : 0 }]}>
                    {title}
                </Text>
            </View>
            <View style={styles.headerActions}>
                {rightAction}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 6,
        minHeight: 52,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    logo: {
        width: 28,
        height: 28,
        resizeMode: "contain",
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: "Outfit-Bold",
    },
    headerActions: {
        flexDirection: "row",
        gap: 16,
        alignItems: 'center',
    },
});
