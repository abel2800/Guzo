import { Alert } from 'react-native';
import type { ParcelLabel } from '@guzo/mobile-shared';
import * as Print from 'expo-print';
import { buildEscPosLabel } from '@/lib/escpos';
import {
  getBleManager,
  getRememberedPrinterId,
  isBleSupported,
  rememberPrinterId,
  writeEscPosToDevice,
} from '@/lib/ble-devices';

async function pickThermalPrinter(): Promise<string | null> {
  const ble = await getBleManager();
  if (!ble) return null;

  const remembered = await getRememberedPrinterId();
  if (remembered) return remembered;

  return new Promise((resolve) => {
    const found = new Map<string, string>();
    const timeout = setTimeout(async () => {
      await ble.stopDeviceScan();
      const ids = [...found.keys()];
      if (ids.length === 0) {
        resolve(null);
        return;
      }
      if (ids.length === 1) {
        await rememberPrinterId(ids[0]!);
        resolve(ids[0]!);
        return;
      }
      const names = ids.map((id) => found.get(id) ?? id);
      Alert.alert(
        'Select printer',
        'Choose a Bluetooth thermal printer',
        [
          ...ids.map((id, i) => ({
            text: names[i]!,
            onPress: async () => {
              await rememberPrinterId(id);
              resolve(id);
            },
          })),
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        ],
        { cancelable: true },
      );
    }, 8000);

    ble.startDeviceScan(null, null, (err, device) => {
      if (err || !device) return;
      const name = (device.name ?? device.localName ?? '').toLowerCase();
      if (
        name.includes('printer') ||
        name.includes('pos') ||
        name.includes('mtp') ||
        name.includes('rpp') ||
        name.includes('thermal')
      ) {
        found.set(device.id, device.name ?? device.localName ?? device.id);
      }
    });

    setTimeout(() => clearTimeout(timeout), 8100);
  });
}

export async function printParcelLabel(label: ParcelLabel): Promise<void> {
  await Print.printAsync({ html: labelHtml(label) });
}

export async function shareParcelLabelPdf(label: ParcelLabel): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: labelHtml(label) });
  const Sharing = await import('expo-sharing');
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share parcel label' });
  }
}

export async function printParcelLabelThermal(label: ParcelLabel): Promise<void> {
  if (!isBleSupported()) {
    Alert.alert('Thermal printer', 'Bluetooth printing requires an Android or iOS device build.');
    return;
  }

  const deviceId = await pickThermalPrinter();
  if (!deviceId) {
    Alert.alert('Thermal printer', 'No Bluetooth printer found. Pair a printer and try again.');
    return;
  }

  const bytes = buildEscPosLabel(label);
  await writeEscPosToDevice(deviceId, bytes);
  Alert.alert('Printed', 'Label sent to thermal printer.');
}

function labelHtml(label: ParcelLabel): string {
  const branch = label.branch;
  const qr = label.qrCode ?? label.trackingNumber;
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qr)}`;
  const cod = label.requiresCod ? `<div class="row"><strong>COD:</strong> ETB ${label.codAmount ?? '—'}</div>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    .meta { color: #444; margin-bottom: 16px; }
    .box { border: 2px dashed #22c55e; padding: 16px; border-radius: 8px; }
    .row { margin: 6px 0; font-size: 14px; }
    .pin { font-size: 28px; font-weight: bold; letter-spacing: 4px; }
    img { display: block; margin: 12px 0; }
  </style></head><body>
  <div class="box">
    <h1>GUZO Parcel Label</h1>
    <div class="meta">${branch ? `${branch.name} · ${branch.city}` : 'Branch'}</div>
    <div class="row"><strong>Tracking:</strong> ${label.trackingNumber}</div>
    <div class="row"><strong>Order:</strong> ${label.orderNumber}</div>
    <div class="row pin">PIN ${label.pickupPin ?? '—'}</div>
    ${cod}
    <div class="row"><strong>Weight:</strong> ${label.weightKg ?? '—'} kg</div>
    <div class="row"><strong>To:</strong> ${label.receiverPhone ?? '—'}</div>
    <img src="${qrImg}" width="160" height="160" alt="QR code" />
  </div></body></html>`;
}
