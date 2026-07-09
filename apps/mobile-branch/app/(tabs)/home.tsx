import { View, Text, Pressable, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getBranchStats } from '@guzo/mobile-shared';
import { GlassCard, colors, designStyles, gradients, radius, spacing } from '@guzo/mobile-ui';
import { useBranch } from '@/lib/branch';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { branchId, branch, branches, setBranchId } = useBranch();
  const { data, refetch, isRefetching } = useQuery({
    queryKey: ['branch-stats', branchId],
    queryFn: () => getBranchStats(branchId!),
    enabled: !!branchId,
  });

  const totals = data?.totals;

  return (
    <ScrollView
      style={[designStyles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={designStyles.screenPad}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <LinearGradient colors={[...gradients.hero]} style={styles.hero}>
        <Text style={styles.eyebrow}>Branch hub</Text>
        <Text style={styles.title}>{branch?.name ?? 'Select branch'}</Text>
        <Text style={styles.sub}>{branch?.city ?? '—'} · {branch?.code ?? ''}</Text>
      </LinearGradient>

      {branches.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {branches.map((b) => (
            <Pressable key={b.branchId} onPress={() => setBranchId(b.branchId)} style={[styles.branchChip, branchId === b.branchId && styles.branchChipActive]}>
              <Text style={[styles.branchChipText, branchId === b.branchId && styles.branchChipTextActive]}>{b.branch?.name ?? b.branchId}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.grid}>
        <StatCard label="In stock" value={totals?.inStock ?? 0} icon="cube-outline" />
        <StatCard label="Incoming today" value={totals?.incomingToday ?? 0} icon="download-outline" />
        <StatCard label="Outgoing" value={totals?.outgoing ?? 0} icon="airplane-outline" />
        <StatCard label="Ready pickup" value={totals?.readyForPickup ?? 0} icon="hand-left-outline" />
        <StatCard label="Picked up today" value={totals?.pickedUpToday ?? 0} icon="checkmark-circle-outline" />
      </View>

      <Text style={styles.section}>Quick actions</Text>
      <ActionRow icon="list-outline" label="Branch inventory" onPress={() => router.push('/inventory')} />
      <ActionRow icon="add-circle-outline" label="Register walk-in parcel" onPress={() => router.push('/register')} />
      <ActionRow icon="download-outline" label="Receive parcel" onPress={() => router.push('/(tabs)/receive')} />
      <ActionRow icon="layers-outline" label="Assign shelf" onPress={() => router.push('/shelf')} />
      <ActionRow icon="qr-code-outline" label="Customer pickup" onPress={() => router.push('/(tabs)/pickup')} />
      <ActionRow icon="alert-circle-outline" label="Returns & exceptions" onPress={() => router.push('/exceptions')} />
    </ScrollView>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <GlassCard style={styles.statCard}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

function ActionRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <GlassCard style={styles.actionRow}>
        <Ionicons name={icon} size={22} color={colors.primary} />
        <Text style={styles.actionLabel}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg, padding: spacing.lg, marginBottom: 16 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 4 },
  sub: { color: colors.textMuted, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: '31%', padding: 14, gap: 6, minWidth: 100 },
  statValue: { color: colors.text, fontSize: 26, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  section: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, paddingVertical: 14 },
  actionLabel: { flex: 1, color: colors.text, fontWeight: '600' },
  branchChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  branchChipActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.12)' },
  branchChipText: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
  branchChipTextActive: { color: colors.primary },
});
