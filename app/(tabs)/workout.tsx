import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/context/theme";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { api, UserProfile } from "../../src/services/api";
import { format } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WeightLogModal from "../components/WeightLogModal";
import PhotoLogModal from "../components/PhotoLogModal";
import CreateRoutineModal from "../components/CreateRoutineModal";
import ScreenHeader from "../components/ScreenHeader";
import { ScaleIcon, CameraIcon, AddIcon } from "../components/TabIcons";
import { ThemeBackground } from "../components/ThemeBackground";

const WEIGHT_UNIT_KEY = "weight_unit";

export default function More() {
  const { isDarkMode, selectedPalette } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [isKg, setIsKg] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userProfile, setUserProfile] = useState<any>(null); // Keep generic or use UserProfile
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Modal States
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [createRoutineVisible, setCreateRoutineVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Safety check for theme
  if (!selectedPalette) return null;

  const colors = {
    background: isDarkMode
      ? selectedPalette.dark.background
      : selectedPalette.light.background,
    surface: isDarkMode ? selectedPalette.dark.surface : "#FFFFFF",
    surfaceSecondary: isDarkMode
      ? "rgba(255,255,255,0.05)"
      : "rgba(0,0,0,0.02)",
    text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
    textSecondary: isDarkMode
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(0, 0, 0, 0.6)",
    border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load local preference first
      const storedUnit = await AsyncStorage.getItem(WEIGHT_UNIT_KEY);
      if (storedUnit) {
        setIsKg(storedUnit === "kg");
      }

      // Fetch profile data from Edge Function
      const profileData = await api.getProfile();
      if (profileData && profileData.profile) {
        setUserProfile(profileData.profile);

        // Use server preference if not overwritten locally? Or sync local?
        // Logic from before: "If storedUnit exists, use it. Else check DB."
        // We'll update state if we haven't set it from storage, or if we want to sync.
        // Let's stick to syncing from DB if local is missing, consistent with previous login.
        if (!storedUnit && profileData.profile.weight_unit) {
          setIsKg(profileData.profile.weight_unit === "kg");
          await AsyncStorage.setItem(WEIGHT_UNIT_KEY, profileData.profile.weight_unit);
        } else if (storedUnit) {
          // Ensure consistency? We'll prioritize local for now as per usual patterns.
        }
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const handleWeightPress = async () => {
    // Refresh preference just in case
    const storedUnit = await AsyncStorage.getItem(WEIGHT_UNIT_KEY);
    if (storedUnit) setIsKg(storedUnit === "kg");
    setShowWeightModal(true);
  };

  const handlePhotoPress = () => {
    setShowPhotoModal(true);
  };

  const handleWeightSubmit = async (loggedWeight: number, loggedUnit: "kg" | "lbs") => {
    try {
      setIsLoading(true);
      setShowWeightModal(false);

      const isKgSelected = loggedUnit === 'kg';
      // Calculate display weight for local update before refetching? 
      // Or just assume success.
      // We calculate "formattedWeight" for correct storage value if needed, 
      // but the API handles the business logic? 
      // Wait, api.logWeight takes (weight, unit) and the Edge Function just inserts.
      // E.g. if I send 150 lbs, the DB stores 150 and 'lbs'.
      // Previous logic converted to Kg?
      // Step 713 Line 140: `const weightInKg = isKgSelected ? loggedWeight : loggedWeight * 0.453592;`
      // Step 713 Line 143: Insert `weight: formattedWeight` (which is KG).
      // Step 713 Line 153: Update profile `weight: formattedWeight` (KG) and `weight_unit: loggedUnit` (LBS or KG).

      // My Edge Function implementation (Step 733) receives `weight` and `weight_unit`.
      // It inserts EXACTLY what is sent.
      // So if I want to maintain the "Store everything in KG" rule, I must convert locally OR update the Edge Function.
      // User said "Keep it similar to other edge functions".
      // Usually logic moves to backend. I should probably move the KG conversion to Edge Function or do it here.
      // If I do it here, I just pass the KG value.

      const weightInKg = isKgSelected ? loggedWeight : loggedWeight * 0.453592;
      const formattedWeight = Math.round(weightInKg * 100) / 100;

      await api.logWeight(formattedWeight, loggedUnit);

      await AsyncStorage.setItem(WEIGHT_UNIT_KEY, loggedUnit);
      setIsKg(isKgSelected);
      setUserProfile((prev: any) => ({
        ...prev,
        weight: formattedWeight, // Store KG
        weight_unit: loggedUnit
      }));

      setSuccessMessage("Weight Logged Successfully");
      showSuccessAnimation();

    } catch (error) {
      console.error("Error logging weight:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoSelected = async (uri: string) => {
    if (!uri) return;

    try {
      setShowPhotoModal(false);
      setIsLoading(true);

      await api.uploadProgressPhoto(uri, "front", "Progress photo");

      setSuccessMessage("Progress Logged");
      showSuccessAnimation();

    } catch (error) {
      console.error("Error uploading photo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccessAnimation = () => {
    setShowSuccess(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSuccess(false);
      });
    }, 1500);
  };

  return (
    <>
      <ThemeBackground style={styles.container}>
        <SafeAreaView
          style={[styles.container, { backgroundColor: 'transparent' }]}
          edges={['top']}
        >
          <ScreenHeader title="Stay Fit" />

          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              {/* Options Card */}
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface },
                ]}
              >
                <TouchableOpacity
                  style={styles.option}
                  onPress={handleWeightPress}
                >
                  <View
                    style={[
                      styles.optionIconContainer,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}
                  >
                    <ScaleIcon
                      size={20}
                      color={selectedPalette.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      Log Weight
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                      Track your daily progress
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward-circle-outline"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                <View
                  style={[
                    styles.separator,
                    { backgroundColor: colors.border },
                  ]}
                />

                <TouchableOpacity
                  style={styles.option}
                  onPress={handlePhotoPress}
                >
                  <View
                    style={[
                      styles.optionIconContainer,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}
                  >
                    <CameraIcon
                      size={20}
                      color={selectedPalette.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      Log Progress Photo
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                      Upload a new photo
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward-circle-outline"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                <View
                  style={[
                    styles.separator,
                    { backgroundColor: colors.border },
                  ]}
                />

                <TouchableOpacity
                  style={styles.option}
                  onPress={() => setCreateRoutineVisible(true)}
                >
                  <View
                    style={[
                      styles.optionIconContainer,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}
                  >
                    <AddIcon
                      size={20}
                      color={selectedPalette.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      Create Routine
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                      Build your own custom workout
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward-circle-outline"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </SafeAreaView>
      </ThemeBackground>

      {/* Modals */}
      <WeightLogModal
        isVisible={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        onSave={handleWeightSubmit}
        initialWeight={
          isKg
            ? (userProfile?.weight || 70)
            : Math.round((userProfile?.weight || 70) * 2.20462 * 10) / 10
        }
        initialUnit={isKg ? 'kg' : 'lbs'}
      />

      <PhotoLogModal
        isVisible={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onPhotoSelected={handlePhotoSelected}
      />

      <CreateRoutineModal
        isVisible={createRoutineVisible}
        onClose={() => setCreateRoutineVisible(false)}
        onSuccess={() => {
          setSuccessMessage("Routine Created!");
          showSuccessAnimation();
        }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={selectedPalette.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Uploading...</Text>
        </View>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.successOverlay,
            { opacity: fadeAnim },
          ]}
        >
          <Animated.View
            style={[
              styles.successContent,
              {
                transform: [{ scale: scaleAnim }],
                backgroundColor: isDarkMode
                  ? "rgba(30, 30, 30, 0.95)"
                  : "rgba(255, 255, 255, 0.95)",
              },
            ]}
          >
            <View
              style={[
                styles.successIcon,
                { backgroundColor: selectedPalette.primary },
              ]}
            >
              <FontAwesome name="check" size={20} color="#FFFFFF" />
            </View>
            <Text
              style={[
                styles.successText,
                {
                  color: isDarkMode ? "#FFFFFF" : colors.text,
                  opacity: 0.9,
                },
              ]}
            >
              {successMessage}
            </Text>
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 8,
  },
  card: {
    borderRadius: 24,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  separator: {
    height: 1,
    alignSelf: 'stretch',
    marginLeft: 72,
    marginRight: 16,
    opacity: 0.5,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
  },
  successOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  successContent: {
    padding: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  successIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  successText: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Outfit-Medium'
  }
});
