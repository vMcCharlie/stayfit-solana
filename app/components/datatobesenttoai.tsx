import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface DataOption {
  id: string;
  category: string;
  label: string;
  description: string;
  enabled: boolean;
}

export const DATA_OPTIONS: DataOption[] = [
  {
    id: "basic_info",
    category: "Profile",
    label: "Basic Information",
    description: "Name, age, gender, height, weight",
    enabled: true,
  },
  {
    id: "fitness_profile",
    category: "Profile",
    label: "Fitness Profile",
    description: "Fitness goal, level, frequency, equipment access",
    enabled: true,
  },
  {
    id: "progress_stats",
    category: "Profile",
    label: "Progress Statistics",
    description: "Total workouts, calories burned",
    enabled: true,
  },
  {
    id: "weight_history",
    category: "Progress",
    label: "Weight History",
    description: "Weight records from the past week",
    enabled: true,
  },
  {
    id: "recent_workouts",
    category: "Workouts",
    label: "Recent Workouts",
    description: "Last completed workout routines and exercises",
    enabled: true,
  },
  {
    id: "focus_areas",
    category: "Workouts",
    label: "Focus Areas",
    description: "Muscle group intensity from recent workouts",
    enabled: true,
  },
];

export default function DataToBeSentToAI({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const { isDarkMode, selectedPalette } = useTheme();
  const [options, setOptions] = useState<DataOption[]>(DATA_OPTIONS);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSavedOptions();
  }, []);

  const loadSavedOptions = async () => {
    try {
      const savedOptions = await AsyncStorage.getItem("aiDataOptions");
      if (savedOptions) {
        setOptions(JSON.parse(savedOptions));
      }
    } catch (error) {
      console.error("Error loading saved options:", error);
    }
  };

  const toggleOption = (id: string) => {
    setOptions((prev) =>
      prev.map((option) =>
        option.id === id ? { ...option, enabled: !option.enabled } : option
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      // Save the complete options array
      await AsyncStorage.setItem("aiDataOptions", JSON.stringify(options));

      // Also save just the enabled option IDs for quick access
      const enabledOptions = options
        .filter((opt) => opt.enabled)
        .map((opt) => opt.id);
      await AsyncStorage.setItem(
        "enabledDataOptions",
        JSON.stringify(enabledOptions)
      );

      setHasChanges(false);
      onSave(); // Call the onSave callback to trigger chat reset
      onClose();
    } catch (error) {
      console.error("Error saving options:", error);
    }
  };

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

  const categories = Array.from(
    new Set(options.map((option) => option.category))
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          AI Data Preferences
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {categories.map((category) => (
          <View key={category} style={styles.categorySection}>
            <Text style={[styles.categoryTitle, { color: colors.text }]}>
              {category}
            </Text>
            {options
              .filter((option) => option.category === category)
              .map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => toggleOption(option.id)}
                >
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.optionDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {option.description}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.toggleButton,
                      {
                        backgroundColor: option.enabled
                          ? selectedPalette.primary
                          : isDarkMode
                            ? "#2D2D2D"
                            : "#F5F5F5",
                        borderColor: option.enabled
                          ? selectedPalette.primary
                          : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={option.enabled ? "checkmark" : "close"}
                      size={20}
                      color={option.enabled ? "#FFFFFF" : colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        ))}
      </ScrollView>

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          {
            backgroundColor: hasChanges
              ? selectedPalette.primary
              : isDarkMode
                ? "#2D2D2D"
                : "#F5F5F5",
          },
        ]}
        onPress={handleSave}
        disabled={!hasChanges}
      >
        <Text
          style={[
            styles.saveButtonText,
            { color: hasChanges ? "#FFFFFF" : colors.textSecondary },
          ]}
        >
          Save Changes
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    marginBottom: 12,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  saveButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
});
