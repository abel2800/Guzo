import { View, Text, ScrollView, RefreshControl, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getMerchantDashboard } from '@guzo/mobile-shared';
import { GlassCard, colors, designStyles, gradients, radius, spacing } from '@guzo/mobile-ui';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['merchant-dashboard'],
    queryFn: getMerchantDashboard,
  });
  const t = data?.totals;

  return (
    <ScrollView
      style={[designStyles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={[designStyles.screenPad, { paddingBottom: 100 }]}
      refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <LinearGradient colors={[...gradients.hero]} style={styles.hero}>
        <Text style={styles.eyebrow}>Merchant hub</Text>
        <Text style={styles.title}>{data?.businessName ?? 'Your business'}</Text>
        <Text style={styles.code}>{data?.merchantCode}</Text>
      </LinearGradient>

      <View style={styles.quickRow}>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/create')}>
          <LinearGradient colors={[...gradients.primary]} style={styles.quickGradient}>
            <Ionicons name="add" size={24} color={colors.bg} />
          </LinearGradient>
          <Text style={styles.quickLabel}>New shipment</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/bulk')}>
          <View style={styles.quickOutline}>
            <Ionicons name="layers-outline" size={24} color={colors.primary} />
          </View>
          <Text style={styles.quickLabel}>Bulk upload</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/orders')}>
          <View style={styles.quickOutline}>
            <Ionicons name="list" size={24} color={colors.accent} />
          </View>
          <Text style={styles.quickLabel}>All orders</Text>
        </Pressable>
      </View>

      <View style={styles.quickRow}>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/analytics')}>
          <View style={styles.quickOutline}>
            <Ionicons name="bar-chart-outline" size={22} color={colors.primary} />
          </View>
          <Text style={styles.quickLabel}>Analytics</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/customers')}>
          <View style={styles.quickOutline}>
            <Ionicons name="people-outline" size={22} color={colors.accent} />
          </View>
          <Text style={styles.quickLabel}>Customers</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/invoices')}>
          <View style={styles.quickOutline}>
            <Ionicons name="receipt-outline" size={22} color={colors.primary} />
          </View>
          <Text style={styles.quickLabel}>Invoices</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/api-keys')}>
          <View style={styles.quickOutline}>
            <Ionicons name="key-outline" size={22} color={colors.textMuted} />
          </View>
          <Text style={styles.quickLabel}>API keys</Text>
        </Pressable>
      </View>

      <GlassCard glow style={styles.mainStat}>
        <Text style={styles.statLabel}>Total orders</Text>
        <Text style={styles.mainStatValue}>{t?.orders ?? 0}</Text>
      </GlassCard>

      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <Ionicons name="bicycle-outline" size={20} color={colors.primary} />
          <Text style={styles.statLabel}>In transit</Text>
          <Text style={styles.statValue}>{t?.inTransit ?? 0}</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.accent} />
          <Text style={styles.statLabel}>Delivered</Text>
          <Text style={styles.statValue}>{t?.delivered ?? 0}</Text>
        </GlassCard>
      </View>

      <GlassCard>
        <Text style={styles.statLabel}>Revenue</Text>
        <Text style={styles.revenue}>ETB {(t?.revenue ?? 0).toLocaleString()}</Text>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, marginBottom: spacing.md, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 4 },
  code: { color: colors.textMuted, marginTop: 4 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  quickBtn: { alignItems: 'center', flex: 1 },
  quickGradient: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickOutline: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)' },
  quickLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 6, textAlign: 'center' },
  mainStat: { marginBottom: 12 },
  mainStatValue: { color: colors.text, fontSize: 40, fontWeight: '900', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, gap: 4 },
  statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
  revenue: { color: colors.primary, fontSize: 28, fontWeight: '800', marginTop: 4 },
});
