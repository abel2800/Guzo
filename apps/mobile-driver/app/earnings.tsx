import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getDriverEarnings } from '@guzo/mobile-shared';
import { GlassCard, colors, designStyles, radius, spacing } from '@guzo/mobile-ui';

export default function EarningsScreen() {
  const { data, isLoading } = useQuery({ queryKey: ['driver-earnings'], queryFn: getDriverEarnings });

  return (
    <ScrollView style={designStyles.screen} contentContainerStyle={[designStyles.screenPad, { paddingBottom: 40 }]}>
      <Text style={styles.title}>Earnings</Text>

      <GlassCard glow>
        <Text style={styles.label}>Available balance</Text>
        <Text style={styles.balance}>ETB {(data?.balance ?? 0).toLocaleString()}</Text>
        <Text style={styles.sub}>{data?.totalDeliveries ?? 0} completed deliveries</Text>
      </GlassCard>

      <Text style={styles.section}>Payout history</Text>
      {isLoading ? (
        <Text style={styles.meta}>Loading…</Text>
      ) : (data?.transactions.length ?? 0) === 0 ? (
        <GlassCard><Text style={styles.meta}>Complete deliveries to earn payouts (15% commission)</Text></GlassCard>
      ) : (
        data!.transactions.map((t) => (
          <GlassCard key={t.id} style={{ marginBottom: 8 }}>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Ionicons name="wallet" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txnTitle}>{t.reference ?? 'Delivery'}</Text>
                <Text style={styles.meta}>{t.description ?? 'Earnings credit'}</Text>
                <Text style={styles.date}>{new Date(t.createdAt).toLocaleString()}</Text>
              </View>
              <Text style={styles.credit}>+ETB {t.amount.toLocaleString()}</Text>
            </View>
          </GlassCard>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  balance: { color: colors.text, fontSize: 32, fontWeight: '800', marginTop: 4 },
  sub: { color: colors.textMuted, marginTop: 8 },
  section: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 20, marginBottom: 10 },
  meta: { color: colors.textMuted, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(34,197,94,0.15)', alignItems: 'center', justifyContent: 'center' },
  txnTitle: { color: colors.text, fontWeight: '700' },
  date: { color: colors.textDim, fontSize: 11, marginTop: 4 },
  credit: { color: colors.primary, fontWeight: '800', fontSize: 16 },
});
