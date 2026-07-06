import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerPushToken, type PushTokenInput } from '@guzo/mobile-shared';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function setupPushNotifications(appSlug: PushTokenInput['appSlug']): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  await registerPushToken({
    token,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    appSlug,
  });

  return token;
}
