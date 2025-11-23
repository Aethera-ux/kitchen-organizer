import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KitchenProvider } from "@/contexts/KitchenContext";
import { RevenueCatProvider } from "@/contexts/RevenueCatContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { DrawerProvider, DrawerMenuButton } from "@/contexts/DrawerContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();



function RootLayoutNav() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ 
      headerBackTitle: "Back",
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.text,
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen 
        name="paywall" 
        options={{ 
          presentation: "modal",
          title: "Upgrade to Pro",
          headerLeft: () => null,
        }} 
      />
      <Stack.Screen 
        name="customer-center" 
        options={{ 
          presentation: "modal",
          title: "Customer Center",
          headerLeft: () => <DrawerMenuButton />,
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          presentation: "modal",
          title: "Settings",
          headerLeft: () => <DrawerMenuButton />,
        }} 
      />
      <Stack.Screen 
        name="analytics" 
        options={{ 
          presentation: "modal",
          title: "Analytics",
          headerLeft: () => <DrawerMenuButton />,
        }} 
      />
      <Stack.Screen 
        name="notifications-settings" 
        options={{ 
          presentation: "modal",
          title: "Notifications",
          headerLeft: () => <DrawerMenuButton />,
        }} 
      />
      <Stack.Screen 
        name="leftovers" 
        options={{ 
          presentation: "modal",
          title: "Leftovers",
          headerLeft: () => <DrawerMenuButton />,
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DrawerProvider>
          <RevenueCatProvider>
            <KitchenProvider>
              <GestureHandlerRootView>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </KitchenProvider>
          </RevenueCatProvider>
        </DrawerProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
