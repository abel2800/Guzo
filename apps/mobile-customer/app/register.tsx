import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { register, sendOtp, verifyOtp } from '@guzo/mobile-shared';
import { useAuth } from '@/lib/auth';
import { GradientButton, GlassCard } from '@guzo/mobile-ui';
import { colors, gradients, radius, spacing } from '@/lib/design';

export default function RegisterScreen() {
  const { completeSession } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSendOtp() {
    setError('');
    setBusy(true);
    try {
      const res = await sendOtp(phone.trim());
      setPhone(res.phone);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyOtp() {
    setError('');
    setBusy(true);
    try {
      await verifyOtp(phone.trim(), otp.trim());
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    } finally {
      setBusy(false);
    }
  }

  async function onRegister() {
    setError('');
    setBusy(true);
    try {
      const res = await register({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        role: 'CUSTOMER',
      });
      await completeSession(res);
      router.replace('/(tabs)/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <LinearGradient colors={[...gradients.hero]} style={styles.bg}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.sub}>Step {step} of 3 — {step === 1 ? 'Phone' : step === 2 ? 'Verify OTP' : 'Your details'}</Text>

          <GlassCard style={styles.card}>
            {step === 1 && (
              <>
                <Text style={styles.label}>Phone number</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="09…" placeholderTextColor={colors.textDim} />
                <GradientButton label={busy ? 'Sending…' : 'Send OTP'} onPress={onSendOtp} disabled={busy || !phone.trim()} />
              </>
            )}
            {step === 2 && (
              <>
                <Text style={styles.label}>Enter 6-digit code sent to {phone}</Text>
                <TextInput style={styles.input} value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} placeholder="000000" placeholderTextColor={colors.textDim} />
                <GradientButton label={busy ? 'Verifying…' : 'Verify'} onPress={onVerifyOtp} disabled={busy || otp.length < 6} />
              </>
            )}
            {step === 3 && (
              <>
                <Field label="First name" value={firstName} onChange={setFirstName} />
                <Field label="Last name" value={lastName} onChange={setLastName} />
                <Field label="Email" value={email} onChange={setEmail} autoCapitalize="none" keyboard="email-address" />
                <Field label="Password" value={password} onChange={setPassword} secure />
                <GradientButton label={busy ? 'Creating…' : 'Create account'} onPress={onRegister} disabled={busy || !email || !password} />
              </>
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function Field({ label, value, onChange, secure, keyboard, autoCapitalize }: {
  label: string; value: string; onChange: (v: string) => void; secure?: boolean; keyboard?: 'email-address'; autoCapitalize?: 'none';
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        keyboardType={keyboard}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={colors.textDim}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: 48 },
  back: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: colors.text },
  sub: { color: colors.textMuted, marginBottom: 20, marginTop: 4 },
  card: { marginTop: 8 },
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
  error: { color: colors.error, marginTop: 12, textAlign: 'center' },
});
