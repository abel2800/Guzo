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
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="order/[id]" options={{ title: 'Track delivery', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text }} />
          <Stack.Screen name="track/[ref]" options={{ title: 'Track shipment' }} />
          <Stack.Screen name="scan" options={{ title: 'Scan QR', headerShown: false }} />
          <Stack.Screen name="branches" options={{ title: 'Branches', headerShown: false }} />
          <Stack.Screen name="calculator" options={{ title: 'Calculator', headerShown: false }} />
          <Stack.Screen name="family" options={{ title: 'Family', headerShown: false }} />
          <Stack.Screen name="support" options={{ title: 'Support', headerShown: false }} />
          <Stack.Screen name="support/[id]" options={{ title: 'Support', headerShown: false }} />
          <Stack.Screen name="wallet" options={{ title: 'Wallet', headerShown: false }} />
          <Stack.Screen name="addresses" options={{ title: 'Addresses', headerShown: false }} />
          <Stack.Screen name="receipts" options={{ title: 'Receipts', headerShown: false }} />
        </Stack>
        </SplashHider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
