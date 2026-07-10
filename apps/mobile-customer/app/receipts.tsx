import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listInvoices } from '@guzo/mobile-shared';
import { GlassCard } from '@guzo/mobile-ui';
import { colors, designStyles, spacing } from '@/lib/design';

export default function ReceiptsScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useQuery({ queryKey: ['invoices'], queryFn: () => listInvoices({ limit: 50 }) });

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Receipts & invoices</Text>
        <View style={styles.back} />
      </View>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(i) => i.id}
        contentContainerStyle={designStyles.screenPad}
        ListEmptyComponent={<Text style={styles.empty}>{isLoading ? 'Loading…' : 'No invoices yet'}</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={{ marginBottom: 10 }}
            onPress={() => {
              if (item.orderId) router.push(`/order/${item.orderId}`);
            }}
            disabled={!item.orderId}
          >
            <GlassCard style={{ marginBottom: 0 }}>
              <Text style={styles.ref}>{item.invoiceNumber}</Text>
              <Text style={styles.meta}>{item.status} · {item.currency} {Number(item.total).toLocaleString()}</Text>
              {item.orderId ? <Text style={styles.link}>View order →</Text> : null}
            </GlassCard>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12 },
  back: { width: 40 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  ref: { color: colors.text, fontWeight: '800' },
  meta: { color: colors.textMuted, marginTop: 4 },
  link: { color: colors.primary, marginTop: 8, fontWeight: '600', fontSize: 13 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});
