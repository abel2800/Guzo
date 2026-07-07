import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { LiveTrackingMap, OfflineBanner, GlassCard, GradientButton, colors, designStyles, radius, spacing } from '@guzo/mobile-ui';
import {
  acceptOrder,
  getOrder,
  updateOrderStatus,
  submitPod,
  postDriverLocation,
  postLocationWithQueue,
  DRIVER_NEXT_STATUS,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from '@guzo/mobile-shared';

export default function DeliveryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [myLocation, setMyLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [queuedPings, setQueuedPings] = useState(0);

  const { data: order, refetch } = useQuery({
    queryKey: ['delivery', id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (!order || order.status === 'DELIVERED') return;
    let timer: ReturnType<typeof setInterval>;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const ping = async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          setMyLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          const result = await postLocationWithQueue(
            {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              orderId: order.id,
              speed: loc.coords.speed ?? undefined,
              heading: loc.coords.heading ?? undefined,
            },
            postDriverLocation,
          );
          if (result === 'queued') setQueuedPings((n) => n + 1);
        } catch {
          /* ignore */
        }
      };
      await ping();
      timer = setInterval(ping, 15_000);
    })();
    return () => clearInterval(timer);
  }, [order?.id, order?.status]);

  const acceptMut = useMutation({
    mutationFn: () => acceptOrder(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['delivery', id] }); refetch(); },
    onError: (e: Error) => setError(e.message),
  });

  const statusMut = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(id!, status),
    onSuccess: () => refetch(),
    onError: (e: Error) => setError(e.message),
  });

  const podMut = useMutation({
    mutationFn: async () => {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) throw new Error('Camera permission required');
      const photo = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (photo.canceled) throw new Error('Photo required');
      const asset = photo.assets[0];
      const loc = await Location.getCurrentPositionAsync({});
      return submitPod(id!, {
        photo: { uri: asset.uri, name: 'pod.jpg', type: 'image/jpeg' },
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    },
    onSuccess: () => refetch(),
    onError: (e: Error) => setError(e.message),
  });

  if (!order) {
    return (
      <View style={[designStyles.screen, designStyles.screenPad, { paddingTop: insets.top }]}>
        <Text style={{ color: colors.textMuted }}>Loading…</Text>
      </View>
    );
  }

  const next = DRIVER_NEXT_STATUS[order.status];
  const isAvailable = order.status === 'CONFIRMED';

  function openMaps(address: { line1: string; city: string; latitude?: number | null; longitude?: number | null }) {
    const q = address.latitude && address.longitude
      ? `${address.latitude},${address.longitude}`
      : encodeURIComponent(`${address.line1}, ${address.city}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${q}`,
      android: `geo:0,0?q=${q}`,
      default: `https://maps.google.com/?q=${q}`,
    });
    if (url) Linking.openURL(url);
  }

  return (
    <ScrollView style={designStyles.screen} contentContainerStyle={[designStyles.screenPad, { paddingTop: insets.top, paddingBottom: 40 }]}>
      <OfflineBanner />
      {queuedPings > 0 && (
        <View style={styles.queueBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
          <Text style={styles.queueText}>
            {queuedPings} GPS ping{queuedPings > 1 ? 's' : ''} queued — will sync when online
          </Text>
        </View>
      )}

      <View style={styles.statusRow}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{ORDER_STATUS_LABELS[order.status]}</Text>
        </View>
        <Text style={styles.ref}>{order.orderNumber}</Text>
      </View>

      {order.status !== 'DELIVERED' && (
        <GlassCard glow style={{ marginBottom: 16 }}>
          <Text style={styles.sectionLabel}>Route map</Text>
          <LiveTrackingMap
            pickup={order.pickupAddress}
            dropoff={order.dropoffAddress}
            driverLocation={myLocation}
            height={220}
          />
        </GlassCard>
      )}

      <GlassCard style={styles.addressCard}>
        <View style={styles.addressHeader}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <Text style={styles.sectionLabel}>Pickup</Text>
        </View>
        <Text style={styles.addressText}>{order.pickupAddress.line1}, {order.pickupAddress.city}</Text>
        {order.pickupAddress.contactPhone && <Text style={styles.phone}>{order.pickupAddress.contactPhone}</Text>}
        <Pressable style={styles.navBtn} onPress={() => openMaps(order.pickupAddress)}>
          <Ionicons name="navigate" size={16} color={colors.accent} />
          <Text style={styles.navText}>Navigate to pickup</Text>
        </Pressable>
      </GlassCard>

      <GlassCard style={styles.addressCard}>
        <View style={styles.addressHeader}>
          <Ionicons name="flag" size={18} color={colors.accent} />
          <Text style={styles.sectionLabel}>Drop-off</Text>
        </View>
        <Text style={styles.addressText}>{order.dropoffAddress.line1}, {order.dropoffAddress.city}</Text>
        {order.dropoffAddress.contactPhone && <Text style={styles.phone}>{order.dropoffAddress.contactPhone}</Text>}
        <Pressable style={styles.navBtn} onPress={() => openMaps(order.dropoffAddress)}>
          <Ionicons name="navigate" size={16} color={colors.accent} />
          <Text style={styles.navText}>Navigate to drop-off</Text>
        </Pressable>
      </GlassCard>

      {order.scheduledPickupAt && (
        <GlassCard>
          <Text style={styles.sectionLabel}>Scheduled pickup</Text>
          <Text style={styles.addressText}>{new Date(order.scheduledPickupAt).toLocaleString()}</Text>
        </GlassCard>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        {isAvailable && (
          <GradientButton
            label={acceptMut.isPending ? 'Accepting…' : 'Accept job'}
            onPress={() => acceptMut.mutate()}
            disabled={acceptMut.isPending}
            loading={acceptMut.isPending}
          />
        )}
        {next && (
          <GradientButton
            label={statusMut.isPending ? 'Updating…' : next.label}
            onPress={() => statusMut.mutate(next.next)}
            disabled={statusMut.isPending}
            loading={statusMut.isPending}
          />
        )}
        {order.status === 'OUT_FOR_DELIVERY' && (
          <Pressable style={styles.podBtn} onPress={() => podMut.mutate()} disabled={podMut.isPending}>
            <Ionicons name="camera" size={20} color={colors.primary} />
            <Text style={styles.podText}>{podMut.isPending ? 'Uploading…' : 'Capture proof of delivery'}</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  queueBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, padding: 10, backgroundColor: 'rgba(251,191,36,0.1)', borderRadius: radius.md },
  queueText: { color: colors.warning, fontSize: 12, flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  statusBadge: { backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderGlow },
  statusBadgeText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  ref: { color: colors.text, fontSize: 20, fontWeight: '800' },
  sectionLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  addressCard: { marginBottom: 12 },
  addressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  addressText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  phone: { color: colors.textMuted, marginTop: 4 },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  navText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  error: { color: colors.error, textAlign: 'center', marginVertical: 12 },
  actions: { gap: 12, marginTop: 8 },
  podBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  podText: { color: colors.primary, fontWeight: '600' },
});
