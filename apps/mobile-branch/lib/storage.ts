import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { TokenStorage } from '@guzo/mobile-shared';

const ACCESS_KEY = 'guzo_driver_access';
const REFRESH_KEY = 'guzo_driver_refresh';

const webStore = {
  async getItem(key: string) {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  },
  async setItem(key: string, value: string) {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  },
};

export const tokenStorage: TokenStorage = {
  async getAccessToken() {
    if (Platform.OS === 'web') return webStore.getItem(ACCESS_KEY);
    return SecureStore.getItemAsync(ACCESS_KEY);
  },
  async getRefreshToken() {
    if (Platform.OS === 'web') return webStore.getItem(REFRESH_KEY);
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async setTokens(access, refresh) {
    if (Platform.OS === 'web') {
      await webStore.setItem(ACCESS_KEY, access);
      await webStore.setItem(REFRESH_KEY, refresh);
      return;
    }
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  },
  async clear() {
    if (Platform.OS === 'web') {
      await webStore.removeItem(ACCESS_KEY);
      await webStore.removeItem(REFRESH_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};
