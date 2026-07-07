import { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createOrder, quoteOrder } from '@guzo/mobile-shared';
import { GlassCard, GradientButton, colors, designStyles, radius, spacing } from '@guzo/mobile-ui';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const [pickupLine1, setPickupLine1] = useState('');
  const [pickupCity, setPickupCity] = useState('Addis Ababa');
  const [dropLine1, setDropLine1] = useState('');
  const [dropCity, setDropCity] = useState('Addis Ababa');
  const [dropPhone, setDropPhone] = useState('');
  const [dropName, setDropName] = useState('');
  const [weight, setWeight] = useState('1');
  const [quote, setQuote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const input = {
    deliveryType: 'STANDARD' as const,
    pickup: { line1: pickupLine1, city: pickupCity },
    dropoff: { line1: dropLine1, city: dropCity, contactName: dropName, contactPhone: dropPhone },
    package: { weightKg: parseFloat(weight) || 1 },
  };

  return (
    <ScrollView
      style={[designStyles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={[designStyles.screenPad, { paddingBottom: 100 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>New shipment</Text>
      <Text style={styles.sub}>Create a delivery for your customer.</Text>

      <GlassCard style={styles.section}>
        <Text style={styles.label}>Warehouse / pickup</Text>
        <TextInput style={styles.input} value={pickupLine1} onChangeText={setPickupLine1} placeholder="Pickup address" placeholderTextColor={colors.textDim} />
        <TextInput style={styles.input} value={pickupCity} onChangeText={setPickupCity} placeholderTextColor={colors.textDim} />
      </GlassCard>

      <GlassCard style={styles.section}>
        <Text style={styles.label}>Customer delivery</Text>
        <TextInput style={styles.input} value={dropLine1} onChangeText={setDropLine1} placeholder="Drop-off address" placeholderTextColor={colors.textDim} />
        <TextInput style={styles.input} value={dropCity} onChangeText={setDropCity} placeholderTextColor={colors.textDim} />
        <TextInput style={styles.input} value={dropName} onChangeText={setDropName} placeholder="Recipient name" placeholderTextColor={colors.textDim} />
        <TextInput style={styles.input} value={dropPhone} onChangeText={setDropPhone} placeholder="Recipient phone" placeholderTextColor={colors.textDim} keyboardType="phone-pad" />
        <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="Weight (kg)" placeholderTextColor={colors.textDim} />
      </GlassCard>

      {quote ? <Text style={styles.quote}>Quote: {quote}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <GradientButton
          variant="outline"
          label="Get quote"
          onPress={async () => {
            try {
              const q = await quoteOrder(input);
              setQuote(`${q.currency} ${q.totalAmount}`);
              setError('');
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Quote failed');
            }
          }}
        />
        <GradientButton
          label={busy ? 'Creating…' : 'Create shipment'}
          disabled={busy || !pickupLine1 || !dropLine1}
          loading={busy}
          onPress={async () => {
            setBusy(true);
            setError('');
            setSuccess('');
            try {
              const o = await createOrder(input);
              setSuccess(`Created ${o.orderNumber}`);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Failed');
            } finally {
              setBusy(false);
            }
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  sub: { color: colors.textMuted, marginTop: 4, marginBottom: 16 },
  section: { marginBottom: 12 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 },
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
  quote: { color: colors.accent, fontWeight: '600', marginBottom: 8 },
  success: { color: colors.primary, fontWeight: '600', marginBottom: 8 },
  error: { color: colors.error, marginBottom: 8 },
  actions: { gap: 12, marginTop: 8 },
});
