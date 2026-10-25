import { Stack, DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme, ThemeProvider as NavThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/store/AuthContext';
import { ClassProvider } from '@/store/ClassContext';
import { ThemeProvider, useAppTheme } from '@/hooks/useAppTheme';

function RootNavigator() {
  const { isDark } = useAppTheme();

  return (
    <NavThemeProvider value={isDark ? NavDarkTheme : NavDefaultTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => {});
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ClassProvider>
          <RootNavigator />
        </ClassProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
