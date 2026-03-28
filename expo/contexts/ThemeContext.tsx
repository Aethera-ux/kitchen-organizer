import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

type ColorScheme = {
  primary: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  cardBackground: string;
  inputBackground: string;
  placeholderText: string;
  divider: string;
};

const lightColors: ColorScheme = {
  primary: '#10b981',
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
  cardBackground: '#ffffff',
  inputBackground: '#f1f5f9',
  placeholderText: '#94a3b8',
  divider: '#e2e8f0',
};

const darkColors: ColorScheme = {
  primary: '#10b981',
  background: '#0f172a',
  surface: '#1e293b',
  surfaceElevated: '#334155',
  border: '#334155',
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
  cardBackground: '#1e293b',
  inputBackground: '#334155',
  placeholderText: '#64748b',
  divider: '#334155',
};

const STORAGE_KEY = '@theme_mode';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setThemeModeState(stored as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(STORAGE_KEY, mode);
      console.log('[Theme] Mode changed to:', mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const colors = useMemo(() => {
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  return useMemo(
    () => ({
      themeMode,
      setThemeMode,
      isDark,
      colors,
      isLoading,
    }),
    [themeMode, setThemeMode, isDark, colors, isLoading]
  );
});
