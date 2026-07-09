import type { ConfigContext, ExpoConfig } from 'expo/config';

const SPLASH = {
  image: './assets/splash.png' as const,
  resizeMode: 'cover' as const,
  backgroundColor: '#000000',
};

const SPLASH_PLUGIN = [
  'expo-splash-screen',
  {
    backgroundColor: '#000000',
    image: './assets/splash.png',
    resizeMode: 'cover',
  },
] as const;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'GUZO Driver',
  slug: 'guzo-driver',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'guzo-driver',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: '#000000',
  primaryColor: '#22C55E',
  splash: SPLASH,
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
      backgroundColor: '#000000',
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
    'expo-camera',
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
    SPLASH_PLUGIN,
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
