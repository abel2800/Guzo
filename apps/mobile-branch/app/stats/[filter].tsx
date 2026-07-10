import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  listBranchInventory,
  listBranchOrders,
  type BranchInventoryItem,
  type BranchOrderItem,
} from '@guzo/mobile-shared';
import { GlassCard, colors, designStyles, spacing } from '@guzo/mobile-ui';
import { useBranch } from '@/lib/branch';

type StatFilter =
  | 'in-stock'
  | 'incoming-today'
  | 'picked-up-today'
  | 'ready-pickup'
  | 'outgoing';

const TITLES: Record<StatFilter, string> = {
  'in-stock': 'In stock',
  'incoming-today': 'Incoming today',
  'picked-up-today': 'Picked up today',
  'ready-pickup': 'Ready for pickup',
  outgoing: 'Outgoing',
};

export default function StatListScreen() {
  const { filter } = useLocalSearchParams<{ filter: StatFilter }>();
  const statFilter = (filter ?? 'in-stock') as StatFilter;
  const { branchId } = useBranch();
  const isOrders = statFilter === 'ready-pickup' || statFilter === 'outgoing';

  const { data, refetch, isRefetching, isLoading } = useQuery({
    queryKey: ['branch-stat-list', branchId, statFilter],
    queryFn: async () => {
      if (!branchId) return { items: [] as Array<BranchInventoryItem | BranchOrderItem> };
      if (isOrders) {
        const res = await listBranchOrders(branchId, statFilter, { limit: 50 });
        return { items: res.items };
      }
      const res = await listBranchInventory(branchId, { state: statFilter, limit: 50 });
      return { items: res.items };
    },
    enabled: !!branchId,
  });

  const items = data?.items ?? [];

  return (
    <>
      <Stack.Screen options={{ title: TITLES[statFilter] ?? 'Stats' }} />
      <View style={designStyles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        ListEmptyComponent={
          <Text style={styles.empty}>{isLoading ? 'Loading…' : 'No items in this list'}</Text>
        }
        renderItem={({ item }) =>
          isOrders ? (
            <OrderRow item={item as BranchOrderItem} filter={statFilter} />
          ) : (
            <InventoryRow item={item as BranchInventoryItem} filter={statFilter} />
          )
        }
      />
      </View>
    </>
  );
}

function openBranchParcel(tracking: string | undefined, filter: StatFilter) {
  if (!tracking) return;
  if (filter === 'ready-pickup' || filter === 'outgoing') {
    router.push('/(tabs)/pickup');
    return;
  }
  router.push({ pathname: '/shelf', params: { tracking } });
}

function InventoryRow({ item, filter }: { item: BranchInventoryItem; filter: StatFilter }) {
  const pkg = item.package;
  const tracking = pkg?.trackingNumber;
  return (
    <Pressable onPress={() => openBranchParcel(tracking, filter)}>
      <GlassCard style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.trk}>{pkg?.trackingNumber ?? '—'}</Text>
        <Text style={styles.meta}>{pkg?.order?.orderNumber ?? ''}</Text>
        {item.shelfCode ? <Text style={styles.shelf}>Shelf {item.shelfCode}</Text> : null}
        {item.receivedAt ? <Text style={styles.time}>Received {new Date(item.receivedAt).toLocaleString()}</Text> : null}
        {item.pickedUpAt ? <Text style={styles.time}>Picked up {new Date(item.pickedUpAt).toLocaleString()}</Text> : null}
      </View>
      <Text style={styles.status}>{pkg?.status ?? ''}</Text>
      </GlassCard>
    </Pressable>
  );
}

function OrderRow({ item, filter }: { item: BranchOrderItem; filter: StatFilter }) {
  const tracking = item.trackingNumber ?? item.orderNumber;
  return (
    <Pressable onPress={() => openBranchParcel(tracking, filter)}>
      <GlassCard style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.trk}>{item.trackingNumber ?? item.orderNumber}</Text>
        <Text style={styles.meta}>{item.receiverName ?? item.receiverPhone ?? '—'}</Text>
        <Text style={styles.meta}>{item.dropoffLine1 ? `${item.dropoffLine1}, ${item.dropoffCity}` : ''}</Text>
      </View>
      <Text style={styles.status}>{item.status}</Text>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.lg, paddingBottom: 8 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, padding: 14 },
  trk: { color: colors.text, fontWeight: '700', fontFamily: 'monospace' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  shelf: { color: colors.primary, fontSize: 11, marginTop: 4 },
  time: { color: colors.textDim, fontSize: 10, marginTop: 4 },
  status: { color: colors.textDim, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});
