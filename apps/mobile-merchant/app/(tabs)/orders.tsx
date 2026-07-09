import { View, Text, FlatList, RefreshControl, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { listOrders, ORDER_STATUS_LABELS } from '@guzo/mobile-shared';
import { GlassCard, colors, designStyles, spacing } from '@guzo/mobile-ui';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['merchant-orders'],
    queryFn: () => listOrders({ limit: 50 }),
  });

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.sub}>{data?.items.length ?? 0} total</Text>
      </View>
      <FlatList
        contentContainerStyle={[designStyles.screenPad, { paddingBottom: 100 }]}
        data={data?.items ?? []}
        keyExtractor={(o) => o.id}
        refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color={colors.textDim} />
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySub}>Create your first shipment from the Create tab</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/order/${item.id}`)}>
            <GlassCard style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.ref}>{item.orderNumber}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{ORDER_STATUS_LABELS[item.status]}</Text>
              </View>
            </View>
            <Text style={styles.route}>{item.pickupAddress.city} → {item.dropoffAddress.city}</Text>
            <Text style={styles.amount}>{item.currency} {Number(item.totalAmount).toLocaleString()}</Text>
            </GlassCard>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingVertical: 16 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  sub: { color: colors.textMuted, marginTop: 4 },
  card: { marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { color: colors.text, fontWeight: '800', fontSize: 16 },
  statusBadge: { backgroundColor: 'rgba(34,197,94,0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  route: { color: colors.textMuted, marginTop: 8, fontSize: 13 },
  amount: { color: colors.accent, fontWeight: '700', marginTop: 6 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySub: { color: colors.textDim, fontSize: 13, marginTop: 6 },
});
