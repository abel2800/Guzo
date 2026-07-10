'use client';

interface ParcelQrCardProps {
  value: string;
  trackingNumber?: string;
  pickupPin?: string | null;
  hint?: string;
  size?: number;
}

export function ParcelQrCard({ value, trackingNumber, pickupPin, hint, size = 180 }: ParcelQrCardProps) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Parcel QR code" width={size} height={size} className="rounded-lg border border-border bg-white p-2" />
      {trackingNumber ? <p className="font-mono text-lg font-bold tracking-wide text-foreground">{trackingNumber}</p> : null}
      {pickupPin ? <p className="text-2xl font-bold text-emerald-400">Code: {pickupPin}</p> : null}
      {hint ? <p className="max-w-xs text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
