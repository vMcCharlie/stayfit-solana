import React, { useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    BackHandler,
} from "react-native";
import Animated, {
    FadeIn,
    FadeOut,
    SlideInUp,
    SlideOutDown,
} from "react-native-reanimated";
import { useTheme } from "../../src/context/theme";

export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: "default" | "cancel" | "destructive";
}

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message?: string;
    buttons?: AlertButton[];
    onClose?: () => void;
}

export default function CustomAlert({
    visible,
    title,
    message,
    buttons = [{ text: "OK", style: "default" }],
    onClose,
}: CustomAlertProps) {
    const { isDarkMode, selectedPalette } = useTheme();

    const colors = {
        background: isDarkMode
            ? selectedPalette.dark.background
            : selectedPalette.light.background,
        surface: isDarkMode
            ? isDarkMode ? "#1F1F1F" : selectedPalette.dark.surface
            : selectedPalette.light.surface,
        surfaceSecondary: isDarkMode
            ? "#2A2A2A"
            : selectedPalette.light.surface,
        text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
        textSecondary: isDarkMode
            ? "rgba(255, 255, 255, 0.7)"
            : "rgba(0, 0, 0, 0.6)",
    };

    useEffect(() => {
        if (!visible) return;

        const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
            if (onClose) {
                onClose();
                return true;
            }
            return false;
        });

        return () => backHandler.remove();
    }, [visible, onClose]);

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={[styles.overlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
            >
                <Animated.View
                    entering={SlideInUp.duration(300)}
                    exiting={SlideOutDown.duration(200)}
                    style={[
                        styles.container,
                        {
                            backgroundColor: colors.surface,
                        },
                    ]}
                >
                    <View style={styles.content}>
                        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                        {message && (
                            <Text style={[styles.message, { color: colors.textSecondary }]}>
                                {message}
                            </Text>
                        )}
                        <View style={styles.actions}>
                            {buttons.map((button, index) => {
                                const isCancel = button.style === "cancel";
                                const isDestructive = button.style === "destructive";

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.button,
                                            isCancel ? styles.cancelButton : styles.defaultButton,
                                            isCancel && { backgroundColor: colors.surfaceSecondary },
                                            !isCancel && !isDestructive && { backgroundColor: selectedPalette.primary },
                                            !isCancel && isDestructive && { backgroundColor: "#FF3B30" }, // Red for destructive
                                        ]}
                                        onPress={() => {
                                            button.onPress?.();
                                            if (onClose && !button.onPress) onClose();
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.buttonText,
                                                {
                                                    color: isCancel ? colors.text : "#FFFFFF",
                                                },
                                            ]}
                                        >
                                            {button.text}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: "85%",
        borderRadius: 24,
        overflow: "hidden",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    content: {
        padding: 24,
        alignItems: "center",
    },
    title: {
        fontSize: 20,
        fontFamily: "Outfit-Bold",
        marginBottom: 8,
        textAlign: "center",
    },
    message: {
        fontSize: 16,
        fontFamily: "Outfit-Regular",
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 12,
        width: "100%",
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 100,
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
    },
    defaultButton: {
        // Background color handled dynamically
    },
    cancelButton: {
        // Background color handled dynamically
    },
    buttonText: {
        fontSize: 16,
        fontFamily: "Outfit-SemiBold",
    },
});
