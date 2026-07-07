import { View, Text, FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { listOrders, ORDER_STATUS_LABELS } from '@guzo/mobile-shared';
import { GlassCard, colors, designStyles, gradients, radius, spacing } from '@guzo/mobile-ui';

export default function JobsScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['available-jobs'],
    queryFn: () => listOrders({ scope: 'available', limit: 50 }),
    refetchInterval: 30_000,
  });

  const count = data?.items.length ?? 0;

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <LinearGradient colors={[...gradients.hero]} style={styles.hero}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroEyebrow}>Driver hub</Text>
            <Text style={styles.heroTitle}>Available jobs</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countNum}>{count}</Text>
            <Text style={styles.countLabel}>open</Text>
          </View>
        </View>
        <Text style={styles.heroSub}>Accept a job and start earning — GPS tracking runs automatically.</Text>
      </LinearGradient>

      <FlatList
        contentContainerStyle={[designStyles.screenPad, { paddingTop: spacing.md }]}
        data={data?.items ?? []}
        keyExtractor={(o) => o.id}
        refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="briefcase-outline" size={48} color={colors.textDim} />
            <Text style={styles.emptyText}>No jobs right now</Text>
            <Text style={styles.emptySub}>Pull to refresh — new jobs appear every few seconds</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/delivery/${item.id}`)}>
            <GlassCard glow style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.ref}>{item.orderNumber}</Text>
                <View style={styles.earnBadge}>
                  <Text style={styles.earnText}>{item.currency} {Number(item.totalAmount).toLocaleString()}</Text>
                </View>
              </View>
              <View style={styles.route}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={styles.routeText} numberOfLines={1}>
                  {item.pickupAddress.line1} → {item.dropoffAddress.line1}
                </Text>
              </View>
              <Text style={styles.meta}>{ORDER_STATUS_LABELS[item.status]} · Tap to view</Text>
            </GlassCard>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroEyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  heroTitle: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 4 },
  heroSub: { color: colors.textMuted, fontSize: 14, marginTop: 12, lineHeight: 20 },
  countBadge: { alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderGlow },
  countNum: { color: colors.primary, fontSize: 24, fontWeight: '800' },
  countLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  card: { marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { color: colors.text, fontWeight: '800', fontSize: 16 },
  earnBadge: { backgroundColor: 'rgba(6,182,212,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  earnText: { color: colors.accent, fontWeight: '700', fontSize: 12 },
  route: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  routeText: { color: colors.textMuted, fontSize: 13, flex: 1 },
  meta: { color: colors.textDim, fontSize: 11, marginTop: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySub: { color: colors.textDim, fontSize: 13, marginTop: 6, textAlign: 'center', paddingHorizontal: 24 },
});
