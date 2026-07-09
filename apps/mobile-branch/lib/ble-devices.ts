import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const WEIGHT_SCALE_SERVICE = '0000181d-0000-1000-8000-00805f9b34fb';
export const WEIGHT_MEASUREMENT_CHAR = '00002a9d-0000-1000-8000-00805f9b34fb';

export const THERMAL_WRITE_CHARS = [
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  '0000ae01-0000-1000-8000-00805f9b34fb',
];

const PRINTER_DEVICE_KEY = 'guzo_branch_printer_id';

type BleManagerType = import('react-native-ble-plx').BleManager;

let manager: BleManagerType | null = null;

export function isBleSupported(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

export async function getBleManager(): Promise<BleManagerType | null> {
  if (!isBleSupported()) return null;
  if (!manager) {
    const { BleManager } = await import('react-native-ble-plx');
    manager = new BleManager();
  }
  return manager;
}

export async function rememberPrinterId(id: string) {
  await AsyncStorage.setItem(PRINTER_DEVICE_KEY, id);
}

export async function getRememberedPrinterId(): Promise<string | null> {
  return AsyncStorage.getItem(PRINTER_DEVICE_KEY);
}

export async function writeEscPosToDevice(deviceId: string, data: Uint8Array): Promise<void> {
  const ble = await getBleManager();
  if (!ble) throw new Error('Bluetooth is not available on this device');

  const device = await ble.connectToDevice(deviceId, { timeout: 12000 });
  await device.discoverAllServicesAndCharacteristics();
  const services = await device.services();

  for (const service of services) {
    const chars = await service.characteristics();
    for (const ch of chars) {
      if (!ch.isWritableWithResponse && !ch.isWritableWithoutResponse) continue;
      if (!THERMAL_WRITE_CHARS.includes(ch.uuid.toLowerCase()) && chars.length > 4) continue;
      const base64 = btoa(String.fromCharCode(...data));
      if (ch.isWritableWithoutResponse) {
        await device.writeCharacteristicWithoutResponseForService(service.uuid, ch.uuid, base64);
      } else {
        await device.writeCharacteristicWithResponseForService(service.uuid, ch.uuid, base64);
      }
      await device.cancelConnection();
      return;
    }
  }

    for (const service of services) {
    const chars = await service.characteristics();
    for (const ch of chars) {
      if (!ch.isWritableWithoutResponse && !ch.isWritableWithResponse) continue;
      const base64 = btoa(String.fromCharCode(...data));
      if (ch.isWritableWithoutResponse) {
        await device.writeCharacteristicWithoutResponseForService(service.uuid, ch.uuid, base64);
      } else {
        await device.writeCharacteristicWithResponseForService(service.uuid, ch.uuid, base64);
      }
      await device.cancelConnection();
      return;
    }
  }

  await device.cancelConnection();
  throw new Error('No writable printer characteristic found');
}
