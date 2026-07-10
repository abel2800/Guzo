import { Stack } from 'expo-router';

import { StatusBar } from 'expo-status-bar';

import * as SplashScreen from 'expo-splash-screen';

import { useEffect } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/lib/auth';

import { BranchProvider } from '@/lib/branch';

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

        <BranchProvider>

          <SplashHider>

          <StatusBar style="light" />

          <Stack screenOptions={stackOptions}>

            <Stack.Screen name="index" options={{ headerShown: false }} />

            <Stack.Screen name="login" options={{ title: 'Sign in' }} />

            <Stack.Screen name="signup" options={{ title: 'Create account' }} />

            <Stack.Screen name="forgot-password" options={{ title: 'Forgot password' }} />

            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            <Stack.Screen name="register" options={{ title: 'Register parcel' }} />

            <Stack.Screen name="shelf" options={{ title: 'Assign shelf' }} />

            <Stack.Screen name="exceptions" options={{ title: 'Exceptions' }} />

            <Stack.Screen name="inventory" options={{ title: 'Inventory' }} />

            <Stack.Screen name="stats/[filter]" options={{ title: 'Stats' }} />

            <Stack.Screen name="settings" options={{ title: 'Settings' }} />

          </Stack>

          </SplashHider>

        </BranchProvider>

      </AuthProvider>

    </QueryClientProvider>

    </SafeAreaProvider>

  );

}

