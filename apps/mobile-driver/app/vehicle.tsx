import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDriverVehicle,
  saveDriverVehicle,
  uploadDriverVehiclePhoto,
  listVehicleLogs,
  createVehicleLog,
  type VehicleLogEntry,
} from '@guzo/mobile-shared';
import { GlassCard, GradientButton, colors, designStyles, radius, spacing } from '@guzo/mobile-ui';

const VEHICLE_TYPES = [
  { id: 'MOTORCYCLE' as const, label: 'Motorcycle' },
  { id: 'ELECTRIC_BIKE' as const, label: 'Electric bike' },
  { id: 'BICYCLE' as const, label: 'Bicycle' },
  { id: 'SCOOTER' as const, label: 'Scooter' },
  { id: 'CAR' as const, label: 'Car' },
  { id: 'VAN' as const, label: 'Van' },
];

const LOG_TYPES = [
  { id: 'FUEL' as const, label: 'Fuel', icon: 'water-outline' as const },
  { id: 'MAINTENANCE' as const, label: 'Maintenance', icon: 'construct-outline' as const },
  { id: 'MILEAGE' as const, label: 'Mileage', icon: 'speedometer-outline' as const },
  { id: 'INSPECTION' as const, label: 'Inspection', icon: 'clipboard-outline' as const },
];

export default function VehicleScreen() {
  const qc = useQueryClient();
  const vehicleQ = useQuery({ queryKey: ['driver-vehicle'], queryFn: getDriverVehicle });
  const logs = useQuery({ queryKey: ['vehicle-logs'], queryFn: listVehicleLogs });

  const [vehicleType, setVehicleType] = useState<typeof VEHICLE_TYPES[number]['id']>('MOTORCYCLE');
  const [plateNumber, setPlateNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [type, setType] = useState<typeof LOG_TYPES[number]['id']>('FUEL');
  const [odometer, setOdometer] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const v = vehicleQ.data;

  const saveMut = useMutation({
    mutationFn: () => saveDriverVehicle({ type: vehicleType, plateNumber, brand, model, color }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-vehicle'] });
      Alert.alert('Saved', 'Vehicle details updated');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const photoMut = useMutation({
    mutationFn: (asset: { uri: string; fileName?: string | null; mimeType?: string | null }) =>
      uploadDriverVehiclePhoto({
        uri: asset.uri,
        name: asset.fileName ?? 'vehicle.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-vehicle'] });
      Alert.alert('Uploaded', 'Vehicle photo saved');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const logMut = useMutation({
    mutationFn: () =>
      createVehicleLog({
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

  async function pickPhoto() {
    const ImagePicker = await import('expo-image-picker');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload your vehicle picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      photoMut.mutate(result.assets[0]);
    }
  }

  return (
    <ScrollView style={designStyles.screen} contentContainerStyle={[designStyles.screenPad, { paddingBottom: 40 }]}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </Pressable>
      <Text style={styles.title}>My vehicle</Text>
      <Text style={styles.sub}>Customers see your vehicle type and plate when tracking deliveries.</Text>

      <GlassCard glow>
        <Pressable onPress={pickPhoto} style={styles.photoWrap}>
          {v?.photoUrl ? (
            <Image source={{ uri: v.photoUrl }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
              <Text style={styles.photoHint}>Add vehicle photo</Text>
            </View>
          )}
        </Pressable>

        <Text style={styles.section}>Vehicle type</Text>
        <View style={styles.typeRow}>
          {VEHICLE_TYPES.map((t) => (
            <Pressable
              key={t.id}
              style={[styles.typeBtn, vehicleType === t.id && styles.typeBtnActive]}
              onPress={() => setVehicleType(t.id)}
            >
              <Text style={[styles.typeLabel, vehicleType === t.id && styles.typeLabelActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Plate number"
          placeholderTextColor={colors.textDim}
          value={plateNumber || v?.plateNumber || ''}
          onChangeText={setPlateNumber}
          autoCapitalize="characters"
        />
        <TextInput style={styles.input} placeholder="Brand (optional)" placeholderTextColor={colors.textDim} value={brand || v?.brand || ''} onChangeText={setBrand} />
        <TextInput style={styles.input} placeholder="Model (optional)" placeholderTextColor={colors.textDim} value={model || v?.model || ''} onChangeText={setModel} />
        <TextInput style={styles.input} placeholder="Color (optional)" placeholderTextColor={colors.textDim} value={color || v?.color || ''} onChangeText={setColor} />
        <GradientButton
          label={saveMut.isPending ? 'Saving…' : 'Save vehicle'}
          onPress={() => saveMut.mutate()}
          disabled={saveMut.isPending || !(plateNumber || v?.plateNumber)}
          loading={saveMut.isPending}
        />
      </GlassCard>

      <GlassCard style={{ marginTop: 16 }}>
        <Text style={styles.section}>Log entry</Text>
        <View style={styles.typeRow}>
          {LOG_TYPES.map((t) => (
            <Pressable key={t.id} style={[styles.typeBtn, type === t.id && styles.typeBtnActive]} onPress={() => setType(t.id)}>
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
        <GradientButton label={logMut.isPending ? 'Saving…' : 'Save log'} onPress={() => logMut.mutate()} disabled={!v || logMut.isPending} loading={logMut.isPending} />
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
  back: { marginBottom: spacing.sm, alignSelf: 'flex-start' },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 4 },
  sub: { color: colors.textMuted, marginBottom: spacing.md, lineHeight: 20 },
  section: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12, marginTop: 8 },
  photoWrap: { marginBottom: 12 },
  photo: { width: '100%', height: 160, borderRadius: radius.md },
  photoPlaceholder: { height: 160, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  photoHint: { color: colors.textMuted, marginTop: 8 },
  meta: { color: colors.textMuted, marginTop: 4 },
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
