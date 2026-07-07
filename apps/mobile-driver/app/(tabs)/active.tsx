import { View, Text, FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { listOrders, ORDER_STATUS_LABELS } from '@guzo/mobile-shared';
import { GlassCard, OfflineBanner, colors, designStyles, spacing } from '@guzo/mobile-ui';

const STEPS = ['Pickup', 'In transit', 'Delivered'];

function stepFor(status: string) {
  if (status === 'DELIVERED') return 3;
  if (['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PICKED_UP'].includes(status)) return 2;
  return 1;
}

export default function ActiveScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: () => listOrders({ limit: 50 }),
    refetchInterval: 15_000,
  });

  const active = (data?.items ?? []).filter((o) => !['DELIVERED', 'CANCELLED', 'FAILED'].includes(o.status));

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <OfflineBanner />
      <View style={styles.header}>
        <Text style={styles.title}>Active deliveries</Text>
        <Text style={styles.sub}>{active.length} in progress</Text>
      </View>
      <FlatList
        contentContainerStyle={[designStyles.screenPad, { paddingTop: spacing.sm }]}
        data={active}
        keyExtractor={(o) => o.id}
        refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="navigate-outline" size={48} color={colors.textDim} />
            <Text style={styles.emptyText}>No active deliveries</Text>
            <Text style={styles.emptySub}>Accept a job from the Jobs tab to get started</Text>
          </View>
        }
        renderItem={({ item }) => {
          const step = stepFor(item.status);
          return (
            <Pressable onPress={() => router.push(`/delivery/${item.id}`)}>
              <GlassCard glow style={styles.card}>
                <View style={styles.liveRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.live}>LIVE GPS</Text>
                </View>
                <Text style={styles.ref}>{item.orderNumber}</Text>
                <View style={styles.progress}>
                  {STEPS.map((label, i) => (
                    <View key={label} style={styles.stepCol}>
                      <View style={[styles.stepDot, i < step && styles.stepDotDone]} />
                      <Text style={styles.stepLabel}>{label}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.route}>{item.pickupAddress.city} → {item.dropoffAddress.city}</Text>
                <Text style={styles.status}>{ORDER_STATUS_LABELS[item.status]}</Text>
              </GlassCard>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingVertical: 16 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  sub: { color: colors.textMuted, marginTop: 4 },
  card: { marginBottom: 12 },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginRight: 4 },
  live: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  ref: { color: colors.text, fontWeight: '800', fontSize: 17 },
  progress: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
  stepCol: { alignItems: 'center', flex: 1 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border, marginBottom: 4 },
  stepDotDone: { backgroundColor: colors.primary },
  stepLabel: { fontSize: 9, color: colors.textDim, fontWeight: '600' },
  route: { color: colors.textMuted, fontSize: 13 },
  status: { color: colors.accent, fontSize: 12, fontWeight: '600', marginTop: 6 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySub: { color: colors.textDim, fontSize: 13, marginTop: 6 },
});
