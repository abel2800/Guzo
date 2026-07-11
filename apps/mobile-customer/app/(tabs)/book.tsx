import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Platform, StyleSheet, Linking, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createOrder, quoteOrder, geocodeAddress, lookupReceiver, listBranches, useTrackingMapData, type DeliveryType, type PaymentMethod, type PickupMethod } from '@guzo/mobile-shared';
import { StepIndicator, GradientButton, GlassCard, LiveTrackingMap } from '@guzo/mobile-ui';
import { useQuery } from '@tanstack/react-query';
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
  const [pickupLat, setPickupLat] = useState<number | undefined>();
  const [pickupLng, setPickupLng] = useState<number | undefined>();
  const [pickupPhone, setPickupPhone] = useState('');
  const [pickupName, setPickupName] = useState('');
  const [dropLine1, setDropLine1] = useState('');
  const [dropCity, setDropCity] = useState('Addis Ababa');
  const [dropLat, setDropLat] = useState<number | undefined>();
  const [dropLng, setDropLng] = useState<number | undefined>();
  const [dropPhone, setDropPhone] = useState('');
  const [dropGuzoId, setDropGuzoId] = useState('');
  const [receiverHint, setReceiverHint] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY');
  const paymentMethods: PaymentMethod[] = __DEV__
    ? ['FAKE', 'CASH_ON_DELIVERY', 'TELEBIRR', 'CBE', 'CHAPA']
    : ['CASH_ON_DELIVERY', 'TELEBIRR', 'CBE', 'CHAPA'];
  const [pickupMethod, setPickupMethod] = useState<PickupMethod>('COMPANY_PICKUP');
  const [originBranchId, setOriginBranchId] = useState('');
  const [destinationBranchId, setDestinationBranchId] = useState('');
  const [isFragile, setIsFragile] = useState(false);
  const [declaredValue, setDeclaredValue] = useState('');
  const [weight, setWeight] = useState('1');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledAt, setScheduledAt] = useState(new Date(Date.now() + 3600000));
  const [showPicker, setShowPicker] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const geocodeTimers = useRef<{ pickup?: ReturnType<typeof setTimeout>; dropoff?: ReturnType<typeof setTimeout> }>({});

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-directory'],
    queryFn: () => listBranches(),
  });

  const input = {
    deliveryType: deliveryType === 'SCHEDULED' ? 'SCHEDULED' as const : deliveryType,
    pickup: {
      line1: pickupLine1,
      city: pickupCity,
      contactName: pickupName,
      contactPhone: pickupPhone,
      latitude: pickupLat,
      longitude: pickupLng,
    },
    dropoff: {
      line1: dropLine1,
      city: dropCity,
      contactName: dropName,
      contactPhone: dropPhone,
      latitude: dropLat,
      longitude: dropLng,
    },
    package: { weightKg: parseFloat(weight) || 1, description, isFragile },
    paymentMethod,
    pickupMethod,
    receiverPhone: dropPhone || undefined,
    receiverGuzoId: dropGuzoId || undefined,
    originBranchId: pickupMethod === 'DROP_AT_BRANCH' ? originBranchId || undefined : undefined,
    destinationBranchId: pickupMethod === 'BRANCH_PICKUP' ? destinationBranchId || undefined : undefined,
    hasInsurance: !!declaredValue,
    insuranceAmount: declaredValue ? parseFloat(declaredValue) : undefined,
    notes,
    ...(deliveryType === 'SCHEDULED' ? { scheduledPickupAt: scheduledAt.toISOString() } : {}),
  };

  useEffect(() => {
    clearTimeout(geocodeTimers.current.pickup);
    if (!pickupLine1.trim() || !pickupCity.trim() || (pickupLat && pickupLng)) return;
    geocodeTimers.current.pickup = setTimeout(async () => {
      const hit = await geocodeAddress(pickupLine1, pickupCity);
      if (hit) {
        setPickupLat(hit.lat);
        setPickupLng(hit.lng);
      }
    }, 700);
    return () => clearTimeout(geocodeTimers.current.pickup);
  }, [pickupLine1, pickupCity, pickupLat, pickupLng]);

  useEffect(() => {
    clearTimeout(geocodeTimers.current.dropoff);
    if (!dropLine1.trim() || !dropCity.trim() || (dropLat && dropLng)) return;
    geocodeTimers.current.dropoff = setTimeout(async () => {
      const hit = await geocodeAddress(dropLine1, dropCity);
      if (hit) {
        setDropLat(hit.lat);
        setDropLng(hit.lng);
      }
    }, 700);
    return () => clearTimeout(geocodeTimers.current.dropoff);
  }, [dropLine1, dropCity, dropLat, dropLng]);

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
      setPickupLat(loc.coords.latitude);
      setPickupLng(loc.coords.longitude);
    } else {
      setDropLine1(line);
      setDropCity(city);
      setDropLat(loc.coords.latitude);
      setDropLng(loc.coords.longitude);
    }
  }

  async function onReceiverLookup() {
    if (!dropPhone && !dropGuzoId) return;
    try {
      const hit = await lookupReceiver({ phone: dropPhone || undefined, guzoId: dropGuzoId || undefined });
      if (hit.found) {
        setReceiverHint(`${hit.firstName ?? ''} ${hit.lastName ?? ''}`.trim() || 'Receiver found');
        if (hit.guzoId && !dropGuzoId) setDropGuzoId(hit.guzoId);
      } else {
        setReceiverHint('New receiver — parcel will be linked when they register');
      }
    } catch {
      setReceiverHint('');
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
      const checkoutUrl = order.payment?.checkoutUrl;
      if (checkoutUrl) {
        const canOpen = await Linking.canOpenURL(checkoutUrl);
        if (canOpen) {
          await Linking.openURL(checkoutUrl);
        } else {
          Alert.alert('Complete payment', 'Open your payment app to finish checkout, then return to track your order.');
        }
      }
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
    (step === 3 && weight && (pickupMethod !== 'DROP_AT_BRANCH' || originBranchId) && (pickupMethod !== 'BRANCH_PICKUP' || destinationBranchId)) ||
    step === 4;

  const mapData = useTrackingMapData(
    { line1: pickupLine1, city: pickupCity, latitude: pickupLat, longitude: pickupLng },
    { line1: dropLine1, city: dropCity, latitude: dropLat, longitude: dropLng },
  );

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
            <Field label="Street address" value={pickupLine1} onChange={(v) => { setPickupLine1(v); setPickupLat(undefined); setPickupLng(undefined); }} placeholder="Bole Road, near…" />
            <Field label="City" value={pickupCity} onChange={(v) => { setPickupCity(v); setPickupLat(undefined); setPickupLng(undefined); }} />
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
            <Field label="Street address" value={dropLine1} onChange={(v) => { setDropLine1(v); setDropLat(undefined); setDropLng(undefined); }} placeholder="Kazanchis, building…" />
            <Field label="City" value={dropCity} onChange={(v) => { setDropCity(v); setDropLat(undefined); setDropLng(undefined); }} />
            {(dropLat && dropLng) || dropLine1 ? (
              <View style={{ marginTop: 12 }}>
                <LiveTrackingMap
                  pickup={mapData.pickup}
                  dropoff={mapData.dropoff}
                  routeCoordinates={mapData.routeCoordinates}
                  routeMeta={mapData.routeMeta}
                  height={180}
                />
              </View>
            ) : null}
            <Field label="Recipient name" value={dropName} onChange={setDropName} />
            <Field label="Phone" value={dropPhone} onChange={setDropPhone} keyboard="phone-pad" />
            <Field label="Receiver Guzo ID" value={dropGuzoId} onChange={setDropGuzoId} placeholder="GZ-284651" />
            <Pressable style={styles.locationBtn} onPress={onReceiverLookup}>
              <Ionicons name="person-search-outline" size={18} color={colors.primary} />
              <Text style={styles.locationBtnText}>Detect receiver</Text>
            </Pressable>
            {receiverHint ? <Text style={{ color: colors.primary, marginBottom: 8, fontSize: 13 }}>{receiverHint}</Text> : null}
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
            <Field label="Declared value (ETB)" value={declaredValue} onChange={setDeclaredValue} keyboard="decimal-pad" placeholder="Optional insurance" />
            <Pressable style={styles.typeChip} onPress={() => setIsFragile(!isFragile)}>
              <Ionicons name={isFragile ? 'checkbox' : 'square-outline'} size={18} color={colors.primary} />
              <Text style={styles.typeChipText}>Fragile parcel</Text>
            </Pressable>
            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Pickup / delivery method</Text>
            <View style={styles.typeRow}>
              {(['COMPANY_PICKUP', 'DROP_AT_BRANCH', 'BRANCH_PICKUP'] as PickupMethod[]).map((m) => (
                <Pressable key={m} onPress={() => setPickupMethod(m)} style={[styles.typeChip, pickupMethod === m && styles.typeChipActive]}>
                  <Text style={[styles.typeChipText, pickupMethod === m && styles.typeChipTextActive]}>
                    {m === 'COMPANY_PICKUP' ? 'Door pickup' : m === 'DROP_AT_BRANCH' ? 'Drop at branch' : 'Collect at branch'}
                  </Text>
                </Pressable>
              ))}
            </View>
            {pickupMethod === 'DROP_AT_BRANCH' ? (
              <>
                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Drop-off branch</Text>
                <View style={styles.branchList}>
                  {branches.map((b) => (
                    <Pressable
                      key={b.id}
                      onPress={() => setOriginBranchId(b.id)}
                      style={[styles.branchRow, originBranchId === b.id && styles.branchRowActive]}
                    >
                      <Text style={styles.branchName}>{b.name}</Text>
                      <Text style={styles.branchMeta}>{b.city} · {b.code}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
            {pickupMethod === 'BRANCH_PICKUP' ? (
              <>
                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Pickup branch (receiver collects here)</Text>
                <View style={styles.branchList}>
                  {branches.map((b) => (
                    <Pressable
                      key={b.id}
                      onPress={() => setDestinationBranchId(b.id)}
                      style={[styles.branchRow, destinationBranchId === b.id && styles.branchRowActive]}
                    >
                      <Text style={styles.branchName}>{b.name}</Text>
                      <Text style={styles.branchMeta}>{b.city} · {b.code}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
            <Field label="Notes for driver" value={notes} onChange={setNotes} placeholder="Optional" />
          </GlassCard>
        )}

        {step === 4 && (
          <GlassCard glow>
            <Text style={styles.stepTitle}>Review & confirm</Text>
            <SummaryRow icon="location" label="From" value={`${pickupLine1}, ${pickupCity}`} />
            <SummaryRow icon="flag" label="To" value={`${dropLine1}, ${dropCity}`} />
            <SummaryRow icon="cube" label="Package" value={`${weight} kg · ${deliveryType}${isFragile ? ' · fragile' : ''}`} />
            <Text style={styles.fieldLabel}>Payment</Text>
            <View style={[styles.typeRow, { marginBottom: 12 }]}>
              {paymentMethods.map((m) => (
                <Pressable key={m} onPress={() => setPaymentMethod(m)} style={[styles.typeChip, paymentMethod === m && styles.typeChipActive]}>
                  <Text style={[styles.typeChipText, paymentMethod === m && styles.typeChipTextActive]}>{m.replace(/_/g, ' ')}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ marginTop: 12, marginBottom: 8 }}>
              <LiveTrackingMap
                pickup={mapData.pickup}
                dropoff={mapData.dropoff}
                routeCoordinates={mapData.routeCoordinates}
                routeMeta={mapData.routeMeta}
                height={180}
              />
            </View>
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
  branchList: { gap: 8, marginBottom: 8 },
  branchRow: { padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  branchRowActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.08)' },
  branchName: { color: colors.text, fontWeight: '700' },
  branchMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
