import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listBranchInventory, type BranchInventoryItem } from '@guzo/mobile-shared';
import { GlassCard, colors, designStyles, radius, spacing } from '@guzo/mobile-ui';
import { useBranch } from '@/lib/branch';

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const { branchId } = useBranch();
  const [state, setState] = useState<'in-stock' | 'all'>('in-stock');

  const { data, refetch, isRefetching, isLoading } = useQuery({
    queryKey: ['branch-inventory', branchId, state],
    queryFn: () => listBranchInventory(branchId!, { state, limit: 50 }),
    enabled: !!branchId,
  });

  const items = data?.items ?? [];

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Branch inventory</Text>
      </View>

      <View style={styles.filters}>
        {(['in-stock', 'all'] as const).map((s) => (
          <Pressable key={s} onPress={() => setState(s)} style={[styles.chip, state === s && styles.chipActive]}>
            <Text style={[styles.chipText, state === s && styles.chipTextActive]}>{s === 'in-stock' ? 'In stock' : 'All'}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        ListEmptyComponent={
          <Text style={styles.empty}>{isLoading ? 'Loading…' : 'No parcels in inventory'}</Text>
        }
        renderItem={({ item }) => <InventoryRow item={item} />}
      />
    </View>
  );
}

function InventoryRow({ item }: { item: BranchInventoryItem }) {
  const pkg = item.package;
  return (
    <GlassCard style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.trk}>{pkg?.trackingNumber ?? '—'}</Text>
        <Text style={styles.meta}>{pkg?.order?.dropoffAddress?.city ?? '—'} · {pkg?.order?.orderNumber ?? ''}</Text>
        {item.shelfCode ? <Text style={styles.shelf}>Shelf {item.shelfCode}{item.zone ? ` · ${item.zone}` : ''}</Text> : null}
      </View>
      <Text style={styles.status}>{pkg?.status ?? ''}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.lg, paddingBottom: 8 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  chipActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.12)' },
  chipText: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
  chipTextActive: { color: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, padding: 14 },
  trk: { color: colors.text, fontWeight: '700', fontFamily: 'monospace' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  shelf: { color: colors.primary, fontSize: 11, marginTop: 4 },
  status: { color: colors.textDim, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});
