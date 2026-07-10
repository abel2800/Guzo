import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/lib/auth';
import { createStackScreenOptions } from '@guzo/mobile-ui';
import { colors } from '@/lib/design';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();
const stackOptions = createStackScreenOptions(colors);

function SplashHider({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => {});
  }, [loading]);
  return children;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SplashHider>
            <StatusBar style="light" />
            <Stack screenOptions={stackOptions}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ title: 'Sign in' }} />
              <Stack.Screen name="signup" options={{ title: 'Create account' }} />
              <Stack.Screen name="forgot-password" options={{ title: 'Forgot password' }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="delivery/[id]" options={{ title: 'Delivery' }} />
              <Stack.Screen name="manifest/[id]" options={{ title: 'Manifest' }} />
              <Stack.Screen name="earnings" options={{ title: 'Earnings' }} />
              <Stack.Screen name="vehicle" options={{ title: 'Vehicle' }} />
              <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            </Stack>
          </SplashHider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
