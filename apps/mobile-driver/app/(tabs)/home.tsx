import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getDriverDashboard, listDriverManifests } from '@guzo/mobile-shared';
import { GlassCard, colors, designStyles, gradients, radius, spacing } from '@guzo/mobile-ui';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const dash = useQuery({ queryKey: ['driver-dashboard'], queryFn: getDriverDashboard, refetchInterval: 30_000 });
  const manifests = useQuery({ queryKey: ['driver-manifests'], queryFn: listDriverManifests, refetchInterval: 30_000 });

  const today = dash.data?.today;
  const stats = [
    { label: 'Pickups today', value: today?.pickups ?? 0, icon: 'cube-outline' as const, route: '/(tabs)/active' as const },
    { label: 'Deliveries today', value: today?.deliveries ?? 0, icon: 'checkmark-done-outline' as const, route: '/(tabs)/active' as const },
    { label: 'Intercity trips', value: today?.intercity ?? manifests.data?.length ?? 0, icon: 'bus-outline' as const, route: manifests.data?.[0] ? `/manifest/${manifests.data[0].id}` as const : '/(tabs)/home' as const },
    { label: 'Open jobs', value: today?.available ?? 0, icon: 'briefcase-outline' as const, route: '/(tabs)/jobs' as const },
  ];

  return (
    <ScrollView style={[designStyles.screen, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <LinearGradient colors={[...gradients.hero]} style={styles.hero}>
        <Text style={styles.eyebrow}>Today&apos;s shift</Text>
        <Text style={styles.title}>Driver dashboard</Text>
        <Text style={styles.sub}>
          {dash.data?.driverCode ?? '—'} · ETB {Number(dash.data?.earningsBalance ?? 0).toLocaleString()} earned
        </Text>
      </LinearGradient>

      <View style={[designStyles.screenPad, { marginTop: -spacing.md }]}>
        <View style={styles.grid}>
          {stats.map((s) => (
            <Pressable key={s.label} onPress={() => router.push(s.route as '/(tabs)/jobs')}>
              <GlassCard style={styles.statCard}>
                <Ionicons name={s.icon} size={22} color={colors.primary} />
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </GlassCard>
            </Pressable>
          ))}
        </View>

        <GlassCard glow style={{ marginTop: 16 }}>
          <Text style={styles.section}>Quick actions</Text>
          <Pressable style={styles.action} onPress={() => router.push('/(tabs)/jobs')}>
            <Ionicons name="briefcase" size={20} color={colors.primary} />
            <Text style={styles.actionText}>Browse available jobs</Text>
          </Pressable>
          <Pressable style={styles.action} onPress={() => router.push('/(tabs)/active')}>
            <Ionicons name="navigate" size={20} color={colors.accent} />
            <Text style={styles.actionText}>Active deliveries</Text>
          </Pressable>
        </GlassCard>

        {(manifests.data?.length ?? 0) > 0 ? (
          <GlassCard style={{ marginTop: 16 }}>
            <Text style={styles.section}>Intercity manifests</Text>
            {manifests.data!.map((m) => (
              <Pressable key={m.id} style={styles.manifestRow} onPress={() => router.push(`/manifest/${m.id}` as '/delivery/[id]')}>
                <View>
                  <Text style={styles.manifestNum}>{m.manifestNumber}</Text>
                  <Text style={styles.manifestMeta}>{m.status} · {m.parcelCount} parcels</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </GlassCard>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 4 },
  sub: { color: colors.textMuted, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', flexGrow: 1, minWidth: '46%', padding: 14, gap: 6 },
  statValue: { color: colors.text, fontSize: 26, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  section: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  actionText: { color: colors.text, fontWeight: '600' },
  manifestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  manifestNum: { color: colors.text, fontWeight: '700' },
  manifestMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
