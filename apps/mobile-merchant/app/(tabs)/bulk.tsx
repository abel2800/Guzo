import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createOrdersBulk, validateBulkOrders, type CreateOrderInput } from '@guzo/mobile-shared';
import { GlassCard, GradientButton, colors, designStyles, radius, spacing } from '@guzo/mobile-ui';

const emptyRow = (): CreateOrderInput => ({
  deliveryType: 'STANDARD',
  pickup: { line1: '', city: 'Addis Ababa' },
  dropoff: { line1: '', city: 'Addis Ababa', contactName: '', contactPhone: '' },
  package: { weightKg: 1 },
});

export default function BulkScreen() {
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<CreateOrderInput[]>([emptyRow(), emptyRow()]);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function updateRow(i: number, patch: Partial<CreateOrderInput>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <ScrollView
      style={[designStyles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={[designStyles.screenPad, { paddingBottom: 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Bulk upload</Text>
      <Text style={styles.sub}>Create multiple shipments at once (max 200). Each card is one order.</Text>

      {rows.map((row, i) => (
        <GlassCard key={i} style={styles.rowCard}>
          <Text style={styles.rowTitle}>Shipment {i + 1}</Text>
          <TextInput
            style={styles.input}
            placeholder="Pickup address"
            placeholderTextColor={colors.textDim}
            value={row.pickup.line1}
            onChangeText={(v) => updateRow(i, { pickup: { ...row.pickup, line1: v } })}
          />
          <TextInput
            style={styles.input}
            placeholder="Drop-off address"
            placeholderTextColor={colors.textDim}
            value={row.dropoff.line1}
            onChangeText={(v) => updateRow(i, { dropoff: { ...row.dropoff, line1: v } })}
          />
          <TextInput
            style={styles.input}
            placeholder="Recipient phone"
            placeholderTextColor={colors.textDim}
            value={row.dropoff.contactPhone ?? ''}
            onChangeText={(v) => updateRow(i, { dropoff: { ...row.dropoff, contactPhone: v } })}
            keyboardType="phone-pad"
          />
        </GlassCard>
      ))}

      <Pressable style={styles.addRow} onPress={() => setRows((r) => [...r, emptyRow()])}>
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.addRowText}>Add row</Text>
      </Pressable>

      {result ? <Text style={styles.success}>{result}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <GradientButton
        label={busy ? 'Uploading…' : 'Submit bulk orders'}
        disabled={busy}
        loading={busy}
        onPress={async () => {
          setBusy(true);
          setError('');
          setResult('');
          try {
            const validationError = validateBulkOrders(rows);
            if (validationError) throw new Error(validationError);
            const summary = await createOrdersBulk(rows);
            setResult(`Created ${summary.created}/${summary.total} orders`);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Bulk upload failed');
          } finally {
            setBusy(false);
          }
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { color: colors.text, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  sub: { color: colors.textMuted, marginTop: 4, marginBottom: 16, lineHeight: 20 },
  rowCard: { marginBottom: 12 },
  rowTitle: { color: colors.primary, fontWeight: '700', marginBottom: 10 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    color: colors.text,
    fontSize: 15,
    marginBottom: 10,
  },
  addRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginBottom: 16 },
  addRowText: { color: colors.primary, fontWeight: '600' },
  success: { color: colors.primary, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  error: { color: colors.error, marginBottom: 12, textAlign: 'center' },
});
