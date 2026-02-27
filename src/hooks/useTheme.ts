import { useColorScheme } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeColors {
  primary: string;
  background: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
}

const lightColors: ThemeColors = {
  primary: '#4CAF50',
  background: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E0E0E0',
  error: '#FF3B30',
};

const darkColors: ThemeColors = {
  primary: '#4CAF50',
  background: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  border: '#333333',
  error: '#FF453A',
};

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [colors, setColors] = useState<ThemeColors>(isDark ? darkColors : lightColors);
  const [primaryColor, setPrimaryColor] = useState('#4CAF50');

  useEffect(() => {
    // Load saved theme preferences
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme_mode');
        const savedColor = await AsyncStorage.getItem('theme_color');
        
        if (savedTheme) {
          setIsDark(savedTheme === 'dark');
        }
        
        if (savedColor) {
          setPrimaryColor(savedColor);
          setColors(prev => ({
            ...prev,
            primary: savedColor,
          }));
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newIsDark = !isDark;
      setIsDark(newIsDark);
      setColors(newIsDark ? darkColors : lightColors);
      await AsyncStorage.setItem('theme_mode', newIsDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const updatePrimaryColor = async (color: string) => {
    try {
      setPrimaryColor(color);
      setColors(prev => ({
        ...prev,
        primary: color,
      }));
      await AsyncStorage.setItem('theme_color', color);
    } catch (error) {
      console.error('Error saving primary color:', error);
    }
  };

  return {
    isDark,
    colors,
    primaryColor,
    toggleTheme,
    updatePrimaryColor,
  };
} 