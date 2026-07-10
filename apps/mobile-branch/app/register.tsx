import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Switch, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  registerParcelAtBranch,
  quoteBranchRegister,
  listBranches,
  type ParcelLabel,
} from '@guzo/mobile-shared';
import { GradientButton, GlassCard, colors, designStyles, radius, spacing } from '@guzo/mobile-ui';
import { useBranch } from '@/lib/branch';
import { printParcelLabel, printParcelLabelThermal, shareParcelLabelPdf } from '@/lib/labels';

type DestMode = 'branch' | 'home';
type PaymentChoice = 'PAY_LATER' | 'CASH_ON_DELIVERY' | 'FAKE' | 'TELEBIRR' | 'CBE' | 'CHAPA';

const PAYMENT_OPTIONS: Array<{ value: PaymentChoice; label: string }> = [
  { value: 'PAY_LATER', label: 'Pay later' },
  { value: 'CASH_ON_DELIVERY', label: 'Cash on delivery' },
  { value: 'FAKE', label: 'Pay now (demo)' },
  { value: 'TELEBIRR', label: 'Telebirr' },
  { value: 'CBE', label: 'CBE' },
  { value: 'CHAPA', label: 'Chapa' },
];

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { branchId } = useBranch();
  const [senderPhone, setSenderPhone] = useState('');
  const [senderName, setSenderName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [destMode, setDestMode] = useState<DestMode>('branch');
  const [destinationBranchId, setDestinationBranchId] = useState('');
  const [dropoffCity, setDropoffCity] = useState('');
  const [dropoffLine1, setDropoffLine1] = useState('');
  const [weight, setWeight] = useState('1');
  const [description, setDescription] = useState('');
  const [fragile, setFragile] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentChoice>('PAY_LATER');
  const [message, setMessage] = useState('');
  const [label, setLabel] = useState<ParcelLabel | null>(null);

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-directory'],
    queryFn: () => listBranches(),
  });

  const cities = [...new Set(branches.map((b) => b.city))].sort();
  const branchesInCity = branches.filter((b) => !dropoffCity || b.city === dropoffCity);

  const quoteInput = {
    senderPhone: senderPhone.trim(),
    senderName: senderName.trim(),
    receiverPhone: receiverPhone.trim(),
    receiverName: receiverName.trim(),
    weightKg: Number(weight) || 1,
    ...(destMode === 'branch'
      ? { destinationBranchId: destinationBranchId || undefined }
      : { dropoffCity: dropoffCity.trim(), dropoffLine1: dropoffLine1.trim() || undefined }),
  };

  const canQuote = Boolean(
    branchId &&
    senderPhone.trim() &&
    receiverPhone.trim() &&
    (destMode === 'branch' ? destinationBranchId : dropoffCity.trim()),
  );

  const { data: quote, refetch: refetchQuote } = useQuery({
    queryKey: ['branch-register-quote', branchId, quoteInput],
    queryFn: () => quoteBranchRegister(branchId!, quoteInput),
    enabled: canQuote,
  });

  useEffect(() => {
    if (canQuote) void refetchQuote();
  }, [weight, destMode, destinationBranchId, dropoffCity, dropoffLine1, senderPhone, receiverPhone]);

  const register = useMutation({
    mutationFn: () =>
      registerParcelAtBranch(branchId!, {
        ...quoteInput,
        description: description.trim() || undefined,
        fragile,
        paymentMethod,
        payLater: paymentMethod === 'PAY_LATER',
      }),
    onSuccess: (res) => {
      setMessage(`Registered ${res.package?.trackingNumber}`);
      setLabel(res.label ?? null);
    },
    onError: (e: Error) => setMessage(e.message),
  });

  return (
    <ScrollView style={designStyles.screen} contentContainerStyle={[designStyles.screenPad, { paddingBottom: 48 }]}>
      <Text style={styles.title}>Register parcel</Text>
      <Text style={styles.sub}>
        Walk-in registration by branch staff. Sender does not need a GUZO account — we link by phone if they register later.
      </Text>
      <GlassCard>
        <Field label="Sender phone" value={senderPhone} onChange={setSenderPhone} keyboard="phone-pad" />
        <Field label="Sender name" value={senderName} onChange={setSenderName} />
        <Field label="Receiver phone" value={receiverPhone} onChange={setReceiverPhone} keyboard="phone-pad" />
        <Field label="Receiver name" value={receiverName} onChange={setReceiverName} />

        <Text style={styles.fieldLabel}>Destination</Text>
        <View style={styles.modeRow}>
          {(['branch', 'home'] as DestMode[]).map((m) => (
            <Pressable key={m} onPress={() => setDestMode(m)} style={[styles.modeChip, destMode === m && styles.modeChipActive]}>
              <Text style={[styles.modeText, destMode === m && styles.modeTextActive]}>
                {m === 'branch' ? 'GUZO branch' : 'Home address'}
              </Text>
            </Pressable>
          ))}
        </View>

        {destMode === 'branch' ? (
          <>
            <Text style={styles.fieldLabel}>City</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {cities.map((city) => (
                <Pressable
                  key={city}
                  onPress={() => {
                    setDropoffCity(city);
                    setDestinationBranchId('');
                  }}
                  style={[styles.cityChip, dropoffCity === city && styles.cityChipActive]}
                >
                  <Text style={[styles.cityText, dropoffCity === city && styles.cityTextActive]}>{city}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.fieldLabel}>Pickup branch</Text>
            {branchesInCity.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => setDestinationBranchId(b.id)}
                style={[styles.branchRow, destinationBranchId === b.id && styles.branchRowActive]}
              >
                <Text style={styles.branchName}>{b.name}</Text>
                <Text style={styles.branchMeta}>{b.city} · {b.code}</Text>
              </Pressable>
            ))}
          </>
        ) : (
          <>
            <Field label="Destination city" value={dropoffCity} onChange={setDropoffCity} />
            <Field label="Destination address" value={dropoffLine1} onChange={setDropoffLine1} />
          </>
        )}

        <Field label="Weight (kg)" value={weight} onChange={setWeight} keyboard="decimal-pad" />
        <Field label="Contents" value={description} onChange={setDescription} />

        {quote ? (
          <View style={styles.quoteBox}>
            <Text style={styles.quoteLabel}>Estimated price</Text>
            <Text style={styles.quoteValue}>
              {quote.currency} {quote.totalAmount.toLocaleString()}
            </Text>
            <Text style={styles.quoteMeta}>
              {quote.distanceKm.toFixed(1)} km · weight {quote.weightFee} + base {quote.baseFee}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Payment</Text>
        <View style={styles.payRow}>
          {PAYMENT_OPTIONS.map((p) => (
            <Pressable
              key={p.value}
              onPress={() => setPaymentMethod(p.value)}
              style={[styles.payChip, paymentMethod === p.value && styles.payChipActive]}
            >
              <Text style={[styles.payText, paymentMethod === p.value && styles.payTextActive]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Fragile</Text>
          <Switch value={fragile} onValueChange={setFragile} trackColor={{ true: colors.primary }} />
        </View>

        <GradientButton
          label={register.isPending ? 'Registering…' : 'Register & print label'}
          onPress={() => register.mutate()}
          disabled={!canQuote || register.isPending}
        />
        {message ? <Text style={styles.msg}>{message}</Text> : null}
        {label ? (
          <View style={styles.labelActions}>
            <GradientButton label="Thermal print" onPress={() => printParcelLabelThermal(label)} />
            <GradientButton label="Print label" onPress={() => printParcelLabel(label)} />
            <GradientButton label="Share PDF" onPress={() => shareParcelLabelPdf(label)} />
          </View>
        ) : null}
      </GlassCard>
    </ScrollView>
  );
}

function Field({ label, value, onChange, keyboard }: { label: string; value: string; onChange: (v: string) => void; keyboard?: 'phone-pad' | 'decimal-pad' }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} keyboardType={keyboard} placeholderTextColor={colors.textDim} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '900', marginBottom: 6 },
  sub: { color: colors.textMuted, marginBottom: 16, lineHeight: 20 },
  fieldLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, color: colors.text },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeChip: { flex: 1, padding: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  modeChipActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.1)' },
  modeText: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
  modeTextActive: { color: colors.primary },
  cityChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  cityChipActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.1)' },
  cityText: { color: colors.textMuted, fontSize: 12 },
  cityTextActive: { color: colors.primary, fontWeight: '700' },
  branchRow: { padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  branchRowActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.08)' },
  branchName: { color: colors.text, fontWeight: '700' },
  branchMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  quoteBox: { marginVertical: 12, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderGlow, backgroundColor: 'rgba(34,197,94,0.08)' },
  quoteLabel: { color: colors.textMuted, fontSize: 12 },
  quoteValue: { color: colors.primary, fontSize: 24, fontWeight: '900', marginTop: 4 },
  quoteMeta: { color: colors.textDim, fontSize: 11, marginTop: 4 },
  payRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  payChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  payChipActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.1)' },
  payText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  payTextActive: { color: colors.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  rowLabel: { color: colors.text, fontWeight: '600' },
  msg: { color: colors.primary, marginTop: 12, textAlign: 'center' },
  labelActions: { gap: 8, marginTop: 16 },
});
