import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getMerchantDashboard, listMerchantCustomers, listOrders } from '@guzo/mobile-shared';
import { GlassCard, colors, designStyles } from '@guzo/mobile-ui';

function last7DayBuckets(orders: Array<{ createdAt: string }>) {
  const days: { label: string; count: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      count: orders.filter((o) => o.createdAt.slice(0, 10) === key).length,
    });
  }
  return days;
}

export default function AnalyticsScreen() {
  const summaryQ = useQuery({ queryKey: ['merchant-summary'], queryFn: getMerchantDashboard });
  const customersQ = useQuery({ queryKey: ['merchant-customers-count'], queryFn: listMerchantCustomers });
  const ordersQ = useQuery({
    queryKey: ['merchant-orders-chart'],
    queryFn: () => listOrders({ limit: 100 }),
  });

  const t = summaryQ.data?.totals;
  const chart = useMemo(
    () => last7DayBuckets(ordersQ.data?.items ?? []),
    [ordersQ.data?.items],
  );
  const maxCount = Math.max(1, ...chart.map((d) => d.count));

  return (
    <ScrollView style={designStyles.screen} contentContainerStyle={designStyles.screenPad}>
      <Text style={styles.title}>Analytics</Text>
      <View style={styles.grid}>
        <GlassCard style={styles.stat}><Text style={styles.val}>{t?.orders ?? '…'}</Text><Text style={styles.lbl}>Orders</Text></GlassCard>
        <GlassCard style={styles.stat}><Text style={styles.val}>{t?.inTransit ?? '…'}</Text><Text style={styles.lbl}>In transit</Text></GlassCard>
        <GlassCard style={styles.stat}><Text style={styles.val}>{t?.delivered ?? '…'}</Text><Text style={styles.lbl}>Delivered</Text></GlassCard>
        <GlassCard style={styles.stat}><Text style={styles.val}>ETB {(t?.revenue ?? 0).toLocaleString()}</Text><Text style={styles.lbl}>Revenue</Text></GlassCard>
      </View>

      <GlassCard style={styles.chartCard}>
        <Text style={styles.chartTitle}>Orders — last 7 days</Text>
        <View style={styles.chartRow}>
          {chart.map((d) => (
            <View key={d.label} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: `${(d.count / maxCount) * 100}%` }]} />
              </View>
              <Text style={styles.barVal}>{d.count}</Text>
              <Text style={styles.barLbl}>{d.label}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      <GlassCard>
        <Text style={styles.lbl}>Unique customers</Text>
        <Text style={styles.val}>{customersQ.data?.length ?? '…'}</Text>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '900', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  stat: { width: '47%', padding: 12 },
  val: { color: colors.text, fontSize: 20, fontWeight: '800' },
  lbl: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  chartCard: { marginBottom: 12, padding: 14 },
  chartTitle: { color: colors.text, fontWeight: '700', marginBottom: 12 },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140 },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: { width: 18, height: 90, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: colors.primary, borderRadius: 6 },
  barVal: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  barLbl: { color: colors.textDim, fontSize: 9, marginTop: 2 },
});
