import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  Layout,
} from "react-native-reanimated";
import { useTheme } from "../src/context/theme";
import { supabase } from "../src/lib/supabase";

const { width, height } = Dimensions.get("window");
const OTP_LENGTH = 6;

export default function LoginScreen() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRefs = useRef<TextInput[]>([]);

  const { isDarkMode, selectedPalette } = useTheme();

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
    border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
  };

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

  const handleSendCode = async () => {
    if (!email) {
      setErrorMessage("Please enter your email");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Login only
        },
      });

      if (error) {
        // If error is strictly about user not found, we might want to suggest signup.
        // But Supabase typically says "Signups not allowed" or similar if disabled.
        // If generic error, show it.
        throw error;
      }

      setStep("otp");
      setError(null);
    } catch (err: any) {
      console.error("Error sending OTP:", err.message);

      // Check for specific error indicating no account exists (when signups are disabled for OTP)
      if (err.message && err.message.toLowerCase().includes("signups not allowed")) {
        setErrorMessage("No account found with this email. Please sign up for a new account.");
        // We will need to customize the error modal to show a Sign Up button in this case
        // For now, let's just show the message, users can read it and click the existing Sign Up link below the form.
        // Actually, let's make the modal smart enough to offer the link.

        // Let's modify the error logic slightly below to trigger a custom state if we want a direct button
        // or just rely on the text. The user "ask the user to go back and sign up".
      } else {
        setErrorMessage(err.message);
      }
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const completeOtp = otp.join("");
    if (completeOtp.length !== OTP_LENGTH) {
      setErrorMessage("Please enter the full code");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: completeOtp,
        type: "email",
      });

      if (error) throw error;

      if (data?.session) {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      console.error("Error verifying OTP:", err.message);
      setErrorMessage("Invalid code. Please try again.");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== "" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit? Optional.
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && index > 0 && otp[index] === "") {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleBack = () => {
    if (step === "otp") {
      setStep("email");
      setOtp(["", "", "", "", "", ""]);
    } else {
      router.back();
    }
  };

  const ErrorModal = () => {
    if (!showErrorModal) return null;

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
            <Ionicons name="alert-circle-outline" size={32} color={selectedPalette.primary} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {errorMessage.includes("No account found") ? "Account Not Found" : "Login Failed"}
            </Text>
            <Text
              style={[styles.modalMessage, { color: colors.textSecondary }]}
            >
              {errorMessage}
            </Text>
            <View style={[styles.modalButtons, { justifyContent: "center" }]}>
              {errorMessage.includes("No account found") ? (
                <>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
                    ]}
                    onPress={() => setShowErrorModal(false)}
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
                    onPress={() => {
                      setShowErrorModal(false);
                      router.push("/onboarding/gender-selection");
                    }}
                  >
                    <Text style={[styles.buttonText, { color: "white" }]}>
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: selectedPalette.primary },
                  ]}
                  onPress={() => setShowErrorModal(false)}
                >
                  <Text style={[styles.buttonText, { color: "white" }]}>
                    Try Again
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {step === "email" ? "Welcome Back" : "Verify Email"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {step === "email"
              ? "Sign in to continue your fitness journey"
              : `Enter the code sent to ${email}`}
          </Text>
        </View>

        <Animated.View layout={Layout.springify()} style={styles.form}>
          {step === "email" ? (
            <>
              <View style={[styles.inputContainer, error && styles.inputError]}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="Email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  {
                    backgroundColor: selectedPalette.primary,
                    opacity: loading ? 0.7 : 1,
                    marginTop: 8,
                  },
                ]}
                onPress={handleSendCode}
                disabled={!email || loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? <ActivityIndicator color="#FFFFFF" /> : "Send Code"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signupLink}
                onPress={() => router.push("/onboarding/gender-selection")}
                disabled={loading}
              >
                <Text style={styles.signupLinkText}>
                  Don't have an account?{" "}
                  <Text style={styles.signupLinkTextBold}>Sign up</Text>
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { if (ref) inputRefs.current[index] = ref; }}
                    style={[
                      styles.otpInput,
                      {
                        color: colors.text,
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!loading}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  {
                    backgroundColor: selectedPalette.primary,
                    opacity: loading ? 0.7 : 1,
                  },
                ]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? <ActivityIndicator color="#FFFFFF" /> : "Verify & Sign In"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendLink}
                onPress={handleSendCode}
                disabled={loading}
              >
                <Text style={[styles.resendLinkText, { color: colors.textSecondary }]}>
                  Resend Code
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </ScrollView>

      <ErrorModal />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: "Outfit-Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 48,
    fontSize: 16,
    fontFamily: "Outfit-Regular",
  },
  loginButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },
  signupLink: {
    alignSelf: "center",
    marginTop: 16,
  },
  signupLinkText: {
    color: "#666666",
    fontSize: 14,
    fontFamily: "Outfit-Regular",
  },
  signupLinkTextBold: {
    color: "#4CAF50",
    fontFamily: "Outfit-SemiBold",
  },
  inputError: {
    borderColor: "#FF4B4B",
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
    maxWidth: 340,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalContent: {
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    marginTop: 16,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 24,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderRadius: 12,
    fontSize: 24,
    textAlign: "center",
    borderWidth: 2,
    fontFamily: "Outfit-SemiBold", // Assuming font exists or fallback
  },
  resendLink: {
    alignSelf: "center",
    marginTop: 16,
  },
  resendLinkText: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
  },
});
