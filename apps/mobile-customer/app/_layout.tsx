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

          <Stack.Screen name="register" options={{ title: 'Create account' }} />

          <Stack.Screen name="forgot-password" options={{ title: 'Forgot password' }} />

          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          <Stack.Screen name="order/[id]" options={{ title: 'Track delivery' }} />

          <Stack.Screen name="track/[ref]" options={{ title: 'Track shipment' }} />

          <Stack.Screen name="scan" options={{ title: 'Scan QR' }} />

          <Stack.Screen name="branches" options={{ title: 'Branches' }} />

          <Stack.Screen name="calculator" options={{ title: 'Calculator' }} />

          <Stack.Screen name="family" options={{ title: 'Family' }} />

          <Stack.Screen name="support" options={{ title: 'Support' }} />

          <Stack.Screen name="support/[id]" options={{ title: 'Support' }} />

          <Stack.Screen name="wallet" options={{ title: 'Wallet' }} />

          <Stack.Screen name="addresses" options={{ title: 'Addresses' }} />

          <Stack.Screen name="receipts" options={{ title: 'Receipts' }} />

          <Stack.Screen name="settings" options={{ title: 'Settings' }} />

        </Stack>

        </SplashHider>

      </AuthProvider>

    </QueryClientProvider>

    </SafeAreaProvider>

  );

}

