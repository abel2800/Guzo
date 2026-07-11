import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerPushToken, removePushToken, type PushTokenInput } from '@guzo/mobile-shared';

const PUSH_PREF_PREFIX = 'guzo_push_enabled_';
const PUSH_TOKEN_PREFIX = 'guzo_push_token_';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function prefKey(appSlug: PushTokenInput['appSlug']) {
  return `${PUSH_PREF_PREFIX}${appSlug}`;
}

function tokenKey(appSlug: PushTokenInput['appSlug']) {
  return `${PUSH_TOKEN_PREFIX}${appSlug}`;
}

export async function loadPushPreference(appSlug: PushTokenInput['appSlug']): Promise<boolean> {
  const raw = await AsyncStorage.getItem(prefKey(appSlug));
  return raw !== 'false';
}

async function savePushPreference(appSlug: PushTokenInput['appSlug'], enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(prefKey(appSlug), enabled ? 'true' : 'false');
}

export async function setupPushNotifications(appSlug: PushTokenInput['appSlug']): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return false;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  await registerPushToken({
    token,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    appSlug,
  });

  await AsyncStorage.setItem(tokenKey(appSlug), token);
  await savePushPreference(appSlug, true);
  return true;
}

export async function disablePushNotifications(appSlug: PushTokenInput['appSlug']): Promise<void> {
  const token = await AsyncStorage.getItem(tokenKey(appSlug));
  if (token) {
    try {
      await removePushToken(token);
    } catch {
      // Token may already be removed server-side.
    }
    await AsyncStorage.removeItem(tokenKey(appSlug));
  }
  await savePushPreference(appSlug, false);
}
