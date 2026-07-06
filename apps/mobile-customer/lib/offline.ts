import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  initOffline,
  flushLocationQueue,
  postDriverLocation,
  isOfflineMode,
} from '@guzo/mobile-shared';

let connected = true;

export function getNetworkConnected() {
  return connected;
}

export function initOfflineSupport() {
  initOffline(AsyncStorage, () => connected);

  return NetInfo.addEventListener((state) => {
    connected = state.isConnected ?? false;
    if (connected) {
      flushLocationQueue((ping) => postDriverLocation(ping)).catch(() => undefined);
    }
  });
}

export { isOfflineMode };
