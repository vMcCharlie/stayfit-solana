import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/theme';

interface ThemeBackgroundProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function ThemeBackground({ children, style }: ThemeBackgroundProps) {
  const { selectedPalette, isDarkMode } = useTheme();

  const colors = {
    background: isDarkMode
      ? selectedPalette.dark.background
      : selectedPalette.light.background,
    primary: selectedPalette.primary,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      <LinearGradient
        colors={[
          `${colors.primary}${isDarkMode ? '95' : '75'}`, // Increased intensity further
          colors.primary + '00' // Fade to transparent
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }} // Extend to top 40%
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
