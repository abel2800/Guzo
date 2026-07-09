import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDriverVehicle,
  listVehicleLogs,
  createVehicleLog,
  type VehicleLogEntry,
} from '@guzo/mobile-shared';
import { GlassCard, GradientButton, colors, designStyles, radius, spacing } from '@guzo/mobile-ui';

const LOG_TYPES = [
  { id: 'FUEL' as const, label: 'Fuel', icon: 'water-outline' as const },
  { id: 'MAINTENANCE' as const, label: 'Maintenance', icon: 'construct-outline' as const },
  { id: 'MILEAGE' as const, label: 'Mileage', icon: 'speedometer-outline' as const },
  { id: 'INSPECTION' as const, label: 'Inspection', icon: 'clipboard-outline' as const },
];

export default function VehicleScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [type, setType] = useState<typeof LOG_TYPES[number]['id']>('FUEL');
  const [odometer, setOdometer] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const vehicle = useQuery({ queryKey: ['driver-vehicle'], queryFn: getDriverVehicle });
  const logs = useQuery({ queryKey: ['vehicle-logs'], queryFn: listVehicleLogs });

  const logMut = useMutation({
    mutationFn: () => createVehicleLog({
      type,
      odometerKm: odometer ? Number(odometer) : undefined,
      amount: amount ? Number(amount) : undefined,
      note: note || undefined,
      metadata: type === 'INSPECTION' ? { passed: true } : undefined,
    }),
    onSuccess: () => {
      setOdometer('');
      setAmount('');
      setNote('');
      qc.invalidateQueries({ queryKey: ['vehicle-logs'] });
      Alert.alert('Logged', 'Vehicle entry saved');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const v = vehicle.data;

  return (
    <ScrollView style={[designStyles.screen, { paddingTop: insets.top }]} contentContainerStyle={[designStyles.screenPad, { paddingBottom: 40 }]}>
      <Text style={styles.title}>My vehicle</Text>

      <GlassCard glow>
        {v ? (
          <>
            <Text style={styles.plate}>{v.plateNumber}</Text>
            <Text style={styles.meta}>{v.brand} {v.model} · {v.type} · {v.status}</Text>
          </>
        ) : (
          <Text style={styles.meta}>No vehicle assigned — contact dispatch</Text>
        )}
      </GlassCard>

      <GlassCard style={{ marginTop: 16 }}>
        <Text style={styles.section}>Log entry</Text>
        <View style={styles.typeRow}>
          {LOG_TYPES.map((t) => (
            <Pressable
              key={t.id}
              style={[styles.typeBtn, type === t.id && styles.typeBtnActive]}
              onPress={() => setType(t.id)}
            >
              <Ionicons name={t.icon} size={18} color={type === t.id ? colors.primary : colors.textMuted} />
              <Text style={[styles.typeLabel, type === t.id && styles.typeLabelActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput style={styles.input} placeholder="Odometer (km)" placeholderTextColor={colors.textDim} value={odometer} onChangeText={setOdometer} keyboardType="decimal-pad" />
        {(type === 'FUEL' || type === 'MAINTENANCE') && (
          <TextInput style={styles.input} placeholder="Amount (ETB)" placeholderTextColor={colors.textDim} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        )}
        <TextInput style={[styles.input, { minHeight: 60 }]} placeholder="Notes" placeholderTextColor={colors.textDim} value={note} onChangeText={setNote} multiline />
        <GradientButton
          label={logMut.isPending ? 'Saving…' : 'Save log'}
          onPress={() => logMut.mutate()}
          disabled={!v || logMut.isPending}
          loading={logMut.isPending}
        />
      </GlassCard>

      <GlassCard style={{ marginTop: 16 }}>
        <Text style={styles.section}>Recent logs</Text>
        {(logs.data ?? []).map((l: VehicleLogEntry) => (
          <View key={l.id} style={styles.logRow}>
            <View>
              <Text style={styles.logType}>{l.type}</Text>
              <Text style={styles.logMeta}>
                {l.odometerKm != null ? `${l.odometerKm} km` : ''}
                {l.amount != null ? ` · ETB ${l.amount}` : ''}
              </Text>
              {l.note ? <Text style={styles.logNote}>{l.note}</Text> : null}
            </View>
            <Text style={styles.logDate}>{new Date(l.loggedAt).toLocaleDateString()}</Text>
          </View>
        ))}
        {(logs.data?.length ?? 0) === 0 && <Text style={styles.meta}>No logs yet</Text>}
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  plate: { color: colors.text, fontSize: 22, fontWeight: '800', fontFamily: 'monospace' },
  meta: { color: colors.textMuted, marginTop: 4 },
  section: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  typeBtnActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.1)' },
  typeLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  typeLabelActive: { color: colors.primary },
  input: { backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, color: colors.text, marginBottom: 10 },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  logType: { color: colors.text, fontWeight: '700' },
  logMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  logNote: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  logDate: { color: colors.textDim, fontSize: 11 },
});
