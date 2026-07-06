import Constants from 'expo-constants';

/** Use your machine LAN IP when testing on a physical device (not localhost). */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  'http://localhost:4000/api/v1';

export const FILE_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '');
