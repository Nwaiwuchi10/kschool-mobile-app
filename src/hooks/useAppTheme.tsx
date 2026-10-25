import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Theme, ThemeColors } from '../constants/theme';

const THEME_STORAGE_KEY = 'kschoolmate_theme_preference';

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('light');

  // Load persisted theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') {
          setThemeState(stored);
        } else {
          setThemeState(systemScheme === 'dark' ? 'dark' : 'light');
        }
      } catch {
        setThemeState('light');
      }
    };
    loadTheme();
  }, [systemScheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value: ThemeContextType = {
    theme,
    colors: Colors[theme],
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * useAppTheme hook for all screens and components
 * Usage:
 *   const { colors, isDark, toggleTheme } = useAppTheme();
 */
export const useAppTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
};

export default useAppTheme;
