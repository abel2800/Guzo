import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/lib/auth';
import { BranchProvider } from '@/lib/branch';
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
        <BranchProvider>
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
            <Stack.Screen name="register" options={{ title: 'Register', headerShown: false }} />
            <Stack.Screen name="shelf" options={{ title: 'Assign shelf', headerShown: false }} />
            <Stack.Screen name="exceptions" options={{ title: 'Exceptions', headerShown: false }} />
            <Stack.Screen name="inventory" options={{ title: 'Inventory', headerShown: false }} />
          </Stack>
          </SplashHider>
        </BranchProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
