import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { GradientButton, GlassCard, GuzoBrandLogo, PasswordField } from '@guzo/mobile-ui';
import { colors, gradients, radius, spacing } from '@/lib/design';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('branch.staff@delivery.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setError('');
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <LinearGradient colors={[...gradients.hero]} style={styles.bg}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandBlock}>
          <GuzoBrandLogo source={require('@/assets/guzo-mark.png')} width={240} height={160} />
          <Text style={styles.tagline}>Hub counter operations</Text>
        </View>
        <GlassCard>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" placeholderTextColor={colors.textDim} />
          <Text style={styles.label}>Password</Text>
          <PasswordField value={password} onChangeText={setPassword} containerStyle={{ marginBottom: 12 }} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <GradientButton label={busy ? 'Signing in…' : 'Sign in'} onPress={onSubmit} disabled={busy} />
          <Pressable onPress={() => router.push('/forgot-password')} style={styles.linkRow}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/signup')} style={styles.registerLink}>
            <Text style={styles.registerText}>
              New branch staff? <Text style={styles.registerBold}>Apply now</Text>
            </Text>
          </Pressable>
        </GlassCard>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  brandBlock: { alignItems: 'center', marginBottom: 28 },
  tagline: { color: colors.textMuted, marginTop: 4 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, color: colors.text, marginBottom: 12 },
  error: { color: colors.error, marginBottom: 12, textAlign: 'center' },
  linkRow: { marginTop: 12, alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  registerLink: { marginTop: 16, alignItems: 'center' },
  registerText: { color: colors.textMuted, fontSize: 14 },
  registerBold: { color: colors.primary, fontWeight: '700' },
});
