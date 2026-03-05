import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  TextInput,
  Modal,
  Switch,
  Linking,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  loadReminderSettings,
  saveReminderSettings,
  getLastWorkoutTime,
} from "../../src/services/notificationService";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/theme";
import Animated, {
  SlideInRight,
  FadeIn,
  FadeOut,
  SlideOutDown,
  SlideInUp,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../src/context/auth";
import ThemeModal from "./theme";
import InfoModal from "./InfoModal";
import LegalModal from "./LegalModal";
import CustomAlert from "./CustomAlert";
import EditProfileModal from "./EditProfileModal";
import { supabase } from "../../src/lib/supabase";
import { api } from "../../src/services/api";
import { useDatabase } from "../../src/context/database";

interface SettingOption {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  subOptions?: SettingOption[];
  hasNotification?: boolean;
  onPress?: () => void;
}

const WORKOUT_REST_DURATION_KEY = "workout_rest_duration";
const DEFAULT_REST_DURATION = 30; // 30 seconds default
const WEIGHT_UNIT_KEY = "weight_unit";
const HEIGHT_UNIT_KEY = "height_unit";

const settingOptions: SettingOption[] = [
  {
    id: "account",
    title: "Account",
    icon: "person-outline",
    subOptions: [
      {
        id: "edit_profile",
        title: "Profile Details",
        icon: "person-circle-outline",
        onPress: () => {
          // Handled in renderSettingOption wrapped logic
        },
      },
      {
        id: "logout",
        title: "Logout",
        icon: "log-out-outline",
        onPress: () => {
          // Implementation needed
        },
      },
    ],
  },

  {
    id: "theme",
    title: "Theme",
    icon: "color-palette-outline",
    onPress: () => {
      // Implementation needed
    },
  },
  {
    id: "units",
    title: "Units",
    icon: "options-outline",
    subOptions: [
      {
        id: "weight_unit",
        title: "Weight Unit",
        icon: "scale-outline",
      },
      {
        id: "height_unit",
        title: "Height Unit",
        icon: "resize-outline",
      },
    ],
  },
  {
    id: "reminder",
    title: "Workout Reminder Time",
    icon: "alarm-outline",
  },
  {
    id: "rest_duration",
    title: "Rest Duration",
    icon: "timer-outline",
    // Expanded inline logic
  },
  {
    id: "storage",
    title: "Storage & Data",
    icon: "folder-outline",
    subOptions: [
      {
        id: "clear_offline_data",
        title: "Clear Offline Data",
        icon: "trash-bin-outline",
      },
    ],
  },
  {
    id: "help",
    title: "FAQ / Help Center",
    icon: "help-circle-outline",
    onPress: () => {
      // Implementation needed
    },
  },
  {
    id: "terms",
    title: "Terms of Use",
    icon: "document-text-outline",
    onPress: () => {
      // Implementation needed
    },
  },
  {
    id: "privacy_policy",
    title: "Privacy Policy",
    icon: "shield-checkmark-outline",
    onPress: () => {
      // Implementation needed
    },
  },
];

interface Colors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
}

interface SettingsProps {
  visible: boolean;
  onClose: () => void;
  colors?: Colors;
}

// --- EXTRACTED COMPONENTS ---

interface UnitsModalProps {
  visible: boolean;
  onClose: () => void;
  colors: Colors;
  isDarkMode: boolean;
  selectedPalette: any;
  weightUnit: "kg" | "lbs";
  heightUnit: "cm" | "ft";
  onSavePreference: (type: "weight" | "height", value: string) => void;
}

