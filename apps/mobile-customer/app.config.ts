import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'GUZO Customer',
  slug: 'guzo-customer',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'guzo-customer',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: '#000000',
  primaryColor: '#22C55E',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'cover',
    backgroundColor: '#000000',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'et.guzo.customer',
    infoPlist: {
      CFBundleURLTypes: [{ CFBundleURLSchemes: ['guzo-customer'] }],
      NSFaceIDUsageDescription: 'GUZO uses Face ID for quick and secure sign-in.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000',
    },
    package: 'et.guzo.customer',
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
      },
    },
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: false,
        data: [{ scheme: 'guzo-customer' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-notifications',
    'expo-local-authentication',
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'GUZO needs your location to set pickup addresses.',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#000000',
        image: './assets/splash.png',
        resizeMode: 'cover',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: { origin: false },
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
