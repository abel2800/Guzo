import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getWallet, listWalletTransactions, topUpWallet } from '@guzo/mobile-shared';
import { GlassCard, GradientButton } from '@guzo/mobile-ui';
import { colors, designStyles, spacing } from '@/lib/design';

const TOP_UP_AMOUNTS = [100, 250, 500, 1000];

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: getWallet });
  const { data: txns } = useQuery({ queryKey: ['wallet-txns'], queryFn: () => listWalletTransactions({ limit: 30 }) });

  const topUp = useMutation({
    mutationFn: (amount: number) => topUpWallet(amount, 'Mobile top-up'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['wallet-txns'] });
    },
  });

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Wallet</Text>
        <View style={styles.back} />
      </View>

      <View style={designStyles.screenPad}>
        <GlassCard style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balanceValue}>
            {wallet?.currency ?? 'ETB'} {Number(wallet?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
        </GlassCard>

        <Text style={styles.section}>Quick top-up</Text>
        <View style={styles.amountRow}>
          {TOP_UP_AMOUNTS.map((amt) => (
            <Pressable key={amt} style={styles.amountBtn} onPress={() => topUp.mutate(amt)} disabled={topUp.isPending}>
              <Text style={styles.amountText}>{amt}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Recent transactions</Text>
        <FlatList
          data={txns?.items ?? []}
          keyExtractor={(t) => t.id}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={styles.empty}>No transactions yet</Text>}
          renderItem={({ item }) => (
            <View style={styles.txnRow}>
              <View>
                <Text style={styles.txnType}>{item.type}</Text>
                <Text style={styles.txnDesc}>{item.description || item.reference}</Text>
              </View>
              <Text style={[styles.txnAmt, item.type === 'CREDIT' ? styles.credit : styles.debit]}>
                {item.type === 'CREDIT' ? '+' : '-'}{item.currency} {Number(item.amount).toLocaleString()}
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12 },
  back: { width: 40 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  balanceCard: { alignItems: 'center', paddingVertical: 24, marginBottom: 20 },
  balanceLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  balanceValue: { color: colors.text, fontSize: 32, fontWeight: '900', marginTop: 8 },
  section: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 },
  amountRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  amountBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.1)' },
  amountText: { color: colors.primary, fontWeight: '700' },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  txnType: { color: colors.text, fontWeight: '600', fontSize: 13 },
  txnDesc: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  txnAmt: { fontWeight: '700' },
  credit: { color: colors.primary },
  debit: { color: colors.error },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 20 },
});
