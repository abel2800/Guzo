import Constants from 'expo-constants';

function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL ?? Constants.expoConfig?.extra?.apiUrl;
  if (fromEnv) return fromEnv;

  const hostUri = Constants.expoGoConfig?.debuggerHost ?? Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost') return `http://${host}:4010/api/v1`;
  }

  return 'http://localhost:4010/api/v1';
}

export const API_URL = resolveApiUrl();
export const FILE_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '');
