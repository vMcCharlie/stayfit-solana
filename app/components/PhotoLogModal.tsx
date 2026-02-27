import React from "react";
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/theme";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useCustomAlert } from "../../src/hooks/useCustomAlert";
import CustomAlert from "./CustomAlert";

const { width } = Dimensions.get("window");

interface PhotoLogModalProps {
    isVisible: boolean;
    onClose: () => void;
    onPhotoSelected: (uri: string) => void;
}

export default function PhotoLogModal({
    isVisible,
    onClose,
    onPhotoSelected,
}: PhotoLogModalProps) {
    const { isDarkMode, selectedPalette } = useTheme();
    const { alertProps, showAlert } = useCustomAlert();

    const colors = {
        overlay: "rgba(0, 0, 0, 0.5)",
        surface: isDarkMode ? selectedPalette.dark.surface : "#FFFFFF",
        text: isDarkMode ? selectedPalette.dark.text : "#000000",
        textSecondary: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
        primary: selectedPalette.primary,
        buttonBackground: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
    };



    // ... existing imports

    const pickImage = async (useCamera: boolean) => {
        try {
            let result;
            if (useCamera) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    showAlert('Permission Required', 'Sorry, we need camera permissions to make this work!');
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    allowsEditing: true, // Allows user to crop if they want
                    aspect: [3, 4],
                    quality: 1, // Capture high quality initially, we compress later
                });
            } else {
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [3, 4],
                    quality: 1,
                });
            }

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const originalUri = result.assets[0].uri;

                // Client-side compression & resizing
                // Max 1500px width/height, JPEG 0.8
                const manipulatedResult = await ImageManipulator.manipulateAsync(
                    originalUri,
                    [{ resize: { width: 1500 } }], // Resize width to 1500 (height auto-scales)
                    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
                );

                onPhotoSelected(manipulatedResult.uri);
                onClose();
            }
        } catch (error) {
            console.error("Error picking photo", error);
            showAlert("Error", "Error selecting photo");
        }
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Log Progress Photo</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.contentContainer}>
                        {/* Center Visual - "Face Scan" Style - Scaled down */}
                        <View style={styles.scanContainer}>
                            <View style={[styles.scanRing, { borderColor: colors.primary }]}>
                                <View style={[styles.scanInner, { borderColor: isDarkMode ? '#FFF' : '#E0E0E0' }]}>
                                    <MaterialCommunityIcons name="line-scan" size={48} color={colors.primary} />
                                </View>
                            </View>
                        </View>

                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Capture your progress
                        </Text>

                        <View style={styles.buttonsContainer}>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                onPress={() => pickImage(true)}
                            >
                                <Ionicons name="camera" size={24} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.actionButtonText}>Open Camera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.buttonBackground, marginTop: 12 }]}
                                onPress={() => pickImage(false)}
                            >
                                <Ionicons name="images" size={24} color={colors.text} style={{ marginRight: 8 }} />
                                <Text style={[styles.actionButtonText, { color: colors.text }]}>Choose from Gallery</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
            <CustomAlert {...alertProps} />
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 32,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        position: 'relative'
    },
    title: {
        fontSize: 20,
        fontFamily: 'Outfit-Bold',
    },
    closeButton: {
        position: 'absolute',
        right: 0,
        padding: 4,
    },
    contentContainer: {
        width: '100%',
        alignItems: 'center',
    },
    scanContainer: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    scanRing: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
    },
    scanInner: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Outfit-Medium',
        textAlign: 'center',
        marginBottom: 32,
    },
    buttonsContainer: {
        width: '100%',
    },
    actionButton: {
        width: '100%',
        height: 56,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
    }
});
