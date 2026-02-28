import React from "react";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="gender-selection" />
      <Stack.Screen name="fitness-goal" />
      <Stack.Screen name="workout-frequency" />
      <Stack.Screen name="fitness-level" />
      <Stack.Screen name="equipment-access" />
      <Stack.Screen name="weight" />
      <Stack.Screen name="height" />
      <Stack.Screen name="account" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="personalize" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