const UnitsModal = ({
  visible,
  onClose,
  colors,
  isDarkMode,
  selectedPalette,
  weightUnit,
  heightUnit,
  onSavePreference,
}: UnitsModalProps) => {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.modalOverlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
    >
      <Animated.View
        entering={SlideInUp.duration(300)}
        exiting={SlideOutDown.duration(200)}
        style={[styles.modalContainer, { backgroundColor: colors.surface }]}
      >
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Units</Text>

          <View style={styles.unitSection}>
            <Text style={[styles.unitSectionTitle, { color: colors.text }]}>
              Weight Unit
            </Text>
            <View style={styles.unitButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  {
                    backgroundColor:
                      weightUnit === "kg"
                        ? selectedPalette.primary
                        : isDarkMode
                          ? "#2A2A2A"
                          : "#F5F5F5",
                  },
                ]}
                onPress={() => onSavePreference("weight", "kg")}
              >
                <Text
                  style={[
                    styles.unitButtonText,
                    { color: weightUnit === "kg" ? "#FFFFFF" : colors.text },
                  ]}
                >
                  kg
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  {
                    backgroundColor:
                      weightUnit === "lbs"
                        ? selectedPalette.primary
                        : isDarkMode
                          ? "#2A2A2A"
                          : "#F5F5F5",
                  },
                ]}
                onPress={() => onSavePreference("weight", "lbs")}
              >
                <Text
                  style={[
                    styles.unitButtonText,
                    { color: weightUnit === "lbs" ? "#FFFFFF" : colors.text },
                  ]}
                >
                  lbs
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.unitSection, { marginTop: 24 }]}>
            <Text style={[styles.unitSectionTitle, { color: colors.text }]}>
              Height Unit
            </Text>
            <View style={styles.unitButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  {
                    backgroundColor:
                      heightUnit === "cm"
                        ? selectedPalette.primary
                        : isDarkMode
                          ? "#2A2A2A"
                          : "#F5F5F5",
                  },
                ]}
                onPress={() => onSavePreference("height", "cm")}
              >
                <Text
                  style={[
                    styles.unitButtonText,
                    { color: heightUnit === "cm" ? "#FFFFFF" : colors.text },
                  ]}
                >
                  cm
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  {
                    backgroundColor:
                      heightUnit === "ft"
                        ? selectedPalette.primary
                        : isDarkMode
                          ? "#2A2A2A"
                          : "#F5F5F5",
                  },
                ]}
                onPress={() => onSavePreference("height", "ft")}
              >
                <Text
                  style={[
                    styles.unitButtonText,
                    { color: heightUnit === "ft" ? "#FFFFFF" : colors.text },
                  ]}
                >
                  ft
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.modalActions, { marginTop: 24 }]}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.cancelButton,
                {
                  backgroundColor: isDarkMode
                    ? "#2A2A2A"
                    : colors.surfaceSecondary,
                },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: selectedPalette.primary },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  colors: Colors;
  isDarkMode: boolean;
}

const LogoutModal = ({
  visible,
  onClose,
  onLogout,
  colors,
  isDarkMode,
}: LogoutModalProps) => {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.modalOverlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
    >
      <Animated.View
        entering={SlideInUp.duration(300)}
        exiting={SlideOutDown.duration(200)}
        style={[
          styles.modalContainer,
          {
            backgroundColor: isDarkMode ? "#1F1F1F" : colors.surface,
          },
        ]}
      >
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Logout
          </Text>
          <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
            Are you sure you want to logout from your account?
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.cancelButton,
                {
                  backgroundColor: isDarkMode
                    ? "#2A2A2A"
                    : colors.surfaceSecondary,
                },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.logoutButton]}
              onPress={onLogout}
            >
              <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
  colors: Colors;
  isDarkMode: boolean;
}

