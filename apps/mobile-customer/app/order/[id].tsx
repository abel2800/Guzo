import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Share, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DriverLocationPayload } from '@delivery/types';
import { cancelOrder, getOrder, ORDER_STATUS_LABELS, fetchWithCache, cacheOrder, useTrackingMapData } from '@guzo/mobile-shared';
import { LiveTrackingMap, OfflineBanner, GlassCard, GradientButton } from '@guzo/mobile-ui';
import { subscribeToOrder } from '@/lib/realtime';
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

  const driverPoint = driverLoc
    ? { latitude: driverLoc.lat, longitude: driverLoc.lng }
    : order?.delivery?.driver?.currentLat != null && order?.delivery?.driver?.currentLng != null
      ? { latitude: order.delivery.driver.currentLat, longitude: order.delivery.driver.currentLng }
      : null;

  const mapData = useTrackingMapData(
    order?.pickupAddress ?? { line1: '', city: '' },
    order?.dropoffAddress ?? { line1: '', city: '' },
    driverPoint,
  );

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
            pickup={mapData.pickup}
            dropoff={mapData.dropoff}
            driverLocation={driverPoint}
            routeCoordinates={mapData.routeCoordinates}
            routeMeta={mapData.routeMeta}
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
        {order.estimatedDeliveryAt ? ` · ETA ${new Date(order.estimatedDeliveryAt).toLocaleDateString()}` : ''}
      </Text>

      {order.packages[0] && (
        <GlassCard style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.textDim, fontSize: 11, fontWeight: '600' }}>Parcel</Text>
          <Text style={{ color: colors.text, marginTop: 4 }}>Tracking: {order.packages[0].trackingNumber}</Text>
          {order.packages[0].weightKg != null && (
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>Weight: {order.packages[0].weightKg} kg</Text>
          )}
          {order.packages[0].description && (
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>{order.packages[0].description}</Text>
          )}
          {order.packages[0].pickupPin && (
            <Text style={{ color: colors.primary, marginTop: 8, fontWeight: '700' }}>Pickup PIN: {order.packages[0].pickupPin}</Text>
          )}
          {order.packages[0].qrCode && (
            <Text style={{ color: colors.textDim, marginTop: 4, fontSize: 12 }}>QR: {order.packages[0].qrCode}</Text>
          )}
          <Pressable
            style={{ marginTop: 12 }}
            onPress={() =>
              Share.share({
                message: `Track my GUZO parcel ${order.packages[0]?.trackingNumber ?? order.orderNumber}: guzo-customer://track/${order.packages[0]?.trackingNumber ?? order.orderNumber}`,
              })
            }
          >
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Share tracking link</Text>
          </Pressable>
        </GlassCard>
      )}

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
