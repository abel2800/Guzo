import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { GlassCard, colors, designStyles, gradients } from '@guzo/mobile-ui';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'ME';

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
        <View style={styles.badgeRow}>
          <Ionicons name="storefront" size={14} color={colors.primary} />
          <Text style={styles.badgeText}>Merchant account</Text>
        </View>
      </View>

      <GlassCard>
        <MenuRow icon="person-outline" label="Edit profile & photo" onPress={() => router.push('/settings')} />
        <View style={styles.divider} />
        <MenuRow icon="bar-chart-outline" label="Analytics" onPress={() => router.push('/analytics')} />
        <View style={styles.divider} />
        <MenuRow icon="people-outline" label="Customers" onPress={() => router.push('/customers')} />
        <View style={styles.divider} />
        <MenuRow icon="receipt-outline" label="Invoices" onPress={() => router.push('/invoices')} />
        <View style={styles.divider} />
        <MenuRow icon="key-outline" label="API keys" onPress={() => router.push('/api-keys')} />
        <View style={styles.divider} />
        <MenuRow icon="home-outline" label="Dashboard" onPress={() => router.push('/(tabs)/dashboard')} />
        <View style={styles.divider} />
        <MenuRow icon="layers-outline" label="Bulk upload" onPress={() => router.push('/(tabs)/bulk')} />
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
  email: { color: colors.textMuted, marginTop: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  badgeText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  menuLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32, paddingVertical: 16 },
  signOutText: { color: colors.error, fontWeight: '600', fontSize: 16 },
});
