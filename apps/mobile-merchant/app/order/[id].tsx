import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getOrder, ORDER_STATUS_LABELS } from '@guzo/mobile-shared';
import { GlassCard, colors, designStyles, spacing } from '@guzo/mobile-ui';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: order, isLoading } = useQuery({
    queryKey: ['merchant-order', id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
  });

  if (isLoading || !order) {
    return (
      <View style={[designStyles.screen, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.muted}>Loading order…</Text>
      </View>
    );
  }

  const tracking = order.packages?.[0]?.trackingNumber;

  return (
    <ScrollView style={[designStyles.screen, { paddingTop: insets.top }]} contentContainerStyle={designStyles.screenPad}>
      <Text style={styles.title}>{order.orderNumber}</Text>
      <Text style={styles.status}>{ORDER_STATUS_LABELS[order.status]}</Text>

      <GlassCard style={styles.card}>
        <Text style={styles.label}>Route</Text>
        <Text style={styles.value}>{order.pickupAddress.city} → {order.dropoffAddress.city}</Text>
        <Text style={styles.sub}>{order.dropoffAddress.line1}</Text>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.label}>Amount</Text>
        <Text style={styles.amount}>{order.currency} {Number(order.totalAmount).toLocaleString()}</Text>
      </GlassCard>

      {tracking && (
        <GlassCard style={styles.card}>
          <Text style={styles.label}>Tracking</Text>
          <Text style={styles.mono}>{tracking}</Text>
        </GlassCard>
      )}

      {order.trackingEvents?.length ? (
        <GlassCard style={styles.card}>
          <Text style={styles.label}>Timeline</Text>
          {order.trackingEvents.slice(0, 8).map((e) => (
            <Text key={e.id} style={styles.event}>{e.description ?? e.status}</Text>
          ))}
        </GlassCard>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  status: { color: colors.primary, fontWeight: '700', marginTop: 4, marginBottom: 16 },
  card: { marginBottom: 12 },
  label: { color: colors.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  value: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 6 },
  sub: { color: colors.textMuted, marginTop: 4 },
  amount: { color: colors.accent, fontSize: 22, fontWeight: '800', marginTop: 6 },
  mono: { fontFamily: 'monospace', color: colors.text, marginTop: 6 },
  event: { color: colors.textMuted, fontSize: 13, marginTop: 8 },
  muted: { color: colors.textMuted },
});
