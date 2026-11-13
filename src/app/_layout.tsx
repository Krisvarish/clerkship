import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationBar } from 'expo-navigation-bar';
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { Colors } from '../constants/Colors';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {
        /* ignore */
      });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Root Web Viewport Container:
  // On Web, constrain root to maxWidth: 430, centered horizontally with subtle outer border
  return (
    <SafeAreaProvider>
      <View style={styles.outerContainer}>
        <StatusBar style="dark" />
        {Platform.OS === 'android' && <NavigationBar style="light" />}
        <View style={styles.appContainer}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#EAE5DE' : Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 430 : undefined,
    height: Platform.OS === 'web' ? '100%' : undefined,
    backgroundColor: Colors.background,
    ...(Platform.OS === 'web'
      ? {
          shadowColor: '#2C352E',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.12,
          shadowRadius: 30,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: '#DDD7CE',
          overflow: 'hidden' as const,
        }
      : {}),
  },
});
