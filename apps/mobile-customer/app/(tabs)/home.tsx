import { View, Text, ScrollView, RefreshControl, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getCustomerDashboard } from '@guzo/mobile-shared';
import { OfflineBanner } from '@guzo/mobile-ui';
import { HeroSection } from '@/components/home/hero-section';
import { ServicesGrid } from '@/components/home/services-grid';
import { ActiveOrderCard } from '@/components/home/active-order-card';
import { ParcelSummaryCards } from '@/components/home/parcel-summary-cards';
import { QuickSendFab } from '@/components/home/quick-send-fab';
import { PromoCarousel } from '@/components/home/promo-carousel';
import { colors, designStyles, spacing } from '@/lib/design';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: getCustomerDashboard,
  });

  const recent = data?.recentOrders ?? [];

  return (
    <View style={designStyles.screen}>
      <ScrollView
        contentContainerStyle={[
          designStyles.screenPad,
          { paddingTop: insets.top + spacing.sm, paddingBottom: 120 },
        ]}
        refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <OfflineBanner />
        <HeroSection />

        <Text style={styles.sectionTitle}>My parcels</Text>
        <ParcelSummaryCards parcels={data?.parcels} />

        <View style={styles.quickRow}>
          <QuickAction icon="qr-code-outline" label="Scan QR" onPress={() => router.push('/scan')} />
          <QuickAction icon="business-outline" label="Branches" onPress={() => router.push('/branches')} />
          <QuickAction icon="calculator-outline" label="Calculator" onPress={() => router.push('/calculator')} />
        </View>

        <ServicesGrid />

        {recent.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <Text style={styles.seeAll} onPress={() => router.push('/(tabs)/orders')}>See all</Text>
            </View>
            {recent.map((order) => (
              <ActiveOrderCard
                key={order.id}
                order={{
                  id: order.id,
                  orderNumber: order.orderNumber,
                  status: order.status as never,
                  deliveryType: 'STANDARD',
                  totalAmount: 0,
                  currency: 'ETB',
                  createdAt: order.createdAt,
                  pickupAddress: { id: '', line1: '', city: '—' },
                  dropoffAddress: { id: '', line1: '', city: '—' },
                  packages: [],
                }}
              />
            ))}
          </View>
        )}

        <PromoCarousel />
      </ScrollView>
      <QuickSendFab />
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickBtn} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 16 },
  seeAll: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  quickLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
});
