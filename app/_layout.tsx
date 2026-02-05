import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { ThemeProvider, useTheme } from "../src/context/theme";
import { AuthProvider } from "../src/context/auth";
import { DatabaseProvider } from "../src/context/database";
import { initializeWorkoutReminders } from "../src/services/notificationService";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isDarkMode, selectedPalette } = useTheme();

  // Get the theme background color
  const backgroundColor = isDarkMode
    ? selectedPalette.dark.background
    : selectedPalette.light.background;

  return (
    <NavigationThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="intro" />
        <Stack.Screen name="login" />

        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" />
      </Stack>
      <StatusBar
        style={isDarkMode ? "light" : "dark"}
        backgroundColor={backgroundColor}
        translucent={false}
      />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Outfit-Regular": require("../src/assets/fonts/Outfit-Regular.ttf"),
    "Outfit-Medium": require("../src/assets/fonts/Outfit-Medium.ttf"),
    "Outfit-Bold": require("../src/assets/fonts/Outfit-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      // Initialize workout reminders if enabled
      initializeWorkoutReminders();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <DatabaseProvider>
          <RootLayoutNav />
        </DatabaseProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
