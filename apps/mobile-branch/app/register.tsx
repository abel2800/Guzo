import { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { registerParcelAtBranch, type ParcelLabel } from '@guzo/mobile-shared';
import { GradientButton, GlassCard, colors, designStyles, radius, spacing } from '@guzo/mobile-ui';
import { useBranch } from '@/lib/branch';
import { printParcelLabel, printParcelLabelThermal, shareParcelLabelPdf } from '@/lib/labels';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { branchId } = useBranch();
  const [senderPhone, setSenderPhone] = useState('');
  const [senderName, setSenderName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [dropoffCity, setDropoffCity] = useState('');
  const [dropoffLine1, setDropoffLine1] = useState('');
  const [weight, setWeight] = useState('1');
  const [description, setDescription] = useState('');
  const [fragile, setFragile] = useState(false);
  const [message, setMessage] = useState('');
  const [label, setLabel] = useState<ParcelLabel | null>(null);

  const register = useMutation({
    mutationFn: () =>
      registerParcelAtBranch(branchId!, {
        senderPhone: senderPhone.trim(),
        senderName: senderName.trim(),
        receiverPhone: receiverPhone.trim(),
        receiverName: receiverName.trim(),
        dropoffCity: dropoffCity.trim(),
        dropoffLine1: dropoffLine1.trim() || undefined,
        weightKg: Number(weight) || 1,
        description: description.trim() || undefined,
        fragile,
        paymentMethod: 'CASH_ON_DELIVERY',
      }),
    onSuccess: (res) => {
      setMessage(`Registered ${res.package?.trackingNumber}`);
      setLabel(res.label ?? null);
    },
    onError: (e: Error) => setMessage(e.message),
  });

  return (
    <ScrollView style={[designStyles.screen, { paddingTop: insets.top }]} contentContainerStyle={[designStyles.screenPad, { paddingBottom: 48 }]}>
      <Text style={styles.title}>Register parcel</Text>
      <Text style={styles.sub}>Walk-in drop-off — sender must have a GUZO customer account.</Text>
      <GlassCard>
        <Field label="Sender phone" value={senderPhone} onChange={setSenderPhone} keyboard="phone-pad" />
        <Field label="Sender name" value={senderName} onChange={setSenderName} />
        <Field label="Receiver phone" value={receiverPhone} onChange={setReceiverPhone} keyboard="phone-pad" />
        <Field label="Receiver name" value={receiverName} onChange={setReceiverName} />
        <Field label="Destination city" value={dropoffCity} onChange={setDropoffCity} />
        <Field label="Destination address" value={dropoffLine1} onChange={setDropoffLine1} />
        <Field label="Weight (kg)" value={weight} onChange={setWeight} keyboard="decimal-pad" />
        <Field label="Contents" value={description} onChange={setDescription} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Fragile</Text>
          <Switch value={fragile} onValueChange={setFragile} trackColor={{ true: colors.primary }} />
        </View>
        <GradientButton label={register.isPending ? 'Registering…' : 'Register & print label'} onPress={() => register.mutate()} disabled={!branchId || register.isPending || !senderPhone || !receiverPhone || !dropoffCity} />
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
  sub: { color: colors.textMuted, marginBottom: 16 },
  fieldLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  rowLabel: { color: colors.text, fontWeight: '600' },
  msg: { color: colors.primary, marginTop: 12, textAlign: 'center' },
  labelActions: { gap: 8, marginTop: 16 },
});
