import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Clipboard,
  Platform,
  Alert,
} from "react-native";
import { useTheme } from "../../src/context/theme";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import * as Sharing from "expo-sharing";
import ViewShot, { ViewShotProperties } from "react-native-view-shot";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAlert, { AlertButton } from "./CustomAlert";
import { useCustomAlert } from "../../src/hooks/useCustomAlert";
import Animated, { SlideInRight, SlideOutRight } from "react-native-reanimated";

interface ShareProfileProps {
  username: string;
  visible: boolean;
  onClose: () => void;
}

type ViewShotType = {
  capture: () => Promise<string>;
} & ViewShot;

export default function ShareProfile({
  username,
  visible,
  onClose,
}: ShareProfileProps) {
  const { isDarkMode, selectedPalette } = useTheme();
  const qrRef = useRef<ViewShotType>(null);
  const { alertProps, showAlert, hideAlert } = useCustomAlert();

  const closeAlert = hideAlert;

  const colors = {
    background: isDarkMode
      ? selectedPalette.dark.background
      : selectedPalette.light.background,
    surface: isDarkMode
      ? selectedPalette.dark.surface
      : selectedPalette.light.surface,
    surfaceSecondary: isDarkMode
      ? `${selectedPalette.primary}15` // 15 is hex for 8% opacity
      : `${selectedPalette.primary}10`, // 10 is hex for 6% opacity
    text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
    textSecondary: isDarkMode
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(0, 0, 0, 0.6)",
    border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
  };

  const handleCopyLink = () => {
    Clipboard.setString(`@${username}`);
    showAlert("Copied!", "Username copied to clipboard");
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my fitness journey on StayFit! @${username}`,
        url: `stayfit://profile/${username}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleDownload = async () => {
    try {
      const ref = qrRef.current;
      if (!ref) return;

      const uri = await ref.capture();
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("Error downloading QR:", error);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      entering={SlideInRight}
      exiting={SlideOutRight}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close-outline" size={32} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Share Profile
          </Text>
          <View style={styles.closeButton} />
        </View>

        {/* QR Code Container */}
        <ViewShot ref={qrRef} style={styles.qrContainer}>
          <View
            style={[
              styles.qrCard,
              { backgroundColor: selectedPalette.primary },
            ]}
          >
            <QRCode
              value={`stayfit://profile/${username}`}
              size={200}
              color="white"
              backgroundColor={selectedPalette.primary}
              logo={require("../../assets/images/logo-white.png")}
              logoSize={50}
              logoBackgroundColor={selectedPalette.primary}
              logoBorderRadius={12}
            />
            <Text style={[styles.username, { color: "white" }]}>
              @{username}
            </Text>
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.surfaceSecondary },
            ]}
            onPress={handleShare}
          >
            <Ionicons
              name="share-social-outline"
              size={24}
              color={selectedPalette.primary}
            />
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Share profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.surfaceSecondary },
            ]}
            onPress={handleCopyLink}
          >
            <Ionicons
              name="link-outline"
              size={24}
              color={selectedPalette.primary}
            />
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Copy link
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.surfaceSecondary },
            ]}
            onPress={handleDownload}
          >
            <Ionicons
              name="download-outline"
              size={24}
              color={selectedPalette.primary}
            />
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Download
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text
            style={[styles.instructionText, { color: colors.textSecondary }]}
          >
            Share your QR code to connect with friends on StayFit
          </Text>
        </View>
      </SafeAreaView>
      <CustomAlert {...alertProps} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  qrContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  qrCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  username: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: "Outfit-Bold",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  actionButton: {
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    minWidth: 100,
  },
  buttonText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: "Outfit-Medium",
  },
  instructions: {
    alignItems: "center",
    paddingBottom: 32,
    paddingHorizontal: 32,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
    textAlign: "center",
  },
});
