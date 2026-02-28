import React from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../src/context/theme";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function SuccessScreen() {
  const { isDarkMode, selectedPalette } = useTheme();

  const handleGoToDashboard = () => {
    Haptics.selectionAsync();
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView
      style={[styles.container, isDarkMode && styles.darkContainer]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={styles.content}>
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.topSection}
        >
          <View style={styles.headerContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: "100%" }]} />
            </View>
            <Text style={[styles.progressText, isDarkMode && styles.darkText]}>
              10/10
            </Text>
          </View>
        </Animated.View>

        <View style={styles.mainContent}>
          <Animated.View entering={FadeInDown.duration(800)}>
            <Text style={[styles.title, isDarkMode && styles.darkText]}>
              You're all set!
            </Text>
            <Text style={[styles.subtitle, isDarkMode && styles.darkSubtitle]}>
              Your personalized fitness journey begins now
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(900).delay(300)}
            style={styles.cardContainer}
          >
            <LinearGradient
              colors={[selectedPalette.primary, `${selectedPalette.primary}99`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardBrand}>STAYFIT</Text>
                <Text style={styles.cardMembershipText}>PREMIUM MEMBER</Text>
              </View>

              <View style={styles.cardMiddle}>
                <View style={styles.cardLogoBox}>
                  <Ionicons name="fitness" size={40} color="#fff" />
                </View>
                <View style={styles.cardInfoBox}>
                  <Text style={styles.cardInfoLabel}>JOINED</Text>
                  <Text style={styles.cardInfoValue}>
                    {new Date().toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.cardThemeName}>{selectedPalette.name}</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(900).delay(600)}
            style={styles.messageContainer}
          >
            <Text style={[styles.message, isDarkMode && styles.darkText]}>
              Your membership card has been created with your selected theme.
              You're ready to start your fitness journey!
            </Text>
          </Animated.View>
        </View>

        <View
          style={[
            styles.bottomButtonContainer,
            isDarkMode && styles.darkBottomContainer,
          ]}
        >
          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: selectedPalette.primary },
            ]}
            onPress={handleGoToDashboard}
          >
            <Text style={styles.nextButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  darkContainer: {
    backgroundColor: "#1A1C1E",
  },
  content: {
    flex: 1,
  },
  topSection: {
    paddingTop: Platform.OS === "ios" ? 20 : 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    marginRight: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 2,
  },
  progressText: {
    color: "#666666",
    fontSize: 14,
    fontFamily: "Outfit-Medium",
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontFamily: "Outfit-Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    color: "#666666",
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 40,
  },
  darkText: {
    color: "#FFFFFF",
  },
  darkSubtitle: {
    color: "#AAAAAA",
  },
  cardContainer: {
    width: width - 48,
    aspectRatio: 1.6,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  cardGradient: {
    width: "100%",
    height: "100%",
    padding: 20,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardBrand: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "Outfit-Bold",
  },
  cardMembershipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Outfit-Medium",
    opacity: 0.8,
  },
  cardMiddle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLogoBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfoBox: {
    alignItems: "flex-end",
  },
  cardInfoLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Outfit-Regular",
    opacity: 0.7,
  },
  cardInfoValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Outfit-Bold",
  },
  cardFooter: {
    alignItems: "flex-end",
  },
  cardThemeName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    opacity: 0.9,
  },
  messageContainer: {
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    marginBottom: 20,
  },
  message: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
  },
  bottomButtonContainer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  darkBottomContainer: {
    backgroundColor: "#1A1C1E",
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  nextButton: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },
});
