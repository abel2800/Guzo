import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useBranch } from '@/lib/branch';
import { GlassCard, GradientButton, colors, designStyles, spacing } from '@guzo/mobile-ui';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { branch } = useBranch();

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top, padding: spacing.lg }]}>
      <Text style={styles.title}>Profile</Text>
      <GlassCard style={{ marginBottom: 16 }}>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.branch}>{branch?.name ?? 'No branch assigned'}</Text>
      </GlassCard>
      <Pressable onPress={() => router.push('/shelf')}>
        <GlassCard style={styles.row}>
          <Ionicons name="layers-outline" size={20} color={colors.primary} />
          <Text style={styles.rowText}>Shelf assignment</Text>
        </GlassCard>
      </Pressable>
      <GradientButton
        label="Sign out"
        onPress={async () => {
          await signOut();
          router.replace('/login');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '900', marginBottom: 16 },
  name: { color: colors.text, fontSize: 20, fontWeight: '800' },
  email: { color: colors.textMuted, marginTop: 4 },
  branch: { color: colors.primary, marginTop: 10, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingVertical: 14 },
  rowText: { color: colors.text, fontWeight: '600' },
});
