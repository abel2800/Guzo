import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createOrder, quoteOrder, type DeliveryType } from '@guzo/mobile-shared';
import { StepIndicator, GradientButton, GlassCard } from '@guzo/mobile-ui';
import { colors, designStyles, radius, spacing } from '@/lib/design';

const STEPS = ['Pickup', 'Drop-off', 'Package', 'Confirm'];
const DELIVERY_TYPES: { value: DeliveryType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'STANDARD', label: 'Standard', icon: 'cube-outline' },
  { value: 'EXPRESS', label: 'Express', icon: 'flash-outline' },
  { value: 'SAME_DAY', label: 'Same day', icon: 'today-outline' },
  { value: 'SCHEDULED', label: 'Scheduled', icon: 'calendar-outline' },
];

export default function BookScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('STANDARD');
  const [pickupLine1, setPickupLine1] = useState('');
  const [pickupCity, setPickupCity] = useState('Addis Ababa');
  const [pickupPhone, setPickupPhone] = useState('');
  const [pickupName, setPickupName] = useState('');
  const [dropLine1, setDropLine1] = useState('');
  const [dropCity, setDropCity] = useState('Addis Ababa');
  const [dropPhone, setDropPhone] = useState('');
  const [dropName, setDropName] = useState('');
  const [weight, setWeight] = useState('1');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledAt, setScheduledAt] = useState(new Date(Date.now() + 3600000));
  const [showPicker, setShowPicker] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const input = {
    deliveryType: deliveryType === 'SCHEDULED' ? 'SCHEDULED' as const : deliveryType,
    pickup: { line1: pickupLine1, city: pickupCity, contactName: pickupName, contactPhone: pickupPhone },
    dropoff: { line1: dropLine1, city: dropCity, contactName: dropName, contactPhone: dropPhone },
    package: { weightKg: parseFloat(weight) || 1, description },
    notes,
    ...(deliveryType === 'SCHEDULED' ? { scheduledPickupAt: scheduledAt.toISOString() } : {}),
  };

  async function useMyLocation(target: 'pickup' | 'dropoff') {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    const [geo] = await Location.reverseGeocodeAsync(loc.coords);
    const line = [geo?.street, geo?.name].filter(Boolean).join(', ') || 'Current location';
    const city = geo?.city ?? geo?.subregion ?? 'Addis Ababa';
    if (target === 'pickup') {
      setPickupLine1(line);
      setPickupCity(city);
    } else {
      setDropLine1(line);
      setDropCity(city);
    }
  }

  async function onQuote() {
    setError('');
    try {
      const q = await quoteOrder(input);
      setQuote(`${q.currency} ${q.totalAmount.toLocaleString()} · ${q.distanceKm.toFixed(1)} km`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Quote failed');
    }
  }

  async function onSubmit() {
    setError('');
    setBusy(true);
    try {
      const order = await createOrder(input);
      router.replace(`/order/${order.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (step === 3) onQuote();
    if (step < 4) setStep(step + 1);
  }

  function back() {
    if (step > 1) setStep(step - 1);
  }

  const canNext =
    (step === 1 && pickupLine1) ||
    (step === 2 && dropLine1) ||
    (step === 3 && weight) ||
    step === 4;

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={step > 1 ? back : undefined} style={styles.backBtn}>
          {step > 1 && <Ionicons name="chevron-back" size={24} color={colors.text} />}
        </Pressable>
        <Text style={styles.headerTitle}>Send order</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={[designStyles.screenPad, { paddingTop: spacing.sm }]} keyboardShouldPersistTaps="handled">
        <StepIndicator current={step} total={4} labels={STEPS} />

        {step === 1 && (
          <GlassCard glow>
            <Text style={styles.stepTitle}>Pickup location</Text>
            <Pressable style={styles.locationBtn} onPress={() => useMyLocation('pickup')}>
              <Ionicons name="navigate" size={18} color={colors.primary} />
              <Text style={styles.locationBtnText}>Use current location</Text>
            </Pressable>
            <Field label="Street address" value={pickupLine1} onChange={setPickupLine1} placeholder="Bole Road, near…" />
            <Field label="City" value={pickupCity} onChange={setPickupCity} />
            <Field label="Contact name" value={pickupName} onChange={setPickupName} />
            <Field label="Phone" value={pickupPhone} onChange={setPickupPhone} keyboard="phone-pad" />
          </GlassCard>
        )}

        {step === 2 && (
          <GlassCard glow>
            <Text style={styles.stepTitle}>Drop-off location</Text>
            <Pressable style={styles.locationBtn} onPress={() => useMyLocation('dropoff')}>
              <Ionicons name="navigate" size={18} color={colors.accent} />
              <Text style={styles.locationBtnText}>Use current location</Text>
            </Pressable>
            <Field label="Street address" value={dropLine1} onChange={setDropLine1} placeholder="Kazanchis, building…" />
            <Field label="City" value={dropCity} onChange={setDropCity} />
            <Field label="Recipient name" value={dropName} onChange={setDropName} />
            <Field label="Phone" value={dropPhone} onChange={setDropPhone} keyboard="phone-pad" />
          </GlassCard>
        )}

        {step === 3 && (
          <GlassCard>
            <Text style={styles.stepTitle}>Package details</Text>
            <Text style={styles.fieldLabel}>Delivery speed</Text>
            <View style={styles.typeRow}>
              {DELIVERY_TYPES.map((d) => (
                <Pressable
                  key={d.value}
                  onPress={() => setDeliveryType(d.value)}
                  style={[styles.typeChip, deliveryType === d.value && styles.typeChipActive]}
                >
                  <Ionicons name={d.icon} size={16} color={deliveryType === d.value ? colors.primary : colors.textMuted} />
                  <Text style={[styles.typeChipText, deliveryType === d.value && styles.typeChipTextActive]}>{d.label}</Text>
                </Pressable>
              ))}
            </View>
            {deliveryType === 'SCHEDULED' && (
              <>
                <Text style={styles.fieldLabel}>Scheduled pickup</Text>
                <Pressable style={styles.input} onPress={() => setShowPicker(true)}>
                  <Text style={{ color: colors.text }}>{scheduledAt.toLocaleString()}</Text>
                </Pressable>
                {showPicker && (
                  <DateTimePicker
                    value={scheduledAt}
                    mode="datetime"
                    minimumDate={new Date()}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, d) => {
                      setShowPicker(Platform.OS === 'ios');
                      if (d) setScheduledAt(d);
                    }}
                  />
                )}
              </>
            )}
            <Field label="Weight (kg)" value={weight} onChange={setWeight} keyboard="decimal-pad" />
            <Field label="Description" value={description} onChange={setDescription} placeholder="What's inside?" />
            <Field label="Notes for driver" value={notes} onChange={setNotes} placeholder="Optional" />
          </GlassCard>
        )}

        {step === 4 && (
          <GlassCard glow>
            <Text style={styles.stepTitle}>Review & confirm</Text>
            <SummaryRow icon="location" label="From" value={`${pickupLine1}, ${pickupCity}`} />
            <SummaryRow icon="flag" label="To" value={`${dropLine1}, ${dropCity}`} />
            <SummaryRow icon="cube" label="Package" value={`${weight} kg · ${deliveryType}`} />
            {quote ? (
              <View style={styles.quoteBox}>
                <Text style={styles.quoteLabel}>Estimated price</Text>
                <Text style={styles.quoteValue}>{quote}</Text>
              </View>
            ) : (
              <GradientButton label="Get live quote" onPress={onQuote} variant="outline" style={{ marginTop: 12 }} />
            )}
          </GlassCard>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          {step < 4 ? (
            <GradientButton label="Continue" onPress={next} disabled={!canNext} />
          ) : (
            <GradientButton label={busy ? 'Booking…' : 'Confirm & send'} onPress={onSubmit} disabled={busy || !pickupLine1 || !dropLine1} loading={busy} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboard?: 'phone-pad' | 'decimal-pad';
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        keyboardType={keyboard}
      />
    </View>
  );
}

function SummaryRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12 },
  backBtn: { width: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  stepTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 16 },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34,197,94,0.1)',
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  locationBtnText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  fieldLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    color: colors.text,
    fontSize: 16,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.12)' },
  typeChipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  typeChipTextActive: { color: colors.primary },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  summaryLabel: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
  summaryValue: { color: colors.text, fontSize: 14, marginTop: 2 },
  quoteBox: { marginTop: 16, padding: 16, backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderGlow },
  quoteLabel: { color: colors.textMuted, fontSize: 12 },
  quoteValue: { color: colors.primary, fontSize: 22, fontWeight: '800', marginTop: 4 },
  error: { color: colors.error, marginTop: 12, textAlign: 'center' },
  actions: { marginTop: 24, marginBottom: 24 },
});
