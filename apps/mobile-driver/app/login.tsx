import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  authenticateWithBiometrics,
  getBiometricEnabled,
  getLastEmail,
  isBiometricHardwareAvailable,
} from '@guzo/mobile-shared';
import { tokenStorage } from '@/lib/storage';
import { useAuth } from '@/lib/auth';
import { GradientButton, GlassCard, GuzoBrandLogo, PasswordField } from '@guzo/mobile-ui';
import { colors, gradients, radius, spacing } from '@/lib/design';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signInWithBiometrics } = useAuth();
  const [email, setEmail] = useState('driver@delivery.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showBio, setShowBio] = useState(false);

  useEffect(() => {
    (async () => {
      const last = await getLastEmail('driver');
      if (last) setEmail(last);
      const hasToken = !!(await tokenStorage.getAccessToken());
      setShowBio(hasToken && (await getBiometricEnabled('driver')) && (await isBiometricHardwareAvailable()));
    })();
  }, []);

  async function onSubmit() {
    setError('');
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)/jobs');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  async function onBiometric() {
    setError('');
    setBusy(true);
    try {
      if (!(await authenticateWithBiometrics('Unlock GUZO Driver'))) return;
      await signInWithBiometrics();
      router.replace('/(tabs)/jobs');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unlock failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <LinearGradient colors={[...gradients.hero]} style={styles.bg}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandBlock}>
            <GuzoBrandLogo source={require('@/assets/guzo-mark.png')} width={240} height={160} />
            <Text style={styles.tagline}>Driver — earn on every delivery</Text>
          </View>

          <GlassCard intensity={50} style={styles.formCard}>
            {showBio && (
              <Pressable style={styles.bioBtn} onPress={onBiometric} disabled={busy}>
                <Ionicons name="finger-print" size={28} color={colors.primary} />
                <Text style={styles.bioText}>Unlock with Face ID / Fingerprint</Text>
              </Pressable>
            )}

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.textDim} />
            <Text style={styles.label}>Password</Text>
            <PasswordField value={password} onChangeText={setPassword} containerStyle={{ marginBottom: 14 }} />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <GradientButton label={busy ? 'Signing in…' : 'Sign in'} onPress={onSubmit} disabled={busy} loading={busy} />

            <Pressable onPress={() => router.push('/forgot-password')} style={styles.linkRow}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/signup')} style={styles.registerLink}>
              <Text style={styles.registerText}>
                New driver? <Text style={styles.registerBold}>Apply now</Text>
              </Text>
            </Pressable>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, minHeight: '100%' },
  brandBlock: { alignItems: 'center', marginBottom: 32 },
  tagline: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  formCard: { marginTop: 8 },
  bioBtn: { alignItems: 'center', paddingVertical: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  bioText: { color: colors.primary, fontWeight: '600', marginTop: 8, fontSize: 14 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    marginBottom: 14,
  },
  error: { color: colors.error, marginBottom: 12, textAlign: 'center', fontSize: 14 },
  linkRow: { marginTop: 12, alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  registerLink: { marginTop: 16, alignItems: 'center' },
  registerText: { color: colors.textMuted, fontSize: 14 },
  registerBold: { color: colors.primary, fontWeight: '700' },
});
