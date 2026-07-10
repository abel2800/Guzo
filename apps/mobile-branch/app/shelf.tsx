import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { assignBranchShelf, lookupBranchShelf } from '@guzo/mobile-shared';
import { GradientButton, GlassCard, colors, designStyles, radius, spacing } from '@guzo/mobile-ui';
import { TrackingScanner } from '@/components/tracking-scanner';
import { useBranch } from '@/lib/branch';

export default function ShelfScreen() {
  const { tracking: trackingParam } = useLocalSearchParams<{ tracking?: string }>();
  const { branchId } = useBranch();
  const [tracking, setTracking] = useState('');
  const [shelf, setShelf] = useState('');
  const [lookup, setLookup] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (typeof trackingParam === 'string' && trackingParam.trim()) {
      setTracking(trackingParam.trim());
    }
  }, [trackingParam]);

  const assign = useMutation({
    mutationFn: () => assignBranchShelf(branchId!, { trackingNumber: tracking.trim(), shelfCode: shelf.trim() }),
    onSuccess: () => {
      setMessage('Shelf updated');
      setTracking('');
    },
    onError: (e: Error) => setMessage(e.message),
  });

  async function onLookup() {
    if (!branchId || !lookup.trim()) return;
    try {
      const items = await lookupBranchShelf(branchId, lookup.trim());
      setResults(items.map((i) => i.package?.trackingNumber ?? i.id));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Lookup failed');
    }
  }

  return (
    <View style={[designStyles.screen, { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }]}>
      <Text style={styles.title}>Shelf management</Text>
      <GlassCard style={{ marginBottom: 16 }}>
        <Text style={styles.label}>Assign shelf</Text>
        <TrackingScanner value={tracking} onChange={setTracking} />
        <TextInput style={styles.input} value={shelf} onChangeText={setShelf} placeholder="A / Row 2 / Pos 12" placeholderTextColor={colors.textDim} />
        <GradientButton label="Save shelf" onPress={() => assign.mutate()} disabled={!tracking || !shelf || assign.isPending} />
      </GlassCard>
      <GlassCard>
        <Text style={styles.label}>Find by shelf</Text>
        <TextInput style={styles.input} value={lookup} onChangeText={setLookup} placeholder="Shelf code" placeholderTextColor={colors.textDim} />
        <GradientButton label="Lookup" onPress={onLookup} />
        {results.map((r) => (
          <Pressable key={r} onPress={() => setTracking(r)}>
            <Text style={styles.result}>{r}</Text>
          </Pressable>
        ))}
      </GlassCard>
      {message ? <Text style={styles.msg}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 22, fontWeight: '900', marginBottom: 12 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, color: colors.text, marginBottom: 10 },
  result: { color: colors.text, marginTop: 8 },
  msg: { color: colors.primary, marginTop: 12, textAlign: 'center' },
});
