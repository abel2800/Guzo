import { useEffect, useMemo, useState } from 'react';
import { View, Text, SectionList, RefreshControl, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  listOrders,
  ORDER_STATUS_LABELS,
  PARCEL_BUCKETS,
  groupOrdersByBucket,
  fetchWithCache,
  cacheOrdersList,
  type ParcelBucketKey,
} from '@guzo/mobile-shared';
import { OfflineBanner, GlassCard } from '@guzo/mobile-ui';
import { colors, designStyles, radius, spacing } from '@/lib/design';

const ACTIVE_BUCKETS: ParcelBucketKey[] = [
  'waiting', 'pickedUp', 'atBranch', 'inTransit', 'atWarehouse', 'atDestinationBranch', 'readyForPickup',
];

const FILTER_MAP: Record<string, ParcelBucketKey[] | 'incoming' | 'all'> = {
  active: ACTIVE_BUCKETS,
  incoming: 'incoming',
  ready: ['readyForPickup', 'atDestinationBranch'],
  delivered: ['delivered'],
  draft: ['draft'],
  all: 'all',
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const [tab, setTab] = useState<'sent' | 'incoming'>('sent');

  useEffect(() => {
    if (filter === 'incoming') setTab('incoming');
  }, [filter]);

  const { data, isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ['my-orders', tab],
    queryFn: async () => {
      const scope = tab === 'incoming' ? 'incoming' : undefined;
      const { data: result, fromCache } = await fetchWithCache(`orders:my:${tab}:50`, () =>
        listOrders({ limit: 50, scope }),
      );
      if (!fromCache) await cacheOrdersList(result.items);
      return result;
    },
  });

  const sections = useMemo(() => {
    const orders = data?.items ?? [];
    const bucketFilter = filter ? FILTER_MAP[filter] : undefined;
    if (bucketFilter === 'incoming') {
      return [{ title: 'Incoming parcels', data: orders }];
    }
    const grouped = groupOrdersByBucket(orders);
    return PARCEL_BUCKETS.filter((b) => {
      if (bucketFilter && bucketFilter !== 'all' && !bucketFilter.includes(b.key)) return false;
      return grouped[b.key].length > 0;
    }).map((b) => ({ title: b.label, data: grouped[b.key] }));
  }, [data?.items, filter]);

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <OfflineBanner />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>My parcels</Text>
        <View style={styles.back} />
      </View>

      <View style={styles.tabs}>
        <TabChip label="Sent" active={tab === 'sent'} onPress={() => setTab('sent')} />
        <TabChip label="Incoming" active={tab === 'incoming'} onPress={() => setTab('incoming')} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(o) => o.id}
        contentContainerStyle={[designStyles.screenPad, { paddingTop: spacing.sm }]}
        refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color={colors.textDim} />
            <Text style={styles.emptyText}>{isError ? 'Unable to load — pull to retry' : 'No parcels in this group'}</Text>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => <Text style={styles.groupTitle}>{title}</Text>}
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
                {item.currency} {Number(item.totalAmount).toLocaleString()} · {item.packages[0]?.trackingNumber ?? '—'}
              </Text>
            </GlassCard>
          </Pressable>
        )}
      />
    </View>
  );
}

function TabChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12 },
  back: { width: 40 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  tabActive: { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: colors.primary },
  tabText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: colors.primary },
  groupTitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
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
