import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";

export interface ColorPalette {
  name: string;
  description: string;
  primary: string;
  dark: {
    background: string;
    surface: string;
    text: string;
  };
  light: {
    background: string;
    surface: string;
    text: string;
  };
}

export const DEFAULT_PALETTE: ColorPalette = {
  name: "Forest Fresh",
  description: "Energetic green for nature lovers",
  primary: "#4CAF50",
  dark: {
    background: "#1A1C1E",
    surface: "#2F3133",
    text: "#FFFFFF",
  },
  light: {
    background: "#FFFFFF",
    surface: "#F5F5F5",
    text: "#000000",
  },
};

export interface ThemeContextType {
  isDarkMode: boolean;
  selectedPalette: ColorPalette;
  toggleTheme: () => void;
  updatePalette: (color: string) => void;
  setSelectedPalette: (palette: ColorPalette) => void;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
  };
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  selectedPalette: DEFAULT_PALETTE,
  toggleTheme: () => { },
  updatePalette: () => { },
  setSelectedPalette: () => { },
  colors: {
    background: DEFAULT_PALETTE.light.background,
    surface: DEFAULT_PALETTE.light.surface,
    text: DEFAULT_PALETTE.light.text,
    textSecondary: "rgba(0, 0, 0, 0.6)",
    primary: DEFAULT_PALETTE.primary,
    border: "rgba(0, 0, 0, 0.1)",
  },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedPalette, setSelectedPaletteState] = useState(DEFAULT_PALETTE);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadThemePreferences();
  }, []);

  const loadThemePreferences = async () => {
    try {
      // Load from AsyncStorage first for speed
      const storedTheme = await AsyncStorage.getItem("themePreferences");
      if (storedTheme) {
        const parsed = JSON.parse(storedTheme);
        if (parsed) {
          const { isDarkMode: storedDarkMode, palette } = parsed;
          setIsDarkMode(storedDarkMode ?? false);
          setSelectedPaletteState(palette || DEFAULT_PALETTE);
        }
      }

      // Then sync from DB if logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('id', session.user.id)
          .maybeSingle();

        if (data?.theme_preference) {
          const { isDarkMode: dbDarkMode, palette: dbPalette } = data.theme_preference as any;
          // Ideally confirm DB is newer, but for now let's just use it if local was empty specific logic
          // Or we can trust DB is source of truth if connected
          if (data.theme_preference) {
            setIsDarkMode(dbDarkMode ?? false);
            setSelectedPaletteState(dbPalette || DEFAULT_PALETTE);
          }
        }
      }
    } catch (error) {
      console.error("Error loading theme preferences:", error);
    }
  };

  useEffect(() => {
    saveThemePreferences();
  }, [isDarkMode, selectedPalette]);

  const saveThemePreferences = async () => {
    try {
      // 1. Instant Local Save
      await AsyncStorage.setItem(
        "themePreferences",
        JSON.stringify({
          isDarkMode,
          palette: selectedPalette,
        })
      );

      // 2. Debounced Background DB Save
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase
            .from('profiles')
            .update({
              theme_preference: {
                isDarkMode,
                palette: selectedPalette
              }
            })
            .eq('id', session.user.id);
        }
      }, 2000); // Wait 2s before syncing to DB to avoid spamming

    } catch (error) {
      console.error("Error saving theme preferences:", error);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const updatePalette = (color: string) => {
    setSelectedPaletteState({
      ...selectedPalette,
      primary: color,
    });
  };

  const updateSelectedPalette = (palette: ColorPalette) => {
    setSelectedPaletteState(palette);
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        selectedPalette,
        toggleTheme,
        updatePalette,
        setSelectedPalette: updateSelectedPalette,
        colors: {
          background: isDarkMode ? selectedPalette.dark.background : selectedPalette.light.background,
          surface: isDarkMode ? selectedPalette.dark.surface : selectedPalette.light.surface,
          text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
          textSecondary: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
          primary: selectedPalette.primary,
          border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        }
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
