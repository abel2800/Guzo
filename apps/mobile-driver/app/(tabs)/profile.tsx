import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { getDriverDashboard } from '@guzo/mobile-shared';
import { GlassCard, colors, designStyles, gradients, radius, spacing } from '@guzo/mobile-ui';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { data } = useQuery({ queryKey: ['driver-dashboard'], queryFn: getDriverDashboard });

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'DR';

  return (
    <ScrollView style={[designStyles.screen, { paddingTop: insets.top }]} contentContainerStyle={designStyles.screenPad}>
      <View style={styles.avatarSection}>
        <View style={styles.avatarRing}>
          <LinearGradient colors={[...gradients.avatar]} style={styles.avatarGradient}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.code}>{data?.driverCode ?? 'Driver'}</Text>
        <View style={styles.badgeRow}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <Text style={styles.badgeText}>Verified driver</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Pressable style={{ flex: 1 }} onPress={() => router.push('/earnings' as '/')}>
          <GlassCard style={styles.statCard}>
            <Ionicons name="wallet-outline" size={22} color={colors.primary} />
            <Text style={styles.statLabel}>Earnings</Text>
            <Text style={styles.statValue}>ETB {(data?.earningsBalance ?? 0).toLocaleString()}</Text>
          </GlassCard>
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => router.push('/(tabs)/active')}>
          <GlassCard style={styles.statCard}>
            <Ionicons name="checkmark-done-outline" size={22} color={colors.accent} />
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statValue}>{data?.completedDeliveries ?? 0}</Text>
          </GlassCard>
        </Pressable>
      </View>

      <GlassCard>
        <MenuRow icon="person-outline" label="Edit profile & photo" onPress={() => router.push('/settings')} />
        <View style={styles.divider} />
        <MenuRow icon="navigate-outline" label="Active deliveries" onPress={() => router.push('/(tabs)/active')} />
        <View style={styles.divider} />
        <MenuRow icon="wallet-outline" label="Earnings history" onPress={() => router.push('/earnings' as '/')} />
        <View style={styles.divider} />
        <MenuRow icon="car-outline" label="Vehicle & logs" onPress={() => router.push('/vehicle' as '/')} />
        <View style={styles.divider} />
        <MenuRow icon="briefcase-outline" label="Available jobs" onPress={() => router.push('/(tabs)/jobs')} />
        <View style={styles.divider} />
        <MenuRow icon="help-circle-outline" label="Help & support" onPress={() => router.push('/settings')} />
      </GlassCard>

      <Pressable
        style={styles.signOut}
        onPress={async () => {
          await signOut();
          router.replace('/login');
        }}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

function MenuRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarRing: { padding: 3, borderRadius: 50, borderWidth: 2, borderColor: colors.borderGlow },
  avatarGradient: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: colors.bg },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 12 },
  code: { color: colors.textMuted, marginTop: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  badgeText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'flex-start', gap: 4 },
  statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  menuLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32, paddingVertical: 16 },
  signOutText: { color: colors.error, fontWeight: '600', fontSize: 16 },
});
