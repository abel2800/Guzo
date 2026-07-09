import { useCallback, useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { getBleManager, isBleSupported, WEIGHT_MEASUREMENT_CHAR, WEIGHT_SCALE_SERVICE } from '@/lib/ble-devices';
import { parseScaleText, parseWeightMeasurement } from '@/lib/escpos';

async function ensureBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN!,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT!,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION!,
  ]);
  return Object.values(granted).every((v) => v === PermissionsAndroid.RESULTS.GRANTED);
}

export function useBleScale(onWeight: (kg: number) => void) {
  const [scanning, setScanning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subRef = useRef<{ remove: () => void } | null>(null);
  const onWeightRef = useRef(onWeight);
  onWeightRef.current = onWeight;

  const stop = useCallback(async () => {
    subRef.current?.remove();
    subRef.current = null;
    const ble = await getBleManager();
    if (ble) await ble.stopDeviceScan();
    setScanning(false);
    setConnected(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!isBleSupported()) {
      setError('BLE scales require a physical device build');
      return;
    }
    const ok = await ensureBlePermissions();
    if (!ok) {
      setError('Bluetooth permissions denied');
      return;
    }

    const ble = await getBleManager();
    if (!ble) return;

    await stop();
    setScanning(true);

    ble.startDeviceScan(null, { allowDuplicates: true }, async (scanErr, device) => {
      if (scanErr) {
        setError(scanErr.message);
        setScanning(false);
        return;
      }
      if (!device) return;
      const name = (device.name ?? device.localName ?? '').toLowerCase();
      const looksLikeScale =
        name.includes('scale') ||
        name.includes('weight') ||
        name.includes('ble') ||
        device.serviceUUIDs?.includes(WEIGHT_SCALE_SERVICE);

      if (!looksLikeScale && !device.serviceUUIDs?.includes(WEIGHT_SCALE_SERVICE)) return;

      await ble.stopDeviceScan();
      setScanning(false);

      try {
        const connectedDevice = await device.connect({ timeout: 10000 });
        await connectedDevice.discoverAllServicesAndCharacteristics();
        setConnected(true);
        setDeviceName(device.name ?? device.localName ?? 'BLE scale');

        subRef.current = connectedDevice.monitorCharacteristicForService(
          WEIGHT_SCALE_SERVICE,
          WEIGHT_MEASUREMENT_CHAR,
          (monErr, ch) => {
            if (monErr || !ch?.value) return;
            const kg = parseWeightMeasurement(ch.value);
            if (kg != null && kg > 0) onWeightRef.current(kg);
          },
        );

                const services = await connectedDevice.services();
        for (const service of services) {
          const chars = await service.characteristics();
          for (const ch of chars) {
            if (!ch.isNotifiable) continue;
            if (ch.uuid.toLowerCase() === WEIGHT_MEASUREMENT_CHAR) continue;
            connectedDevice.monitorCharacteristicForService(service.uuid, ch.uuid, (_e, characteristic) => {
              if (!characteristic?.value) return;
              try {
                const text = atob(characteristic.value);
                const kg = parseScaleText(text);
                if (kg != null && kg > 0) onWeightRef.current(kg);
              } catch {}
            });
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to connect to scale');
        setConnected(false);
      }
    });

    setTimeout(() => {
      void ble.stopDeviceScan();
      setScanning((s) => {
        if (s) setError((prev) => prev ?? 'No BLE scale found nearby');
        return false;
      });
    }, 15000);
  }, [stop]);

  useEffect(() => () => {
    void stop();
  }, [stop]);

  return { scanning, connected, deviceName, error, start, stop };
}
