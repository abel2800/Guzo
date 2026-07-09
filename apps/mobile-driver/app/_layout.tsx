import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/lib/auth';
import { colors } from '@/lib/design';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

function SplashHider({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => {});
  }, [loading]);
  return children;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SplashHider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="delivery/[id]" options={{ title: 'Delivery' }} />
          <Stack.Screen name="manifest/[id]" options={{ title: 'Manifest' }} />
          <Stack.Screen name="earnings" options={{ title: 'Earnings' }} />
          <Stack.Screen name="vehicle" options={{ title: 'Vehicle' }} />
        </Stack>
        </SplashHider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
