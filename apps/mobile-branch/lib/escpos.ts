import type { ParcelLabel } from '@guzo/mobile-shared';

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

function textLine(line: string): number[] {
  return [...new TextEncoder().encode(line), LF];
}

export function buildEscPosLabel(label: ParcelLabel): Uint8Array {
  const chunks: number[] = [];
  chunks.push(ESC, 0x40);   chunks.push(ESC, 0x61, 0x01);   chunks.push(...textLine('GUZO PARCEL'));
  chunks.push(ESC, 0x61, 0x00);   if (label.branch) chunks.push(...textLine(`${label.branch.name} · ${label.branch.city}`));
  chunks.push(...textLine(`Tracking: ${label.trackingNumber}`));
  chunks.push(...textLine(`Order: ${label.orderNumber}`));
  chunks.push(ESC, 0x45, 0x01);
  chunks.push(...textLine(`PIN ${label.pickupPin ?? '------'}`));
  chunks.push(ESC, 0x45, 0x00);
  if (label.requiresCod) chunks.push(...textLine(`COD: ETB ${label.codAmount ?? '—'}`));
  chunks.push(...textLine(`Weight: ${label.weightKg ?? '—'} kg`));
  chunks.push(...textLine(`To: ${label.receiverPhone ?? '—'}`));
  const qr = label.qrCode ?? label.trackingNumber;
  chunks.push(...textLine(`QR: ${qr}`));
  chunks.push(LF, LF, LF);
  chunks.push(GS, 0x56, 0x00);   return new Uint8Array(chunks);
}

export function parseWeightMeasurement(base64: string): number | null {
  try {
    const raw = atob(base64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    if (bytes.length < 3) return null;
    const flags = bytes[0]!;
    const isKg = (flags & 0x01) === 0;
    const value = bytes[1]! | (bytes[2]! << 8);
    const kg = isKg ? value / 200 : value / 100;
    return Math.round(kg * 100) / 100;
  } catch {
    return null;
  }
}

export function parseScaleText(payload: string): number | null {
  const match = payload.match(/(\d+(?:\.\d+)?)\s*(?:kg|k g|g)?/i);
  if (!match) return null;
  let n = Number(match[1]);
  if (Number.isNaN(n)) return null;
  if (/g\b/i.test(payload) && !/kg/i.test(payload) && n > 50) n = n / 1000;
  return Math.round(n * 100) / 100;
}
