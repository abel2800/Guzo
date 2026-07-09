import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { trackOrder } from '@guzo/mobile-shared';
import { GradientButton, GlassCard } from '@guzo/mobile-ui';
import { colors, designStyles, radius, spacing } from '@/lib/design';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [ref, setRef] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scanned, setScanned] = useState(false);

  const resolveRef = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError('');
    try {
      const order = await trackOrder(trimmed);
      router.replace(`/order/${order.id}`);
    } catch {
      setError('No parcel found for that code');
      setScanned(false);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  function onBarcodeScanned({ data }: { data: string }) {
    if (scanned || mode !== 'scan') return;
    setScanned(true);
    const code = data.includes('track/') ? data.split('track/').pop()! : data;
    void resolveRef(code);
  }

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Scan QR</Text>
        <Pressable onPress={() => setMode(mode === 'scan' ? 'manual' : 'scan')} style={styles.back}>
          <Ionicons name={mode === 'scan' ? 'keypad-outline' : 'qr-code-outline'} size={22} color={colors.primary} />
        </Pressable>
      </View>

      <View style={designStyles.screenPad}>
        {mode === 'scan' ? (
          <>
            {!permission?.granted ? (
              <GlassCard style={styles.scanBox}>
                <Ionicons name="camera-outline" size={48} color={colors.primary} />
                <Text style={styles.hint}>Camera access is required to scan parcel QR codes</Text>
                <GradientButton label="Allow camera" onPress={requestPermission} />
              </GlassCard>
            ) : (
              <View style={styles.cameraWrap}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={onBarcodeScanned}
                />
                <View style={styles.frame} />
              </View>
            )}
            <Text style={styles.sub}>Point at a tracking QR on your parcel or receipt</Text>
          </>
        ) : (
          <>
            <Text style={styles.fieldLabel}>Tracking reference</Text>
            <TextInput
              style={styles.input}
              value={ref}
              onChangeText={setRef}
              placeholder="TRK-… or ORD-… or GZ-…"
              placeholderTextColor={colors.textDim}
              autoCapitalize="characters"
            />
            <GradientButton label={busy ? 'Looking up…' : 'Track parcel'} onPress={() => resolveRef(ref)} disabled={busy || !ref.trim()} />
          </>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12 },
  back: { width: 40 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  scanBox: { alignItems: 'center', padding: spacing.xl, marginBottom: spacing.lg, gap: 12 },
  hint: { color: colors.text, fontWeight: '600', textAlign: 'center' },
  sub: { color: colors.textDim, fontSize: 12, textAlign: 'center', marginTop: 12 },
  cameraWrap: { borderRadius: radius.lg, overflow: 'hidden', height: 320, borderWidth: 1, borderColor: colors.border },
  camera: { flex: 1 },
  frame: {
    position: 'absolute',
    top: '20%',
    left: '15%',
    right: '15%',
    bottom: '20%',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
  },
  fieldLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    marginBottom: 16,
  },
  error: { color: '#ef4444', marginTop: 12 },
});
