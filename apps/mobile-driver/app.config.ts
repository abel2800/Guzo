import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'GUZO Driver',
  slug: 'guzo-driver',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'guzo-driver',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#050816',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'et.guzo.driver',
    infoPlist: {
      CFBundleURLTypes: [{ CFBundleURLSchemes: ['guzo-driver'] }],
      NSFaceIDUsageDescription: 'GUZO uses Face ID for quick and secure sign-in.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#050816',
    },
    package: 'et.guzo.driver',
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
      },
    },
    intentFilters: [
      {
        action: 'VIEW',
        data: [{ scheme: 'guzo-driver' }],
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
        locationWhenInUsePermission: 'GUZO tracks your location during active deliveries.',
        locationAlwaysAndWhenInUsePermission: 'GUZO tracks your location during active deliveries.',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#050816',
        image: './assets/splash-icon.png',
        imageWidth: 200,
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
