import { connectSocket, disconnectSocket, socketUrlFromApi } from '@guzo/mobile-shared';
import { API_URL } from './config';
import { tokenStorage } from './storage';

export function connectRealtime() {
  return connectSocket(socketUrlFromApi(API_URL), () => tokenStorage.getAccessToken());
}

export { disconnectSocket, subscribeToOrder, subscribeToUserNotifications } from '@guzo/mobile-shared';
