import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { markBranchException } from '@guzo/mobile-shared';
import { GradientButton, GlassCard, colors, designStyles, radius, spacing } from '@guzo/mobile-ui';
import { TrackingScanner } from '@/components/tracking-scanner';
import { useBranch } from '@/lib/branch';

const REASONS = ['DAMAGED', 'RETURNED', 'EXPIRED', 'WRONG_BRANCH'];

export default function ExceptionsScreen() {
  const { branchId } = useBranch();
  const [tracking, setTracking] = useState('');
  const [reason, setReason] = useState('RETURNED');
  const [message, setMessage] = useState('');

  const mark = useMutation({
    mutationFn: () => markBranchException(branchId!, { trackingNumber: tracking.trim(), reason }),
    onSuccess: () => {
      setMessage('Exception recorded');
      setTracking('');
    },
    onError: (e: Error) => setMessage(e.message),
  });

  return (
    <View style={[designStyles.screen, { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }]}>
      <Text style={styles.title}>Returns & exceptions</Text>
      <GlassCard>
        <Text style={styles.label}>Tracking</Text>
        <TrackingScanner value={tracking} onChange={setTracking} onScanned={setTracking} />
        <View style={styles.reasonRow}>
          {REASONS.map((r) => (
            <Pressable key={r} onPress={() => setReason(r)} style={[styles.reason, reason === r && styles.reasonActive]}>
              <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>{r}</Text>
            </Pressable>
          ))}
        </View>
        <GradientButton label="Submit" onPress={() => mark.mutate()} disabled={!tracking || mark.isPending} />
        {message ? <Text style={styles.msg}>{message}</Text> : null}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 22, fontWeight: '900', marginBottom: 12 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  reason: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  reasonActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.12)' },
  reasonText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  reasonTextActive: { color: colors.primary },
  msg: { color: colors.primary, marginTop: 12, textAlign: 'center' },
});
