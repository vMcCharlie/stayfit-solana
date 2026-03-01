import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  BackHandler,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";

const { width, height } = Dimensions.get("window");

export default function IntroScreen() {
  // Prevent going back when reaching this screen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );
    return () => backHandler.remove();
  }, []);

  const handleCreateAccount = () => {
    router.push("/onboarding/gender-selection");
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("An error occurred", error);
    }
  };

  return (
    <ImageBackground
      source={require("../../src/assets/images/intro-bg.jpg")}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar style="light" />
      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>StayFit</Text>
          <Text style={styles.tagline}>Your fitness journey starts here.</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.terms}>
            By tapping 'Create account' / 'Sign in', you agree to our{" "}
            <Text
              style={styles.link}
              onPress={() => openLink("https://gostay.fit/terms")}
            >
              Terms of Service
            </Text>
            . Learn how we process your data in our{" "}
            <Text
              style={styles.link}
              onPress={() => openLink("https://gostay.fit/privacy")}
            >
              Privacy Policy
            </Text>{" "}
            and{" "}
            <Text
              style={styles.link}
              onPress={() => openLink("https://gostay.fit/privacy")}
            >
              Cookies Policy
            </Text>
            .
          </Text>

          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={handleCreateAccount}
          >
            <Text style={styles.createAccountText}>Create account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Text style={styles.signInText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
  },
  header: {
    marginTop: height * 0.15,
    alignItems: "center",
  },
  title: {
    fontSize: 48,
    fontFamily: "Outfit-Bold",
    color: "white",
    marginBottom: 12,
  },
  tagline: {
    fontSize: 20,
    fontFamily: "Outfit-Medium",
    color: "white",
    textAlign: "center",
  },
  footer: {
    width: "100%",
    marginBottom: 48,
  },
  terms: {
    fontSize: 13,
    fontFamily: "Outfit-Regular",
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18,
  },
  link: {
    textDecorationLine: "underline",
    color: "white",
  },
  createAccountButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  createAccountText: {
    color: "#000000",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },
  signInButton: {
    width: "100%",
    height: 52,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  signInText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
});
