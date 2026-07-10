import { View, Text, Pressable, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getBranchStats } from '@guzo/mobile-shared';
import { GlassCard, colors, designStyles, gradients, radius, spacing } from '@guzo/mobile-ui';
import { useBranch } from '@/lib/branch';
import { BranchSelector } from '@/components/branch-selector';

type StatKey = 'in-stock' | 'incoming-today' | 'outgoing' | 'ready-pickup' | 'picked-up-today';

const STAT_CARDS: Array<{
  key: StatKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  totalKey: 'inStock' | 'incomingToday' | 'outgoing' | 'readyForPickup' | 'pickedUpToday';
}> = [
  { key: 'in-stock', label: 'In stock', icon: 'cube-outline', totalKey: 'inStock' },
  { key: 'incoming-today', label: 'Incoming today', icon: 'download-outline', totalKey: 'incomingToday' },
  { key: 'outgoing', label: 'Outgoing', icon: 'airplane-outline', totalKey: 'outgoing' },
  { key: 'ready-pickup', label: 'Ready pickup', icon: 'hand-left-outline', totalKey: 'readyForPickup' },
  { key: 'picked-up-today', label: 'Picked up today', icon: 'checkmark-circle-outline', totalKey: 'pickedUpToday' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { branchId, branch, refresh } = useBranch();
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
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={async () => {
            await refresh();
            await refetch();
          }}
          tintColor={colors.primary}
        />
      }
    >
      <LinearGradient colors={[...gradients.hero]} style={styles.hero}>
        <Text style={styles.eyebrow}>Branch hub</Text>
        <Text style={styles.title}>{branch?.name ?? 'Branch operations'}</Text>
        <Text style={styles.sub}>{branch?.city ?? '—'} · {branch?.code ?? ''}</Text>
      </LinearGradient>

      <BranchSelector />

      <View style={styles.grid}>
        {STAT_CARDS.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={totals?.[card.totalKey] ?? 0}
            icon={card.icon}
            onPress={() => router.push({ pathname: '/stats/[filter]', params: { filter: card.key } })}
            disabled={!branchId}
          />
        ))}
      </View>

      <Text style={styles.section}>Quick actions</Text>
      <ActionRow icon="list-outline" label="Branch inventory" onPress={() => router.push('/inventory')} disabled={!branchId} />
      <ActionRow icon="add-circle-outline" label="Register walk-in parcel" onPress={() => router.push('/register')} disabled={!branchId} />
      <ActionRow icon="download-outline" label="Receive parcel" onPress={() => router.push('/(tabs)/receive')} disabled={!branchId} />
      <ActionRow icon="layers-outline" label="Assign shelf" onPress={() => router.push('/shelf')} disabled={!branchId} />
      <ActionRow icon="qr-code-outline" label="Customer pickup" onPress={() => router.push('/(tabs)/pickup')} disabled={!branchId} />
      <ActionRow icon="alert-circle-outline" label="Returns & exceptions" onPress={() => router.push('/exceptions')} disabled={!branchId} />
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [pressed && styles.pressed]}>
      <GlassCard style={styles.statCard}>
        <Ionicons name={icon} size={22} color={colors.primary} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textDim} style={styles.statChevron} />
      </GlassCard>
    </Pressable>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [pressed && styles.pressed]}>
      <GlassCard style={{ ...styles.actionRow, ...(disabled ? styles.disabled : {}) }}>
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
  statCard: { width: '31%', padding: 14, gap: 6, minWidth: 100, position: 'relative' },
  statValue: { color: colors.text, fontSize: 26, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  statChevron: { position: 'absolute', top: 10, right: 10 },
  section: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, paddingVertical: 14 },
  actionLabel: { flex: 1, color: colors.text, fontWeight: '600' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
});
