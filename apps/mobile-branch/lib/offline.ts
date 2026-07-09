import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  initOffline,
  initScanQueue,
  flushLocationQueue,
  flushScanQueue,
  postDriverLocation,
  isOfflineMode,
  receiveAtBranch,
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
      flushScanQueue(async (action) => {
        if (action.type === 'branch:receive') {
          const { branchId, ...payload } = action.payload as {
            branchId: string;
            trackingNumber: string;
            shelfCode?: string;
            zone?: string;
            weightKg?: number;
            description?: string;
          };
          await receiveAtBranch(branchId, payload);
        }
      }).catch(() => undefined);
    }
  });
}

export { isOfflineMode };
