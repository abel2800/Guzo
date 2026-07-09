import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { listMerchantCustomers } from '@guzo/mobile-shared';
import { GlassCard, colors, designStyles } from '@guzo/mobile-ui';

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useQuery({ queryKey: ['merchant-customers'], queryFn: listMerchantCustomers });

  return (
    <ScrollView style={[designStyles.screen, { paddingTop: insets.top }]} contentContainerStyle={designStyles.screenPad}>
      <Text style={styles.title}>Customers</Text>
      <Text style={styles.sub}>Recipients from your merchant shipments.</Text>
      {isLoading ? <Text style={styles.muted}>Loading…</Text> : null}
      {(data ?? []).map((c, i) => (
        <GlassCard key={`${c.contactPhone}-${i}`} style={styles.card}>
          <Text style={styles.name}>{c.contactName ?? 'Customer'}</Text>
          <Text style={styles.meta}>{c.line1}, {c.city}</Text>
          <Text style={styles.meta}>{c.orderCount} orders · last {new Date(c.lastOrderAt).toLocaleDateString()}</Text>
        </GlassCard>
      ))}
      {!isLoading && !data?.length && <Text style={styles.muted}>No customers yet.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '900', marginBottom: 6 },
  sub: { color: colors.textMuted, marginBottom: 16 },
  card: { marginBottom: 10 },
  name: { color: colors.text, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  muted: { color: colors.textMuted, textAlign: 'center', marginTop: 24 },
});
