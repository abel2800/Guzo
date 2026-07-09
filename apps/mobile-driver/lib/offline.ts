import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  initOffline,
  flushLocationQueue,
  initScanQueue,
  flushScanQueue,
  postDriverLocation,
  isOfflineMode,
} from '@guzo/mobile-shared';

let connected = true;

export function getNetworkConnected() {
  return connected;
}

export function initOfflineSupport() {
  initOffline(AsyncStorage, () => connected);
  initScanQueue(AsyncStorage, () => connected);

  return NetInfo.addEventListener((state) => {
    connected = state.isConnected ?? false;
    if (connected) {
      flushLocationQueue((ping) => postDriverLocation(ping)).catch(() => undefined);
      flushScanQueue(async () => ).catch(() => undefined);
    }
  });
}

export { isOfflineMode };
