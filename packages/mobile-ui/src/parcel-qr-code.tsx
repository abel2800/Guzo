import { Image, Text, View, StyleSheet } from 'react-native';
import { colors, radius } from './design';

export interface ParcelQrCodeProps {
  value: string;
  trackingNumber?: string;
  pickupPin?: string | null;
  size?: number;
  hint?: string;
}

export function ParcelQrCode({ value, trackingNumber, pickupPin, size = 180, hint }: ParcelQrCodeProps) {
  const uri = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;

  return (
    <View style={styles.wrap}>
      <Image source={{ uri }} style={{ width: size, height: size, borderRadius: radius.md }} />
      {trackingNumber ? (
        <Text style={styles.code}>{trackingNumber}</Text>
      ) : null}
      {pickupPin ? (
        <Text style={styles.pin}>Code: {pickupPin}</Text>
      ) : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8 },
  code: { color: colors.text, fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  pin: { color: colors.primary, fontWeight: '700', fontSize: 22 },
  hint: { color: colors.textMuted, fontSize: 12, textAlign: 'center', maxWidth: 260 },
});
