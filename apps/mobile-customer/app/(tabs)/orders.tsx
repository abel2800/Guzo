import { View, Text, FlatList, RefreshControl, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { listOrders, ORDER_STATUS_LABELS, fetchWithCache, cacheOrdersList } from '@guzo/mobile-shared';
import { OfflineBanner } from '@guzo/mobile-ui';
import { GlassCard } from '@guzo/mobile-ui';
import { colors, designStyles, radius, spacing } from '@/lib/design';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data: result, fromCache } = await fetchWithCache('orders:my:50', () => listOrders({ limit: 50 }));
      if (!fromCache) await cacheOrdersList(result.items);
      return result;
    },
  });

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <OfflineBanner />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Order history</Text>
        <View style={styles.back} />
      </View>
      <FlatList
        contentContainerStyle={[designStyles.screenPad, { paddingTop: spacing.sm }]}
        data={data?.items ?? []}
        keyExtractor={(o) => o.id}
        refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color={colors.textDim} />
            <Text style={styles.emptyText}>
              {isError ? 'Unable to load — pull to retry' : 'No orders yet'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/order/${item.id}`)}>
            <GlassCard style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.ref}>{item.orderNumber}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{ORDER_STATUS_LABELS[item.status] ?? item.status}</Text>
                </View>
              </View>
              <View style={styles.route}>
                <Ionicons name="swap-horizontal" size={14} color={colors.textMuted} />
                <Text style={styles.routeText}>{item.pickupAddress.city} → {item.dropoffAddress.city}</Text>
              </View>
              <Text style={styles.meta}>
                {item.currency} {Number(item.totalAmount).toLocaleString()} · {item.deliveryType}
              </Text>
            </GlassCard>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12 },
  back: { width: 40 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { color: colors.text, fontWeight: '800', fontSize: 16 },
  badge: { backgroundColor: 'rgba(34,197,94,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  route: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  routeText: { color: colors.textMuted, fontSize: 14 },
  meta: { color: colors.textDim, fontSize: 12, marginTop: 6 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: colors.textMuted, marginTop: 12, fontSize: 16 },
});
