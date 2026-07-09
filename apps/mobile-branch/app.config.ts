import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'GUZO Branch',
  slug: 'guzo-branch',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'guzo-branch',
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
    bundleIdentifier: 'et.guzo.branch',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000',
    },
    package: 'et.guzo.branch',
    permissions: [
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_ADMIN',
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.ACCESS_FINE_LOCATION',
    ],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-camera',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#000000',
        image: './assets/splash.png',
        resizeMode: 'cover',
      },
    ],
    [
      'react-native-ble-plx',
      {
        isBackgroundEnabled: false,
        modes: ['central'],
        bluetoothAlwaysPermission: 'Allow GUZO Branch to connect to BLE scales and thermal printers.',
      },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: {
    router: { origin: false },
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
  },
});
