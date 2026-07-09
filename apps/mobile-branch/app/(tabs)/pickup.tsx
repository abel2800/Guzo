import { useState } from 'react';
import { View, Text, TextInput, Switch, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { confirmBranchPickup, getParcelLabel, parseTrackingCode } from '@guzo/mobile-shared';
import { GradientButton, GlassCard, colors, designStyles, radius, spacing } from '@guzo/mobile-ui';
import { TrackingScanner } from '@/components/tracking-scanner';
import { useBranch } from '@/lib/branch';

export default function PickupScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { branchId } = useBranch();
  const [reference, setReference] = useState('');
  const [pin, setPin] = useState('');
  const [collectCod, setCollectCod] = useState(false);
  const [message, setMessage] = useState('');

  const tracking = reference.trim() ? parseTrackingCode(reference.trim()) : '';
  const previewKey = tracking || pin.trim();

  const { data: preview } = useQuery({
    queryKey: ['pickup-preview', branchId, previewKey],
    queryFn: () => getParcelLabel(branchId!, tracking || pin.trim()),
    enabled: !!branchId && previewKey.length >= 6,
  });

  const canSubmit = (!!reference.trim() || pin.trim().length >= 6) && !!branchId;

  const pickup = useMutation({
    mutationFn: () => {
      if (preview?.requiresCod && !collectCod) {
        throw new Error('Collect COD cash before confirming pickup');
      }
      return confirmBranchPickup(branchId!, {
        reference: reference.trim() || undefined,
        pin: pin.trim() || undefined,
        collectCod,
      });
    },
    onSuccess: (res) => {
      setMessage(`Delivered ${res.package?.trackingNumber}`);
      setReference('');
      setPin('');
      setCollectCod(false);
      qc.invalidateQueries({ queryKey: ['branch-stats'] });
    },
    onError: (e: Error) => setMessage(e.message),
  });

  return (
    <ScrollView style={[designStyles.screen, { paddingTop: insets.top }]} contentContainerStyle={[designStyles.screenPad, { paddingBottom: 40 }]}>
      <Text style={styles.title}>Customer pickup</Text>
      <Text style={styles.sub}>Scan QR, enter tracking number, or use the 6-digit pickup PIN alone.</Text>
      <GlassCard>
        <Text style={styles.label}>Reference / QR</Text>
        <TrackingScanner value={reference} onChange={setReference} onScanned={setReference} />
        <Text style={styles.label}>PIN (or PIN-only)</Text>
        <TextInput style={styles.input} value={pin} onChangeText={setPin} keyboardType="number-pad" maxLength={6} placeholder="6-digit PIN" placeholderTextColor={colors.textDim} />
        {preview ? (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>{preview.trackingNumber}</Text>
            <Text style={styles.previewMeta}>Order {preview.orderNumber} · {preview.status}</Text>
            <Text style={styles.previewMeta}>Receiver {preview.receiverPhone ?? '—'}</Text>
            {preview.requiresCod ? (
              <Text style={styles.cod}>Collect COD: ETB {preview.codAmount ?? '—'}</Text>
            ) : null}
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.codLabel}>{preview?.requiresCod ? `Collect ETB ${preview.codAmount ?? ''} cash` : 'Collect COD cash'}</Text>
          <Switch value={collectCod} onValueChange={setCollectCod} trackColor={{ true: colors.primary }} />
        </View>
        <GradientButton label={pickup.isPending ? 'Confirming…' : 'Confirm pickup'} onPress={() => pickup.mutate()} disabled={!canSubmit || pickup.isPending} />
        {message ? <Text style={styles.msg}>{message}</Text> : null}
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '900', marginBottom: 6 },
  sub: { color: colors.textMuted, marginBottom: 16 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, color: colors.text, marginBottom: 12 },
  preview: { backgroundColor: 'rgba(34,197,94,0.08)', borderRadius: radius.md, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  previewTitle: { color: colors.text, fontWeight: '800', fontFamily: 'monospace' },
  previewMeta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  cod: { color: colors.primary, fontWeight: '700', marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  codLabel: { color: colors.text, fontWeight: '600', flex: 1, paddingRight: 8 },
  msg: { color: colors.primary, marginTop: 12, textAlign: 'center' },
});
