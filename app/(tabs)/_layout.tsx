import React, { useState, useRef } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HomeIcon, ActivityIcon, ReportsIcon, UserIcon, PlusIcon } from "../components/TabIcons";
import { useTheme } from "../../src/context/theme";
import WeightLogModal from "../components/WeightLogModal";
import { api } from "../../src/services/api";
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  Animated,
  Easing,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";


import { useSafeAreaInsets } from "react-native-safe-area-context";

// Custom tab bar component to eliminate the highlight animation
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { isDarkMode, selectedPalette } = useTheme();
  const insets = useSafeAreaInsets();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [previousTab, setPreviousTab] = useState(0);

  // Animation functions
  const startRotation = (toValue: number) => {
    Animated.timing(rotateAnim, {
      toValue,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  };

  // Update rotation when tab changes and track previous tab
  React.useEffect(() => {
    const currentRoute = state.routes[state.index];
    const isMoreTabActive = currentRoute.name === "more";
    startRotation(isMoreTabActive ? 1 : 0);

    // Update previous tab only when NOT on 'more' tab
    if (!isMoreTabActive) {
      setPreviousTab(state.index);
    }
  }, [state.index]);

  // Calculate rotation for plus/x icon
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const colors = {
    background: isDarkMode
      ? selectedPalette.dark.background
      : selectedPalette.light.background,
    surface: isDarkMode
      ? selectedPalette.dark.surface
      : selectedPalette.light.surface,
    text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
    border: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
  };

  const iconSize = 28;
  // Tab bar height includes standard height plus bottom inset
  const tabBarHeight = 60 + insets.bottom;

  const addButtonStyle: ViewStyle = {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: selectedPalette.primary,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: -18,
    left: "50%",
    marginLeft: -28,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  };

  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);

  const handleOptionSelect = (id: string) => {
    console.log("Selected option:", id);
    if (id === "weight") {
      setIsWeightModalVisible(true);
    }
    // Handle other options...
  };

  const handleSaveWeight = async (weight: number, unit: "kg" | "lbs") => {
    try {
      await api.logWeight(weight, unit);
      setIsWeightModalVisible(false);
      // Optional: Show success toast or feedback
    } catch (error) {
      console.error("Error saving weight:", error);
    }
  };

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <WeightLogModal
        isVisible={isWeightModalVisible}
        onClose={() => setIsWeightModalVisible(false)}
        onSave={handleSaveWeight}
      />

      {state.routes.map((route, index) => {
        // Hide extra screens from the tab bar
        if (route.name === "ai-chat" || route.name === "workout" || route.name === "nutrition") return null;

        const { options } = descriptors[route.key];
        // const label = options.title ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Render different icons based on the tab
        let icon: React.ReactNode;
        if (route.name === "more") {
          icon = (
            <View style={addButtonStyle}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <PlusIcon
                  size={iconSize}
                  color={isDarkMode ? "#000" : "#fff"}
                />
              </Animated.View>
            </View>
          );
        } else {
          const color = isFocused
            ? selectedPalette.primary
            : isDarkMode
              ? "rgba(255,255,255,0.5)"
              : "rgba(0,0,0,0.5)";

          if (route.name === "index") {
            icon = <HomeIcon size={iconSize} color={color} focused={isFocused} />;
          } else if (route.name === "activity") {
            icon = <ActivityIcon size={iconSize} color={color} focused={isFocused} />;
          } else if (route.name === "reports") {
            icon = <ReportsIcon size={iconSize} color={color} focused={isFocused} />;
          } else if (route.name === "profile") {
            icon = <UserIcon size={iconSize} color={color} focused={isFocused} />;
          } else {
            // Fallback
            icon = <Ionicons name="help-outline" size={iconSize} color={color} />;
          }
        }

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            activeOpacity={1}
            onPress={onPress}
            style={styles.tabItem}
          >
            {icon}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home" }}
      />
      <Tabs.Screen
        name="activity"
        options={{ title: "Activity" }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: "More" }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: "Reports" }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile" }}
      />
      {/* Hidden screens - not shown in tab bar */}
      <Tabs.Screen
        name="ai-chat"
        options={{ href: null, headerShown: false }}
      />
      <Tabs.Screen
        name="workout"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    height: 60,
    borderTopWidth: 1,
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
});
