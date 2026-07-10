import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getMerchantDashboard, listMerchantCustomers } from '@guzo/mobile-shared';
import { GlassCard, colors, designStyles } from '@guzo/mobile-ui';

export default function AnalyticsScreen() {
  const summaryQ = useQuery({ queryKey: ['merchant-summary'], queryFn: getMerchantDashboard });
  const customersQ = useQuery({ queryKey: ['merchant-customers-count'], queryFn: listMerchantCustomers });

  const t = summaryQ.data?.totals;

  return (
    <ScrollView style={designStyles.screen} contentContainerStyle={designStyles.screenPad}>
      <Text style={styles.title}>Analytics</Text>
      <View style={styles.grid}>
        <GlassCard style={styles.stat}><Text style={styles.val}>{t?.orders ?? '…'}</Text><Text style={styles.lbl}>Orders</Text></GlassCard>
        <GlassCard style={styles.stat}><Text style={styles.val}>{t?.inTransit ?? '…'}</Text><Text style={styles.lbl}>In transit</Text></GlassCard>
        <GlassCard style={styles.stat}><Text style={styles.val}>{t?.delivered ?? '…'}</Text><Text style={styles.lbl}>Delivered</Text></GlassCard>
        <GlassCard style={styles.stat}><Text style={styles.val}>ETB {(t?.revenue ?? 0).toLocaleString()}</Text><Text style={styles.lbl}>Revenue</Text></GlassCard>
      </View>
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
});
