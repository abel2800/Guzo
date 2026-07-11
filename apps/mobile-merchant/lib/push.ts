import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerPushToken } from '@guzo/mobile-shared';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupPushNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await registerPushToken({ token, platform: Platform.OS === 'ios' ? 'ios' : 'android', appSlug: 'merchant' });
}
