import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme, ActivityIndicator } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { useColorScheme } from '../hooks/use-color-scheme';
import { useAuthStore } from '../store/auth-store';

const queryClient = new QueryClient();

const customTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    text: '#000000',
    primary: '#2563eb',
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { initAuth, isLoading } = useAuthStore();

  useEffect(() => {
    const loadAuth = async () => {
      try {
        await initAuth();
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };
    loadAuth();
  }, []);

  if (isLoading) {
    return (
      <PaperProvider theme={customTheme}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </PaperProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={customTheme}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <View style={styles.appContainer}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ headerShown: false }} />
              <Stack.Screen name="transfer" options={{ headerShown: true, title: 'Transfer' }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </View>
          <StatusBar style="auto" />
        </ThemeProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
