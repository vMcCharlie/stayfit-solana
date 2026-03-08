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
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "../../src/context/theme";
import { supabase } from "../../src/lib/supabase";
import { api } from "../../src/services/api";

const { width, height } = Dimensions.get("window");
const OTP_LENGTH = 6;

const MALE_BIOS = [
  "🏋️‍♂️ Building strength, chasing goals. One rep at a time.",
  "💪 Dedicated to becoming the best version of myself.",
  "🎯 Making every workout count. Progress is a journey.",
  "🔥 Pushing limits, breaking barriers. Never settling.",
  "⚡ Transforming goals into achievements, day by day.",
];

const FEMALE_BIOS = [
  "💪 Empowered through fitness, inspired by progress.",
  "✨ Creating a stronger, healthier version of me.",
  "🌟 Every workout is a step toward my best self.",
  "💫 Balancing strength and grace in my fitness journey.",
  "🎯 Making wellness a lifestyle, not just a goal.",
];

export default function VerifyOTPScreen() {
  const { isDarkMode, selectedPalette } = useTheme();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(70);
  const [canResend, setCanResend] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const inputRefs = useRef<TextInput[]>([]);

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
    // Load the email when component mounts
    AsyncStorage.getItem("verification_email").then((savedEmail) => {
      if (savedEmail) {
        setEmail(savedEmail);
      }
    });
  }, []);

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown]);

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

    // If all digits are filled, verify OTP
    if (index === OTP_LENGTH - 1 && value !== "") {
      const completeOtp = newOtp.join("");
      if (completeOtp.length === OTP_LENGTH) {
        handleVerifyOTP(completeOtp);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && index > 0 && otp[index] === "") {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOTP = async () => {
    try {
      if (!email) {
        throw new Error("No email found for verification");
      }

      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) throw error;

      setCountdown(70);
      setCanResend(false);
      // Optional: show a success toast or small message? 
      // For now, reset countdown implies success.
    } catch (err: any) {
      console.error("Error resending OTP:", err);
      setErrorMessage(err.message);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const getRandomBio = async () => {
    try {
      const onboardingData = await AsyncStorage.getItem("onboarding_data");
      if (onboardingData) {
        const { gender } = JSON.parse(onboardingData);
        const bios = gender === "male" ? MALE_BIOS : FEMALE_BIOS;
        return bios[Math.floor(Math.random() * bios.length)];
      }
      return MALE_BIOS[0];
    } catch (error) {
      console.error("Error getting bio:", error);
      return MALE_BIOS[0];
    }
  };

  const generateUniqueUsername = async (baseUsername: string): Promise<string> => {
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", baseUsername)
        .single();

      if (checkError || !existingUser) {
        return baseUsername;
      }

      let attempts = 0;
      while (attempts < 5) {
        const randomSuffix = Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0");
        const newUsername = `${baseUsername}${randomSuffix}`;

        const { data: existingUserWithSuffix, error: checkSuffixError } =
          await supabase
            .from("profiles")
            .select("username")
            .eq("username", newUsername)
            .single();

        if (checkSuffixError || !existingUserWithSuffix) {
          return newUsername;
        }

        attempts++;
      }

      return `${baseUsername}${Date.now().toString().slice(-4)}`;
    } catch (error) {
      console.error("Error generating username:", error);
      return `${baseUsername}${Date.now().toString().slice(-4)}`;
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      const onboardingData = await AsyncStorage.getItem("onboarding_data");
      if (!onboardingData) {
        throw new Error("No onboarding data found");
      }

      const data = JSON.parse(onboardingData);
      const randomBio = await getRandomBio();

      let gender = data.gender;
      if (gender === 'male') gender = 'Male';
      else if (gender === 'female') gender = 'Female';
      else if (gender === 'other') gender = 'Other';

      let fitnessGoal = data.fitness_goal;
      if (fitnessGoal === 'build_muscle') fitnessGoal = 'Build Muscle';
      else if (fitnessGoal === 'lose_weight') fitnessGoal = 'Lose Weight';
      else if (fitnessGoal === 'improve_endurance' || fitnessGoal === 'keep_fit') fitnessGoal = 'Keep Fit';
      else if (fitnessGoal === 'stay_active' || fitnessGoal === 'get_stronger') fitnessGoal = 'Get Stronger';

      let fitnessLevel = data.fitness_level;
      if (fitnessLevel === 'beginner') fitnessLevel = 'Beginner';
      else if (fitnessLevel === 'intermediate') fitnessLevel = 'Intermediate';
      else if (fitnessLevel === 'advanced') fitnessLevel = 'Advanced';

      let equipmentAccess = data.equipment_access;
      if (equipmentAccess === 'home' || equipmentAccess === 'home_bodyweight' || equipmentAccess === 'home_equipment') {
        equipmentAccess = 'Home';
      } else if (equipmentAccess === 'gym' || equipmentAccess === 'full_gym') {
        equipmentAccess = 'Gym';
      } else if (!equipmentAccess) {
        equipmentAccess = 'None';
      }

      const emailAlias = email?.split("@")[0] || "";
      const username = await generateUniqueUsername(emailAlias);

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          username: username,
          full_name: data.full_name || data.name,
          gender: gender,
          height: data.height,
          weight: data.weight,
          fitness_goal: fitnessGoal,
          workout_frequency: data.workout_frequency,
          fitness_level: fitnessLevel,
          equipment_access: equipmentAccess,
          height_unit: data.height_unit || "cm",
          weight_unit: data.weight_unit || "kg",
          bio: randomBio,
          wallet_address: data.wallet_address || null,
          onboarding_completed: true,
          onboarding_step: "personalize",
          total_workouts_completed: 0,
          total_calories_burned: 0,
        })
        .select();

      // Transfer temporary wallet auth token and local storage
      const tempAddress = await AsyncStorage.getItem('temp_wallet_address');
      const tempToken = await AsyncStorage.getItem('temp_wallet_auth_token');
      const tempSignature = await AsyncStorage.getItem('temp_wallet_signature');

      if (tempAddress) {
        await AsyncStorage.setItem(`wallet_address_${userId}`, tempAddress);
        await AsyncStorage.removeItem('temp_wallet_address');

        // Push to Auth user_metadata so AuthContext picks it up immediately upon login
        await supabase.auth.updateUser({
          data: { wallet_address: tempAddress }
        });
      }
      if (tempToken) {
        await AsyncStorage.setItem(`wallet_auth_token_${userId}`, tempToken);
        await AsyncStorage.removeItem('temp_wallet_auth_token');
      }
      if (tempSignature) {
        await AsyncStorage.setItem(`wallet_signature_${userId}`, tempSignature);
        await AsyncStorage.removeItem('temp_wallet_signature');
      }


      if (error) throw error;

      if (data.weight) {
        try {
          await api.logWeight(data.weight, data.weight_unit || 'kg');
        } catch (weightError) {
          console.error("Error logging initial weight:", weightError);
        }
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      throw error;
    }
  };

  const handleVerifyOTP = async (token?: string) => {
    // If token passed (from auto trigger), use it, else generic logic (though here we need token passed or from state)
    // The auto-trigger passes it. If button press, we need to gather from state.
    const completeOtp = token || otp.join("");

    if (completeOtp.length !== OTP_LENGTH) {
      setErrorMessage("Please enter the full code");
      setShowErrorModal(true);
      return;
    }

    try {
      if (!email) {
        throw new Error("No email found for verification");
      }

      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Verify OTP
      const { data: verifyData, error: verifyError } =
        await supabase.auth.verifyOtp({
          email: email,
          token: completeOtp,
          type: "email",
        });

      if (verifyError) throw verifyError;

      // Ensure session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session) {
        const { error: signInError } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            data: {
              verificationCode: completeOtp,
            },
          },
        });
        if (signInError) throw signInError;
      }

      // Create user profile
      if (verifyData?.user) {
        await createUserProfile(verifyData.user.id);
      }

      await AsyncStorage.removeItem("verification_email");
      router.push("/onboarding/personalize");
    } catch (err: any) {
      console.error("Error verifying OTP:", err);
      setErrorMessage(err.message || "Invalid code. Please try again.");
      setShowErrorModal(true);

      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
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
            <Ionicons name="alert-circle-outline" size={32} color="#FF3B30" />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Verification Failed
            </Text>
            <Text
              style={[styles.modalMessage, { color: colors.textSecondary }]}
            >
              {errorMessage}
            </Text>
            <View style={[styles.modalButtons, { justifyContent: "center" }]}>
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
            Verify Email
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the code sent to {email || "your email"}
          </Text>
        </View>

        <Animated.View layout={Layout.springify()} style={styles.form}>
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
                onKeyPress={(e) => handleKeyPress(e, index)}
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
            onPress={() => handleVerifyOTP()}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : "Verify & Continue"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendLink}
            onPress={handleResendOTP}
            disabled={loading || !canResend}
          >
            <Text style={[styles.resendLinkText, { color: colors.textSecondary }]}>
              {!canResend
                ? `Resend code in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, "0")}`
                : "Resend Code"
              }
            </Text>
          </TouchableOpacity>
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
    fontFamily: "Outfit-Bold",
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
  resendLink: {
    alignSelf: "center",
    marginTop: 16,
  },
  resendLinkText: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
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
});