const DeleteAccountModal = ({
  visible,
  onClose,
  onDelete,
  colors,
  isDarkMode,
}: DeleteAccountModalProps) => {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.modalOverlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
    >
      <Animated.View
        entering={SlideInUp.duration(300)}
        exiting={SlideOutDown.duration(200)}
        style={[
          styles.modalContainer,
          {
            backgroundColor: isDarkMode ? "#1F1F1F" : colors.surface,
          },
        ]}
      >
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Delete Account
          </Text>
          <Text
            style={[
              styles.modalMessage,
              { color: colors.textSecondary, marginBottom: 12 },
            ]}
          >
            Are you sure you want to delete your account? This action is
            irreversible and all your data will be permanently lost.
          </Text>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.cancelButton,
                {
                  backgroundColor: isDarkMode
                    ? "#2A2A2A"
                    : colors.surfaceSecondary,
                },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#FF4B4B" }]}
              onPress={onDelete}
            >
              <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

interface ErrorModalProps {
  visible: boolean;
  onClose: () => void;
  message: string;
  colors: Colors;
  selectedPalette: any;
}

const ErrorModal = ({
  visible,
  onClose,
  message,
  colors,
  selectedPalette,
}: ErrorModalProps) => {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.modalOverlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
    >
      <Animated.View
        entering={SlideInUp.duration(300)}
        exiting={SlideOutDown.duration(200)}
        style={[styles.modalContainer, { backgroundColor: colors.surface }]}
      >
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Error</Text>
          <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
            {message}
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: selectedPalette.primary },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

interface ClearDataModalProps {
  visible: boolean;
  onClose: () => void;
  onClear: () => void;
  isClearingData: boolean;
  colors: Colors;
  selectedPalette: any;
  isDarkMode: boolean;
  exerciseCount: number;
  routineCount: number;
}

const ClearDataModal = ({
  visible,
  onClose,
  onClear,
  isClearingData,
  colors,
  selectedPalette,
  isDarkMode,
  exerciseCount,
  routineCount,
}: ClearDataModalProps) => {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.modalOverlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
    >
      <Animated.View
        entering={SlideInUp.duration(300)}
        exiting={SlideOutDown.duration(200)}
        style={[
          styles.modalContainer,
          {
            backgroundColor: isDarkMode ? "#1F1F1F" : colors.surface,
          },
        ]}
      >
        <View style={styles.modalContent}>
          <View
            style={[
              styles.clearDataIcon,
              { backgroundColor: `${selectedPalette.primary}20` },
            ]}
          >
            <Ionicons
              name="cloud-offline-outline"
              size={32}
              color={selectedPalette.primary}
            />
          </View>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Clear Offline Data
          </Text>
          <Text
            style={[
              styles.modalMessage,
              { color: colors.textSecondary, marginBottom: 16 },
            ]}
          >
            This will remove all cached exercise and routine data from your
            device.
          </Text>

          <View
            style={[
              styles.dataStatsContainer,
              { backgroundColor: isDarkMode ? "#2A2A2A" : "#F5F5F5" },
            ]}
          >
            <View style={styles.dataStat}>
              <Text
                style={[
                  styles.dataStatNumber,
                  { color: selectedPalette.primary },
                ]}
              >
                {exerciseCount}
              </Text>
              <Text
                style={[styles.dataStatLabel, { color: colors.textSecondary }]}
              >
                Exercises
              </Text>
            </View>
            <View
              style={[styles.dataStatDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.dataStat}>
              <Text
                style={[
                  styles.dataStatNumber,
                  { color: selectedPalette.primary },
                ]}
              >
                {routineCount}
              </Text>
              <Text
                style={[styles.dataStatLabel, { color: colors.textSecondary }]}
              >
                Routines
              </Text>
            </View>
          </View>

          <Text style={[styles.modalHint, { color: colors.textSecondary }]}>
            Data will be re-downloaded automatically when needed.
          </Text>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.cancelButton,
                {
                  backgroundColor: isDarkMode
                    ? "#2A2A2A"
                    : colors.surfaceSecondary,
                },
              ]}
              onPress={onClose}
              disabled={isClearingData}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                {
                  backgroundColor: "#FF4B4B",
                  opacity: isClearingData ? 0.7 : 1,
                },
              ]}
              onPress={onClear}
              disabled={isClearingData}
            >
              {isClearingData ? (
                <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                  Clearing...
                </Text>
              ) : (
                <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                  Clear Data
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

export default function Settings({
  visible,
  onClose,
  colors: propColors,
}: SettingsProps) {
  const router = useRouter();
  const { isDarkMode, selectedPalette } = useTheme();
  const { signOut } = useAuth();
  const { syncStatus, clearCache, refreshSyncStatus } = useDatabase();
  const [expandedOption, setExpandedOption] = useState<string | null>(null);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReferModal, setShowReferModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [restDuration, setRestDuration] = useState(
    DEFAULT_REST_DURATION.toString()
  );
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalType, setLegalModalType] = useState<"terms" | "privacy">("terms");

  // Reminder states
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date>(new Date());
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === "ios");

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [] as any[],
  });

  const showAlert = (title: string, message: string, buttons: any[] = []) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons,
    });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const [isPublic, setIsPublic] = useState(false);
  const [loadingPrivacy, setLoadingPrivacy] = useState(false);

  const colors = propColors || {
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

  useEffect(() => {
    const loadRestDuration = async () => {
      try {
        const savedDuration = await AsyncStorage.getItem(
          WORKOUT_REST_DURATION_KEY
        );
        if (savedDuration) {
          setRestDuration(savedDuration);
        }
      } catch (error) {
        console.error("Error loading rest duration:", error);
      }
    };

    const loadUserPreferences = async () => {
      try {
        // Load from AsyncStorage first
        const [storedWeightUnit, storedHeightUnit] = await Promise.all([
          AsyncStorage.getItem(WEIGHT_UNIT_KEY),
          AsyncStorage.getItem(HEIGHT_UNIT_KEY),
        ]);

        // Then get from database
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("weight_unit, height_unit, is_public")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) throw error;

        // Set units with priority to database values, fallback to stored, then default
        setWeightUnit(
          (data?.weight_unit || storedWeightUnit || "kg") as "kg" | "lbs"
        );
        setHeightUnit(
          (data?.height_unit || storedHeightUnit || "cm") as "cm" | "ft"
        );
        setIsPublic(data?.is_public || false);
      } catch (error) {
        console.error("Error loading user preferences:", error);
      }
    };

    const loadReminderPreferences = async () => {
      try {
        const settings = await loadReminderSettings();
        if (settings) {
          const time = new Date();
          time.setHours(settings.hour, settings.minute, 0, 0);
          setReminderTime(time);
          setReminderEnabled(settings.enabled);
        } else {
          // Try to get last workout time as fallback
          const lastWorkoutTime = await getLastWorkoutTime();
          if (lastWorkoutTime) {
            const time = new Date();
            time.setHours(lastWorkoutTime.hour, lastWorkoutTime.minute, 0, 0);
            setReminderTime(time);
          }
        }
      } catch (error) {
        console.error("Error loading reminder preferences:", error);
      }
    };

    if (visible) {
      loadRestDuration();
      loadUserPreferences();
      loadReminderPreferences();

      // Add back button handler
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (showLogoutModal) {
            setShowLogoutModal(false);
            return true;
          }
          if (showDeleteModal) {
            setShowDeleteModal(false);
            return true;
          }
          if (showErrorModal) {
            setShowErrorModal(false);
            return true;
          }
          if (showThemeModal) {
            setShowThemeModal(false);
            return true;
          }
          if (showProfileModal) {
            setShowProfileModal(false);
            return true;
          }
          if (showReferModal) {
            setShowReferModal(false);
            return true;
          }
          if (showFAQModal) {
            setShowFAQModal(false);
            return true;
          }
          if (showUnitsModal) {
            setShowUnitsModal(false);
            return true;
          }
          if (showReminderModal) {
            setShowReminderModal(false);
            return true;
          }
          onClose();
          return true;
        }
      );

      return () => backHandler.remove();
    }
  }, [
    visible,
    showLogoutModal,
    showErrorModal,
    showThemeModal,
    showReferModal,
    showFAQModal,
    showUnitsModal,
    showReminderModal,
  ]);

  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const handleDeleteAccountConfirm = async () => {
    setShowDeleteModal(true);
  };

  const performDeleteAccount = async () => {
    try {
      await api.deleteAccount();
      // Sign out/clean up
      try {
        await clearCache();
      } catch (e) {
        console.error("Error clearing cache during delete account:", e);
      }
      await signOut();
      setShowDeleteModal(false);
      router.replace("/intro");
    } catch (error) {
      console.error("Error deleting account:", error);
      setErrorMessage("Unable to delete account. Please try again.");
      setShowErrorModal(true);
    }
  };

  const performLogout = async () => {
    try {
      try {
        await clearCache();
      } catch (e) {
        console.error("Error clearing cache during logout:", e);
      }

      await signOut();

      setShowLogoutModal(false);
      router.replace("/intro");
    } catch (error) {
      console.error("Error logging out:", error);
      setErrorMessage("Unable to logout. Please try again.");
      setShowErrorModal(true);
    }
  };

  const updateRestDuration = async (newDuration: number) => {
    try {
      if (newDuration < 5) return; // Minimum 5 seconds
      const durationString = newDuration.toString();
      await AsyncStorage.setItem(WORKOUT_REST_DURATION_KEY, durationString);
      setRestDuration(durationString);
    } catch (error) {
      console.error("Error saving rest duration:", error);
      setErrorMessage("Failed to save rest duration");
      setShowErrorModal(true);
    }
  };

  if (!visible) return null;

  const saveUnitPreference = async (
    type: "weight" | "height",
    value: string
  ) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // Update state
      if (type === "weight") {
        setWeightUnit(value as "kg" | "lbs");
      } else {
        setHeightUnit(value as "cm" | "ft");
      }

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        type === "weight" ? WEIGHT_UNIT_KEY : HEIGHT_UNIT_KEY,
        value
      );

      // Save to database
      const updateData =
        type === "weight" ? { weight_unit: value } : { height_unit: value };

      const { error } = await supabase
        .from("profiles")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error saving unit preference:", error);
      setErrorMessage("Failed to save unit preference");
      setShowErrorModal(true);
    }
  };

  const handlePrivacyToggle = async (value: boolean) => {
    try {
      setLoadingPrivacy(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          is_public: value,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (error) throw error;

      setIsPublic(value);
    } catch (error) {
      console.error("Error updating privacy:", error);
      setErrorMessage("Failed to update privacy settings");
      setShowErrorModal(true);
    } finally {
      setLoadingPrivacy(false);
    }
  };

  const handleClearOfflineData = async () => {
    try {
      setIsClearingData(true);
      await clearCache();
      // Also clear AsyncStorage cache
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(
        (key) =>
          key.includes("routine_cache_") ||
          key.includes("exercise_cache_") ||
          key.includes("cached_workout_routines")
      );
      await AsyncStorage.multiRemove(cacheKeys);

      setShowClearDataModal(false);
      showAlert(
        "Success",
        "Offline data cleared successfully. The app will re-download exercise data when needed.",
        [{ text: "OK", onPress: closeAlert }]
      );
    } catch (error) {
      console.error("Error clearing offline data:", error);
      setErrorMessage("Failed to clear offline data");
      setShowErrorModal(true);
    } finally {
      setIsClearingData(false);
    }
  };

  const handleSaveReminder = async () => {
    setReminderLoading(true);
    try {
      const success = await saveReminderSettings(
        reminderTime.getHours(),
        reminderTime.getMinutes(),
        reminderEnabled
      );
      if (success) {
        setShowReminderModal(false);
      } else {
        setErrorMessage(
          "Failed to save reminder settings. Please check notification permissions."
        );
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error saving reminder:", error);
      setErrorMessage("Failed to save reminder settings");
      setShowErrorModal(true);
    } finally {
      setReminderLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  const openExternalLink = (url: string, title: string) => {
    showAlert(
      `Open ${title}`,
      `You are about to leave the app and visit ${url}. Do you want to continue?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: closeAlert,
        },
        {
          text: "Open Link",
          onPress: () => {
            closeAlert();
            Linking.openURL(url);
          },
        },
      ]
    );
  };

  const renderSettingOption = (option: SettingOption, isSubOption = false) => (
    <View key={option.id}>
      <TouchableOpacity
        style={[
          styles.settingOption,
          {
            backgroundColor: colors.surfaceSecondary,
            paddingLeft: isSubOption ? 48 : 16,
          },
        ]}
        onPress={() => {
          if (option.subOptions) {
            setExpandedOption(expandedOption === option.id ? null : option.id);
          } else if (option.id === "theme") {
            setShowThemeModal(true);
          } else if (option.id === "edit_profile") {
            setShowProfileModal(true);
          } else if (option.id === "logout") {
            return;
          }

          switch (option.id) {
            case "theme":
              setShowThemeModal(true);
              break;
            case "edit_profile":
              setShowProfileModal(true);
              break;
            case "logout":
              handleLogout();
              break;
            case "refer":
              setShowReferModal(true);
              break;
            case "help":
              setShowFAQModal(true);
              break;
            case "terms":
              setLegalModalType("terms");
              setShowLegalModal(true);
              break;
            case "privacy_policy":
              setLegalModalType("privacy");
              setShowLegalModal(true);
              break;
            case "account_details":
              // This case might be for a sub-option or a new feature,
              // assuming it's a placeholder for now or handled elsewhere.
              break;
            case "delete_account":
              handleDeleteAccountConfirm();
              break;
            case "clear_offline_data":
              refreshSyncStatus();
              setShowClearDataModal(true);
              break;
            case "reminder":
              setShowTimePicker(Platform.OS === "ios");
              setShowReminderModal(true);
              break;
            default:
              // Handle other options or do nothing
              break;
          }
        }}
        disabled={
          option.id === "weight_unit" ||
          option.id === "height_unit" ||
          option.id === "rest_duration"
        }
      >
        <View style={styles.settingContent}>
          <Ionicons
            name={option.icon}
            size={24}
            color={selectedPalette.primary}
          />
          <Text style={[styles.settingText, { color: colors.text }]}>
            {option.title}
          </Text>
        </View>

        {option.id === "rest_duration" && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity
              onPress={() =>
                updateRestDuration(Math.max(5, parseInt(restDuration) - 5))
              }
              style={[
                styles.stepperButton,
                { backgroundColor: selectedPalette.primary },
              ]}
            >
              <Ionicons name="remove" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text
              style={{
                fontFamily: "Outfit-Bold",
                fontSize: 16,
                color: colors.text,
              }}
            >
              {restDuration}s
            </Text>
            <TouchableOpacity
              onPress={() => updateRestDuration(parseInt(restDuration) + 5)}
              style={[
                styles.stepperButton,
                { backgroundColor: selectedPalette.primary },
              ]}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {option.id === "reminder" && (
          <TouchableOpacity
            onPress={() => {
              setShowTimePicker(Platform.OS === "ios");
              setShowReminderModal(true);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: selectedPalette.primary,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                fontFamily: "Outfit-Bold",
                fontSize: 14,
                color: "#FFFFFF",
              }}
            >
              {reminderEnabled ? formatTime(reminderTime) : "Set Time"}
            </Text>
          </TouchableOpacity>
        )}

        {option.id === "weight_unit" && (
          <View style={styles.unitSelectorContainer}>
            <TouchableOpacity
              style={[
                styles.unitSelector,
                {
                  backgroundColor:
                    weightUnit === "kg"
                      ? selectedPalette.primary
                      : isDarkMode
                        ? "#2A2A2A"
                        : "#E0E0E0",
                },
              ]}
              onPress={() => saveUnitPreference("weight", "kg")}
            >
              <Text
                style={[
                  styles.unitSelectorText,
                  { color: weightUnit === "kg" ? "#FFFFFF" : colors.text },
                ]}
              >
                kg
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitSelector,
                {
                  backgroundColor:
                    weightUnit === "lbs"
                      ? selectedPalette.primary
                      : isDarkMode
                        ? "#2A2A2A"
                        : "#E0E0E0",
                },
              ]}
              onPress={() => saveUnitPreference("weight", "lbs")}
            >
              <Text
                style={[
                  styles.unitSelectorText,
                  { color: weightUnit === "lbs" ? "#FFFFFF" : colors.text },
                ]}
              >
                lbs
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {option.id === "height_unit" && (
          <View style={styles.unitSelectorContainer}>
            <TouchableOpacity
              style={[
                styles.unitSelector,
                {
                  backgroundColor:
                    heightUnit === "cm"
                      ? selectedPalette.primary
                      : isDarkMode
                        ? "#2A2A2A"
                        : "#E0E0E0",
                },
              ]}
              onPress={() => saveUnitPreference("height", "cm")}
            >
              <Text
                style={[
                  styles.unitSelectorText,
                  { color: heightUnit === "cm" ? "#FFFFFF" : colors.text },
                ]}
              >
                cm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitSelector,
                {
                  backgroundColor:
                    heightUnit === "ft"
                      ? selectedPalette.primary
                      : isDarkMode
                        ? "#2A2A2A"
                        : "#E0E0E0",
                },
              ]}
              onPress={() => saveUnitPreference("height", "ft")}
            >
              <Text
                style={[
                  styles.unitSelectorText,
                  { color: heightUnit === "ft" ? "#FFFFFF" : colors.text },
                ]}
              >
                ft
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {option.id === "privacy" && (
          <Switch
            trackColor={{ false: "#767577", true: selectedPalette.primary }}
            thumbColor={isPublic ? "#FFFFFF" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={handlePrivacyToggle}
            value={isPublic}
            disabled={loadingPrivacy}
          />
        )}

        {(option.id === "account" ||
          option.id === "units" ||
          option.id === "storage") && (
            <Ionicons
              name={
                expandedOption === option.id ? "chevron-up" : "chevron-down"
              }
              size={24}
              color={colors.textSecondary}
            />
          )}

        {(option.id === "help" ||
          option.id === "refer" ||
          option.id === "edit_profile") && (
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.textSecondary}
            />
          )}

        {(option.id === "terms" || option.id === "privacy_policy") && (
          <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
        )}
      </TouchableOpacity>

      {/* Render sub-options if expanded */}
      {option.subOptions && expandedOption === option.id && (
        <View style={styles.subOptionContainer}>
          {option.subOptions.map((subOption) =>
            renderSettingOption(subOption, true)
          )}
        </View>
      )}
    </View>
  );

  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Settings
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-outline" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView>
          <Animated.View
            entering={SlideInRight.duration(300)}
            style={[
              styles.settingsContainer,
              {
                backgroundColor: colors.surfaceSecondary,
                borderRadius: 16,
                marginHorizontal: 16,
                marginTop: 16,
                marginBottom: 8,
              },
            ]}
          >
            {settingOptions.map((option) => renderSettingOption(option))}
          </Animated.View>
        </ScrollView>

        <ThemeModal
          visible={showThemeModal}
          onClose={() => setShowThemeModal(false)}
        />

        <EditProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onSuccess={() => {
            showAlert("Success", "Profile updated successfully!");
            // Auto-dismiss after 1.5 seconds
            setTimeout(() => {
              closeAlert();
            }, 1500);
          }}
        />

        <InfoModal
          visible={showReferModal}
          onClose={() => setShowReferModal(false)}
          title="Refer & Earn"
          tableName="referols"
          emptyMessage="No referral offers available."
        />

        <InfoModal
          visible={showFAQModal}
          onClose={() => setShowFAQModal(false)}
          title="FAQ / Help Center"
          tableName="faqs"
          emptyMessage="No FAQs available."
        />

        <LegalModal
          visible={showLegalModal}
          onClose={() => setShowLegalModal(false)}
          type={legalModalType}
        />

        <LogoutModal
          visible={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onLogout={performLogout}
          colors={colors}
          isDarkMode={isDarkMode}
        />
        <DeleteAccountModal
          visible={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDelete={performDeleteAccount}
          colors={colors}
          isDarkMode={isDarkMode}
        />
        <ErrorModal
          visible={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          message={errorMessage}
          colors={colors}
          selectedPalette={selectedPalette}
        />
        <ClearDataModal
          visible={showClearDataModal}
          onClose={() => setShowClearDataModal(false)}
          onClear={handleClearOfflineData}
          isClearingData={isClearingData}
          colors={colors}
          selectedPalette={selectedPalette}
          isDarkMode={isDarkMode}
          exerciseCount={syncStatus.exercises.itemCount}
          routineCount={syncStatus.routines.itemCount}
        />
        <UnitsModal
          visible={showUnitsModal}
          onClose={() => setShowUnitsModal(false)}
          colors={colors}
          isDarkMode={isDarkMode}
          selectedPalette={selectedPalette}
          weightUnit={weightUnit}
          heightUnit={heightUnit}
          onSavePreference={saveUnitPreference}
        />

        {/* Reminder Modal - Inline to prevent flickering */}
        <Modal
          visible={showReminderModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowReminderModal(false)}
        >
          <View
            style={[styles.modalOverlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
          >
            <View
              style={[styles.modalContainer, { backgroundColor: colors.surface }]}
            >
              <View style={styles.modalContent}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Workout Reminder
                </Text>
                <Text
                  style={[
                    styles.modalMessage,
                    { color: colors.textSecondary, marginBottom: 20 },
                  ]}
                >
                  Get notified daily at your preferred time to stay consistent
                  with your workouts.
                </Text>

                {/* Enable/Disable Toggle */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: isDarkMode ? "#2A2A2A" : "#F5F5F5",
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Outfit-Medium",
                      fontSize: 16,
                      color: colors.text,
                    }}
                  >
                    Enable Reminder
                  </Text>
                  <Switch
                    trackColor={{
                      false: "#767577",
                      true: selectedPalette.primary,
                    }}
                    thumbColor={reminderEnabled ? "#FFFFFF" : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={(value) => setReminderEnabled(value)}
                    value={reminderEnabled}
                  />
                </View>

                {/* Time Picker */}
                {reminderEnabled && (
                  <View style={{ alignItems: "center", marginBottom: 20 }}>
                    <Text
                      style={{
                        fontFamily: "Outfit-Medium",
                        fontSize: 14,
                        color: colors.textSecondary,
                        marginBottom: 10,
                      }}
                    >
                      Reminder Time
                    </Text>

                    {Platform.OS === "android" && !showTimePicker && (
                      <TouchableOpacity
                        onPress={() => setShowTimePicker(true)}
                        style={{
                          backgroundColor: selectedPalette.primary,
                          paddingVertical: 16,
                          paddingHorizontal: 32,
                          borderRadius: 12,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "Outfit-Bold",
                            fontSize: 24,
                            color: "#FFFFFF",
                          }}
                        >
                          {formatTime(reminderTime)}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {(Platform.OS === "ios" || showTimePicker) && (
                      <DateTimePicker
                        value={reminderTime}
                        mode="time"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={(event, selectedDate) => {
                          if (Platform.OS === "android") {
                            setShowTimePicker(false);
                          }
                          if (selectedDate) {
                            setReminderTime(selectedDate);
                          }
                        }}
                        textColor={colors.text}
                        themeVariant={isDarkMode ? "dark" : "light"}
                      />
                    )}
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.cancelButton,
                      {
                        backgroundColor: isDarkMode
                          ? "#2A2A2A"
                          : colors.surfaceSecondary,
                      },
                    ]}
                    onPress={() => setShowReminderModal(false)}
                    disabled={reminderLoading}
                  >
                    <Text style={[styles.buttonText, { color: colors.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      {
                        backgroundColor: selectedPalette.primary,
                        opacity: reminderLoading ? 0.7 : 1,
                      },
                    ]}
                    onPress={handleSaveReminder}
                    disabled={reminderLoading}
                  >
                    <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                      {reminderLoading ? "Saving..." : "Save"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={closeAlert}
        />
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    zIndex: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
  },
  settingsContainer: {
    overflow: "hidden",
  },
  settingOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  subOption: {
    paddingLeft: 48,
  },
  subOptionContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingVertical: 8,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 16,
    overflow: "hidden",
  },
  modalContent: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    textAlign: "center",
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "column",
    gap: 12,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: "#FF4B4B",
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },
  durationInput: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 18,
    fontFamily: "Outfit-Medium",
    paddingHorizontal: 16,
    textAlign: "center",
  },
  unitSection: {
    marginBottom: 8,
  },
  unitSectionTitle: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
    marginBottom: 12,
  },
  unitButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  unitButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  unitButtonText: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
  unitSelectorContainer: {
    flexDirection: "row",
    gap: 8,
    marginRight: 8,
  },
  unitSelector: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unitSelectorText: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  clearDataIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    alignSelf: "center",
  },
  dataStatsContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dataStat: {
    flex: 1,
    alignItems: "center",
  },
  dataStatNumber: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    marginBottom: 4,
  },
  dataStatLabel: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
  },
  dataStatDivider: {
    width: 1,
    height: "100%",
    marginHorizontal: 16,
  },
  modalHint: {
    fontSize: 12,
    fontFamily: "Outfit-Regular",
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },
});
