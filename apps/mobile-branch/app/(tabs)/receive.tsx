import { useState } from 'react';
import { View, Text, TextInput, Image, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { getParcelLabel, receiveAtBranch, receiveIntakeAtBranch, enqueueScanAction, isOfflineMode, type ParcelLabel } from '@guzo/mobile-shared';
import { GradientButton, GlassCard, colors, designStyles, radius, spacing } from '@guzo/mobile-ui';
import { TrackingScanner } from '@/components/tracking-scanner';
import { useBranch } from '@/lib/branch';
import { printParcelLabel, printParcelLabelThermal, shareParcelLabelPdf } from '@/lib/labels';
import { useBleScale } from '@/hooks/use-ble-scale';

export default function ReceiveScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { branchId } = useBranch();
  const [tracking, setTracking] = useState('');
  const [shelf, setShelf] = useState('');
  const [zone, setZone] = useState('A');
  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [message, setMessage] = useState('');
  const [lastLabel, setLastLabel] = useState<ParcelLabel | null>(null);

  const scale = useBleScale((kg) => setWeight(String(kg)));

  const receive = useMutation({
    mutationFn: async () => {
      const payload = {
        trackingNumber: tracking.trim(),
        shelfCode: shelf.trim() || undefined,
        zone,
        weightKg: weight ? Number(weight) : undefined,
        description: description.trim() || undefined,
        photo: photo ?? undefined,
      };
      if (photo) return receiveIntakeAtBranch(branchId!, payload);
      if (isOfflineMode()) {
        await enqueueScanAction('branch:receive', { branchId, ...payload });
        return {
          package: {
            trackingNumber: payload.trackingNumber,
            order: { status: 'QUEUED_OFFLINE' },
          },
        } as Awaited<ReturnType<typeof receiveAtBranch>>;
      }
      return receiveAtBranch(branchId!, payload);
    },
    onSuccess: async (res) => {
      const status = res.package?.order?.status;
      setMessage(
        status === 'QUEUED_OFFLINE'
          ? `Queued offline: ${res.package?.trackingNumber}`
          : `Received ${res.package?.trackingNumber} → ${status}`,
      );
      if (branchId && res.package?.trackingNumber) {
        const label = await getParcelLabel(branchId, res.package.trackingNumber);
        setLastLabel(label);
      }
      setTracking('');
      setPhoto(null);
      qc.invalidateQueries({ queryKey: ['branch-stats'] });
    },
    onError: (e: Error) => setMessage(e.message),
  });

  async function pickPhoto() {
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
    if (!res.canceled && res.assets[0]) {
      const asset = res.assets[0];
      setPhoto({ uri: asset.uri, name: 'intake.jpg', type: asset.mimeType ?? 'image/jpeg' });
    }
  }

  return (
    <ScrollView style={[designStyles.screen, { paddingTop: insets.top }]} contentContainerStyle={[designStyles.screenPad, { paddingBottom: 40 }]}>
      <Text style={styles.title}>Receive parcel</Text>
      <Text style={styles.sub}>Scan barcode, weigh, photograph, and store at shelf.</Text>
      <GlassCard>
        <Text style={styles.label}>Tracking</Text>
        <TrackingScanner value={tracking} onChange={setTracking} onScanned={setTracking} />

        <Text style={styles.label}>Weight (kg)</Text>
        <View style={styles.weightRow}>
          <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="1.5" placeholderTextColor={colors.textDim} />
          <Pressable style={styles.scaleBtn} onPress={() => (scale.connected ? scale.stop() : scale.start())}>
            <Ionicons name={scale.connected ? 'bluetooth' : 'scale-outline'} size={18} color={colors.primary} />
            <Text style={styles.scaleBtnText}>{scale.scanning ? 'Scanning…' : scale.connected ? 'Scale' : 'BLE scale'}</Text>
          </Pressable>
        </View>
        {scale.deviceName ? <Text style={styles.scaleHint}>Connected: {scale.deviceName}</Text> : null}
        {scale.error ? <Text style={styles.scaleErr}>{scale.error}</Text> : null}

        <Text style={styles.label}>Description</Text>
        <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Fragile documents" placeholderTextColor={colors.textDim} />

        <Text style={styles.label}>Shelf (optional)</Text>
        <TextInput style={styles.input} value={shelf} onChangeText={setShelf} placeholder="A / Row 2 / Pos 12" placeholderTextColor={colors.textDim} />
        <TextInput style={styles.input} value={zone} onChangeText={setZone} placeholder="Zone" placeholderTextColor={colors.textDim} />

        <Pressable style={styles.photoBtn} onPress={pickPhoto}>
          <Ionicons name="camera-outline" size={20} color={colors.primary} />
          <Text style={styles.photoText}>{photo ? 'Retake intake photo' : 'Take parcel photo'}</Text>
        </Pressable>
        {photo ? <Image source={{ uri: photo.uri }} style={styles.preview} /> : null}

        <GradientButton label={receive.isPending ? 'Receiving…' : 'Receive'} onPress={() => receive.mutate()} disabled={!tracking.trim() || !branchId || receive.isPending} />
        {message ? <Text style={styles.msg}>{message}</Text> : null}

        {lastLabel ? (
          <View style={styles.labelActions}>
            <Pressable style={styles.labelBtn} onPress={() => printParcelLabelThermal(lastLabel)}>
              <Text style={styles.labelBtnText}>Thermal</Text>
            </Pressable>
            <Pressable style={styles.labelBtn} onPress={() => printParcelLabel(lastLabel)}>
              <Text style={styles.labelBtnText}>Print label</Text>
            </Pressable>
            <Pressable style={styles.labelBtn} onPress={() => shareParcelLabelPdf(lastLabel)}>
              <Text style={styles.labelBtnText}>Share PDF</Text>
            </Pressable>
          </View>
        ) : null}
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '900', marginBottom: 6 },
  sub: { color: colors.textMuted, marginBottom: 16 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6, marginTop: 8, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, color: colors.text, marginBottom: 8 },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  scaleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary },
  scaleBtnText: { color: colors.primary, fontWeight: '600', fontSize: 12 },
  scaleHint: { color: colors.textMuted, fontSize: 11, marginBottom: 6 },
  scaleErr: { color: '#f87171', fontSize: 11, marginBottom: 6 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, marginBottom: 8 },
  photoText: { color: colors.primary, fontWeight: '600' },
  preview: { width: '100%', height: 140, borderRadius: radius.md, marginBottom: 12 },
  msg: { color: colors.primary, marginTop: 12, textAlign: 'center' },
  labelActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  labelBtn: { flex: 1, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary, alignItems: 'center' },
  labelBtnText: { color: colors.primary, fontWeight: '700' },
});
