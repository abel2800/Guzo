import { View, Text, Pressable, ScrollView, StyleSheet, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWallet } from '@guzo/mobile-shared';
import { useAuth } from '@/lib/auth';
import { GlassCard } from '@guzo/mobile-ui';
import { colors, gradients, designStyles, radius, spacing } from '@/lib/design';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);
  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: getWallet });
  const currency = wallet?.currency ?? user?.walletCurrency ?? 'ETB';
  const balance = wallet?.balance ?? user?.walletBalance ?? 0;

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'GU';

  return (
    <ScrollView style={[designStyles.screen, { paddingTop: insets.top }]} contentContainerStyle={designStyles.screenPad}>
      <View style={styles.avatarSection}>
        <View style={styles.avatarRing}>
          <LinearGradient colors={[...gradients.avatar]} style={styles.avatarGradient}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.guzoId ? (
          <View style={styles.guzoBadge}>
            <Text style={styles.guzoId}>{user.guzoId}</Text>
          </View>
        ) : null}
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color={colors.warning} />
          <Text style={styles.rating}>4.9 · Trusted customer</Text>
        </View>
      </View>

      <GlassCard style={styles.wallet}>
        <View style={styles.walletRow}>
          <View>
            <Text style={styles.walletLabel}>Wallet balance</Text>
            <Text style={styles.walletValue}>
              {currency} {Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <Pressable style={styles.topUpBtn} onPress={() => router.push('/wallet')}>
            <Text style={styles.topUpText}>Top up</Text>
          </Pressable>
        </View>
      </GlassCard>

      <Text style={styles.sectionLabel}>Activity</Text>
      <MenuItem icon="cube-outline" label="My parcels" onPress={() => router.push('/(tabs)/orders')} />
      <MenuItem icon="receipt-outline" label="Receipts & invoices" onPress={() => router.push('/receipts')} />
      <MenuItem icon="location-outline" label="Saved addresses" onPress={() => router.push('/addresses')} />
      <MenuItem icon="people-outline" label="Family members" onPress={() => router.push('/family')} />
      <MenuItem icon="headset-outline" label="Support" onPress={() => router.push('/support')} />
      <MenuItem icon="refresh-outline" label="Send again" subtitle="Reorder last shipment" onPress={() => router.push('/(tabs)/book')} />

      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Settings</Text>
      <GlassCard>
        <MenuItem icon="person-outline" label="Edit profile & photo" onPress={() => router.push('/settings')} />
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <Ionicons name="notifications-outline" size={20} color={colors.textMuted} />
          <Text style={styles.settingLabel}>Push notifications</Text>
          <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: colors.primary }} />
        </View>
        <View style={styles.divider} />
        <MenuItem icon="shield-checkmark-outline" label="Security & biometrics" compact />
        <View style={styles.divider} />
        <MenuItem icon="help-circle-outline" label="Help & support" compact />
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

function MenuItem({
  icon,
  label,
  subtitle,
  onPress,
  compact,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable style={[styles.menuItem, compact && { paddingVertical: 12 }]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.menuLabel}>{label}</Text>
        {subtitle && <Text style={styles.menuSub}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarRing: { padding: 3, borderRadius: 999, marginBottom: 12 },
  avatarGradient: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.text, fontSize: 28, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  email: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  guzoBadge: { marginTop: 10, backgroundColor: 'rgba(34,197,94,0.12)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill },
  guzoId: { color: colors.primary, fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  rating: { color: colors.textMuted, fontSize: 13 },
  wallet: { marginBottom: 24 },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  walletValue: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 4 },
  topUpBtn: { backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill },
  topUpText: { color: colors.primary, fontWeight: '700' },
  sectionLabel: { color: colors.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  menuLabel: { color: colors.text, fontWeight: '600', fontSize: 15 },
  menuSub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  settingLabel: { flex: 1, color: colors.text, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  signOutText: { color: colors.error, fontWeight: '700', fontSize: 16 },
});
