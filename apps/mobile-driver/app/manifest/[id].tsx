import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDriverManifest,
  scanDriverManifest,
  departDriverManifest,
  arriveDriverManifest,
  unloadDriverManifest,
} from '@guzo/mobile-shared';
import { TrackingScanner } from '@/components/tracking-scanner';
import { GlassCard, GradientButton, colors, designStyles, radius } from '@guzo/mobile-ui';

export default function ManifestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [scanCode, setScanCode] = useState('');
  const [error, setError] = useState('');

  const { data: manifest, refetch } = useQuery({
    queryKey: ['driver-manifest', id],
    queryFn: () => getDriverManifest(id!),
    enabled: !!id,
    refetchInterval: 15_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['driver-manifest', id] });
    qc.invalidateQueries({ queryKey: ['driver-manifests'] });
    refetch();
  };

  const scanMut = useMutation({
    mutationFn: () => scanDriverManifest(id!, scanCode),
    onSuccess: () => { setScanCode(''); setError(''); invalidate(); },
    onError: (e: Error) => setError(e.message),
  });

  const departMut = useMutation({
    mutationFn: () => departDriverManifest(id!),
    onSuccess: () => invalidate(),
    onError: (e: Error) => setError(e.message),
  });

  const arriveMut = useMutation({
    mutationFn: () => arriveDriverManifest(id!),
    onSuccess: () => invalidate(),
    onError: (e: Error) => setError(e.message),
  });

  const unloadMut = useMutation({
    mutationFn: () => unloadDriverManifest(id!, scanCode),
    onSuccess: () => { setScanCode(''); setError(''); invalidate(); },
    onError: (e: Error) => setError(e.message),
  });

  if (!manifest) {
    return (
      <View style={[designStyles.screen, designStyles.screenPad, { paddingTop: insets.top }]}>
        <Text style={{ color: colors.textMuted }}>Loading manifest…</Text>
      </View>
    );
  }

  const canLoad = ['DRAFT', 'SEALED'].includes(manifest.status);
  const canDepart = manifest.status === 'SEALED' && manifest.parcelCount > 0;
  const inTransit = manifest.status === 'IN_TRANSIT';
  const arrived = manifest.status === 'ARRIVED';
  const unload = manifest.unloadStatus;

  return (
    <ScrollView style={designStyles.screen} contentContainerStyle={[designStyles.screenPad, { paddingTop: insets.top, paddingBottom: 40 }]}>
      <GlassCard glow>
        <Text style={styles.eyebrow}>Intercity manifest</Text>
        <Text style={styles.title}>{manifest.manifestNumber}</Text>
        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{manifest.status}</Text>
          </View>
          <Text style={styles.meta}>{manifest.parcelCount} parcels</Text>
          {manifest.sealNumber ? <Text style={styles.meta}>Seal {manifest.sealNumber}</Text> : null}
        </View>
      </GlassCard>

      {(canLoad || inTransit || arrived) && (
        <GlassCard style={{ marginTop: 16 }}>
          <Text style={styles.section}>
            {arrived ? 'Unload scan' : canLoad ? 'Load truck — scan parcels' : 'In transit'}
          </Text>
          <TrackingScanner value={scanCode} onChange={setScanCode} />
          {canLoad && (
            <GradientButton
              label={scanMut.isPending ? 'Scanning…' : 'Add to manifest'}
              onPress={() => scanMut.mutate()}
              disabled={!scanCode || scanMut.isPending}
              loading={scanMut.isPending}
            />
          )}
          {arrived && (
            <GradientButton
              label={unloadMut.isPending ? 'Unloading…' : 'Unload parcel'}
              onPress={() => unloadMut.mutate()}
              disabled={!scanCode || unloadMut.isPending}
              loading={unloadMut.isPending}
            />
          )}
        </GlassCard>
      )}

      {canDepart && (
        <View style={{ marginTop: 12 }}>
          <GradientButton
            label={departMut.isPending ? 'Departing…' : 'Depart with truck'}
            onPress={() => departMut.mutate()}
            disabled={departMut.isPending}
            loading={departMut.isPending}
          />
        </View>
      )}

      {inTransit && (
        <View style={{ marginTop: 12 }}>
          <GradientButton
            label={arriveMut.isPending ? 'Updating…' : 'Mark arrived at warehouse'}
            onPress={() => arriveMut.mutate()}
            disabled={arriveMut.isPending}
            loading={arriveMut.isPending}
          />
        </View>
      )}

      {unload && (
        <GlassCard style={{ marginTop: 16 }}>
          <Text style={styles.section}>Unload progress</Text>
          <Text style={styles.progress}>
            {unload.unloaded} / {unload.expected} unloaded
            {unload.complete ? ' — complete' : ''}
          </Text>
        </GlassCard>
      )}

      <GlassCard style={{ marginTop: 16 }}>
        <Text style={styles.section}>Parcels</Text>
        {manifest.parcels.map((p) => (
          <View key={p.id} style={styles.parcelRow}>
            <View>
              <Text style={styles.tracking}>{p.trackingNumber}</Text>
              <Text style={styles.parcelMeta}>{p.status}</Text>
            </View>
            {p.unloadedAt ? (
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            ) : p.scannedAt ? (
              <Ionicons name="cube" size={20} color={colors.accent} />
            ) : (
              <Ionicons name="ellipse-outline" size={20} color={colors.textDim} />
            )}
          </View>
        ))}
      </GlassCard>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  badge: { backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 12 },
  section: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 },
  parcelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  tracking: { color: colors.text, fontWeight: '700', fontFamily: 'monospace' },
  parcelMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  progress: { color: colors.text, fontSize: 16, fontWeight: '600' },
  error: { color: colors.error, textAlign: 'center', marginTop: 16 },
});
