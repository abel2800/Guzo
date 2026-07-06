import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_KEY = 'guzo_biometric_enabled';
const EMAIL_KEY = 'guzo_last_email';

/** Per-app scope so customer login email is not reused on the driver app. */
export type MobileAppScope = 'customer' | 'driver' | 'merchant';

function scopedKey(base: string, app?: MobileAppScope): string {
  return app ? `${base}_${app}` : base;
}

const isWeb = Platform.OS === 'web';

async function getItem(key: string): Promise<string | null> {
  if (isWeb) return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function isBiometricHardwareAvailable(): Promise<boolean> {
  if (isWeb) return false;
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function authenticateWithBiometrics(prompt = 'Unlock GUZO'): Promise<boolean> {
  if (isWeb) return false;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    cancelLabel: 'Use password',
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function getBiometricEnabled(app?: MobileAppScope): Promise<boolean> {
  return (await getItem(scopedKey(BIOMETRIC_KEY, app))) === '1';
}

export async function setBiometricEnabled(enabled: boolean, app?: MobileAppScope): Promise<void> {
  const key = scopedKey(BIOMETRIC_KEY, app);
  if (enabled) await setItem(key, '1');
  else await removeItem(key);
}

export async function getLastEmail(app?: MobileAppScope): Promise<string | null> {
  return getItem(scopedKey(EMAIL_KEY, app));
}

export async function setLastEmail(email: string, app?: MobileAppScope): Promise<void> {
  await setItem(scopedKey(EMAIL_KEY, app), email);
}

export async function clearBiometricPrefs(app?: MobileAppScope): Promise<void> {
  await removeItem(scopedKey(BIOMETRIC_KEY, app));
  await removeItem(scopedKey(EMAIL_KEY, app));
}
