import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DriverLocationPayload } from '@delivery/types';
import { LiveTrackingMap } from '@guzo/mobile-ui';
import { cancelOrder, getOrder, ORDER_STATUS_LABELS, fetchWithCache, cacheOrder } from '@guzo/mobile-shared';
import { OfflineBanner } from '@guzo/mobile-ui';
import { subscribeToOrder } from '@/lib/realtime';
import { GlassCard, GradientButton } from '@guzo/mobile-ui';
import { colors, designStyles, spacing } from '@/lib/design';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [driverLoc, setDriverLoc] = useState<DriverLocationPayload | null>(null);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, fromCache } = await fetchWithCache(`order:${id}`, () => getOrder(id!));
      if (!fromCache) await cacheOrder(data);
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (!id) return;
    return subscribeToOrder(id, {
      onStatus: (p) => {
        setLiveStatus(p.status);
        qc.invalidateQueries({ queryKey: ['order', id] });
      },
      onTracking: (p) => setDriverLoc(p),
    });
  }, [id, qc]);

  const cancelMut = useMutation({
    mutationFn: () => cancelOrder(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order', id] }),
  });

  if (isLoading || !order) {
    return (
      <View style={[designStyles.screen, designStyles.screenPad, { justifyContent: 'center' }]}>
        <Text style={{ color: colors.textMuted }}>Loading…</Text>
      </View>
    );
  }

  const status = liveStatus ?? order.status;
  const canCancel = ['PENDING_PAYMENT', 'CONFIRMED'].includes(status);
  const inTransit = !['DELIVERED', 'CANCELLED', 'FAILED'].includes(status);

  const driverPoint = driverLoc
    ? { latitude: driverLoc.lat, longitude: driverLoc.lng }
    : null;

  return (
    <ScrollView
      style={designStyles.screen}
      contentContainerStyle={[designStyles.screenPad, { paddingBottom: spacing.xl }]}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <OfflineBanner />
      <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 12 }}>
        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>{ORDER_STATUS_LABELS[status] ?? status}</Text>
      </View>

      {inTransit && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>Live GPS tracking</Text>
          <LiveTrackingMap
            pickup={order.pickupAddress}
            dropoff={order.dropoffAddress}
            driverLocation={driverPoint}
            height={240}
          />
          {driverLoc && (
            <Text style={{ color: colors.textDim, fontSize: 11, marginTop: 6 }}>
              Updated {new Date(driverLoc.recordedAt).toLocaleTimeString()}
              {driverLoc.speed != null ? ` · ${Math.round(driverLoc.speed)} km/h` : ''}
            </Text>
          )}
        </View>
      )}

      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{order.orderNumber}</Text>
      <Text style={{ color: colors.textMuted, marginBottom: 16, marginTop: 4 }}>
        {order.deliveryType} · {order.currency} {Number(order.totalAmount).toLocaleString()}
      </Text>

      {order.scheduledPickupAt && (
        <GlassCard style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.textDim, fontSize: 11, fontWeight: '600' }}>Scheduled pickup</Text>
          <Text style={{ color: colors.text, marginTop: 4 }}>{new Date(order.scheduledPickupAt).toLocaleString()}</Text>
        </GlassCard>
      )}

      <GlassCard style={{ marginBottom: 12 }}>
        <Text style={{ color: colors.textDim, fontSize: 11, fontWeight: '600' }}>Pickup</Text>
        <Text style={{ color: colors.text, marginTop: 4 }}>{order.pickupAddress.line1}, {order.pickupAddress.city}</Text>
      </GlassCard>

      <GlassCard style={{ marginBottom: 12 }}>
        <Text style={{ color: colors.textDim, fontSize: 11, fontWeight: '600' }}>Drop-off</Text>
        <Text style={{ color: colors.text, marginTop: 4 }}>{order.dropoffAddress.line1}, {order.dropoffAddress.city}</Text>
      </GlassCard>

      {order.delivery?.driver?.user && (
        <GlassCard style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.textDim, fontSize: 11, fontWeight: '600' }}>Driver</Text>
          <Text style={{ color: colors.text, marginTop: 4 }}>
            {order.delivery.driver.user.firstName} {order.delivery.driver.user.lastName}
          </Text>
        </GlassCard>
      )}

      {order.trackingEvents && order.trackingEvents.length > 0 && (
        <GlassCard style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.textDim, fontSize: 11, fontWeight: '600', marginBottom: 12 }}>Timeline</Text>
          {order.trackingEvents.map((ev) => (
            <View key={ev.id} style={{ marginBottom: 10, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: colors.primary }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{ev.description ?? ev.type}</Text>
              <Text style={{ color: colors.textDim, fontSize: 12 }}>{new Date(ev.createdAt).toLocaleString()}</Text>
            </View>
          ))}
        </GlassCard>
      )}

      {canCancel && (
        <GradientButton label="Cancel order" onPress={() => cancelMut.mutate()} variant="outline" />
      )}
    </ScrollView>
  );
}
