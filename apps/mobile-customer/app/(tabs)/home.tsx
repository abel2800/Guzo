import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getCustomerDashboard, listOrders } from '@guzo/mobile-shared';
import { OfflineBanner } from '@guzo/mobile-ui';
import { HeroSection } from '@/components/home/hero-section';
import { ServicesGrid } from '@/components/home/services-grid';
import { ActiveOrderCard } from '@/components/home/active-order-card';
import { PromoCarousel } from '@/components/home/promo-carousel';
import { GradientButton, GlassCard } from '@guzo/mobile-ui';
import { colors, designStyles, spacing } from '@/lib/design';

export default function HomeScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: getCustomerDashboard,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['home-active-orders'],
    queryFn: () => listOrders({ limit: 5 }),
  });

  const t = data?.totals;
  const activeOrders = (ordersData?.items ?? []).filter(
    (o) => !['DELIVERED', 'CANCELLED', 'FAILED'].includes(o.status),
  );

  return (
    <View style={designStyles.screen}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={[designStyles.screenPad, { paddingTop: spacing.md }]}
        refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <HeroSection />

        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statLabel}>Orders</Text>
            <Text style={styles.statValue}>{t?.orders ?? '—'}</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statLabel}>In transit</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{t?.inTransit ?? 0}</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statLabel}>Delivered</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>{t?.delivered ?? 0}</Text>
          </GlassCard>
        </View>

        <ServicesGrid />

        {activeOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active deliveries</Text>
              <Text style={styles.seeAll} onPress={() => router.push('/(tabs)/orders')}>See all</Text>
            </View>
            {activeOrders.slice(0, 2).map((order) => (
              <ActiveOrderCard key={order.id} order={order} />
            ))}
          </View>
        )}

        <PromoCarousel />

        <View style={styles.ctaBlock}>
          <GradientButton label="Send new order" onPress={() => router.push('/(tabs)/book')} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 8 },
  statCard: { flex: 1 },
  statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 4 },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  seeAll: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  ctaBlock: { marginTop: 28, marginBottom: 16 },
});
