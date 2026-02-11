import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signUpUser, updateOnboardingStep } from "../../src/lib/onboarding";
import { useTheme } from "../../src/context/theme";
import { supabase } from "../../src/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height } = Dimensions.get("window");

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};



export default function AccountScreen() {
  const { isDarkMode, selectedPalette } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
  });

  const colors = {
    background: isDarkMode
      ? selectedPalette.dark.background
      : selectedPalette.light.background,
    surface: isDarkMode
      ? selectedPalette.dark.surface
      : selectedPalette.light.surface,
    text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
    textSecondary: isDarkMode
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(0, 0, 0, 0.6)",
    surfaceSecondary: isDarkMode
      ? `${selectedPalette.primary}15` // 15 is hex for 8% opacity
      : `${selectedPalette.primary}10`, // 10 is hex for 6% opacity
    error: "#FF5252",
  };

  const [validationErrors, setValidationErrors] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const validateField = (field: string, value: string) => {
    let error = "";
    switch (field) {
      case "name":
        if (!value.trim()) error = "Name is required";
        break;
      case "email":
        if (!value.trim()) error = "Email is required";
        else if (!validateEmail(value)) error = "Please enter a valid email";
        break;
    }
    return error;
  };

  const handleFieldBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(
      field,
      field === "name" ? name : email
    );
    setValidationErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleBack = () => {
    router.back();
  };

  const handleSkip = () => {
    // Implement skip functionality
  };

  const handleNext = async () => {
    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
    });

    // Validate all fields
    // Validate name and email only
    const nameError = validateField("name", name);
    const emailError = validateField("email", email);

    const newErrors = {
      name: nameError,
      email: emailError,
    };

    setValidationErrors(newErrors);

    // Check if there are any validation errors
    if (nameError || emailError) {
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // Save name to onboarding data
      await updateOnboardingStep("account", {
        full_name: name,
      });

      // Sign in with OTP (Sign Up Flow)
      const { data, error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: name,
          },
        },
      });

      if (signInError) throw signInError;

      // Store email for verification
      await AsyncStorage.setItem("verification_email", email);

      // Navigate to OTP verification screen
      router.push("/onboarding/verify-otp");
    } catch (err) {
      console.error("Error in account creation:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[
          styles.keyboardAvoidingView,
          keyboardVisible && styles.containerWithKeyboard,
        ]}
        keyboardVerticalOffset={Platform.OS === "ios" ? -64 : 0}
      >
        <Animated.View entering={FadeIn.duration(300)} style={[styles.topSection, { backgroundColor: colors.background }]}>
          {/* Section Title */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>

          {/* Segmented Progress Bar */}
          <View style={styles.progressSegments}>
            <View style={[styles.segment, styles.segmentSmall, { backgroundColor: selectedPalette.primary }]} />
            <View style={[styles.segment, styles.segmentLarge, { backgroundColor: selectedPalette.primary }]} />
            <View style={[styles.segment, styles.segmentMedium, { backgroundColor: selectedPalette.primary }]} />
            <View style={[styles.segment, styles.segmentMedium, { backgroundColor: selectedPalette.primary }]} />
            <View style={[styles.segment, styles.segmentSmall, { backgroundColor: selectedPalette.primary, opacity: 0.5 }]} />
          </View>
        </Animated.View>

        <ScrollView
          style={[styles.content, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Create your account
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Set up your StayFit account to save your progress
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Full Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor:
                      touched.name && validationErrors.name
                        ? colors.error
                        : "transparent",
                  },
                ]}
                value={name}
                onChangeText={setName}
                onBlur={() => handleFieldBlur("name")}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textSecondary}
              />
              {touched.name && validationErrors.name && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {validationErrors.name}
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor:
                      touched.email && validationErrors.email
                        ? colors.error
                        : "transparent",
                  },
                ]}
                value={email}
                onChangeText={setEmail}
                onBlur={() => handleFieldBlur("email")}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {touched.email && validationErrors.email && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {validationErrors.email}
                </Text>
              )}
            </View>

            {error && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            )}
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surfaceSecondary }]}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: selectedPalette.primary },
              loading && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.nextButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  containerWithKeyboard: {
    justifyContent: "flex-end",
  },
  topSection: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    zIndex: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Outfit-SemiBold",
    textAlign: "center",
    marginBottom: 16,
  },
  progressSegments: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 24,
  },
  segment: {
    height: 4,
    borderRadius: 2,
  },
  segmentSmall: {
    flex: 0.5,
  },
  segmentMedium: {
    flex: 1.2,
  },
  segmentLarge: {
    flex: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 0,
  },
  title: {
    fontSize: 32,
    fontFamily: "Outfit-Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    marginBottom: 32,
    lineHeight: 24,
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
  },
  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    borderWidth: 1,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 16,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Outfit-Medium",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Outfit-Bold",
  },
});
