import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  register,
  sendOtp,
  verifyOtp,
  isRegisterPending,
  validatePassword,
  PASSWORD_HINT,
  OTP_DEV_TERMINAL_HINT,
  useOtpResendCooldown,
} from '@guzo/mobile-shared';
import { useAuth } from '@/lib/auth';
import { GradientButton, GlassCard, PasswordField } from '@guzo/mobile-ui';
import { colors, gradients, radius, spacing } from '@/lib/design';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
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
  const { canResend, startCooldown, countdownLabel } = useOtpResendCooldown();

  async function onSendOtp(isResend = false) {
    setError('');
    setBusy(true);
    try {
      const res = await sendOtp(phone.trim());
      setPhone(res.phone);
      setStep(2);
      startCooldown();
      if (isResend) setOtp('');
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
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
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
      if (isRegisterPending(res)) {
        setError(res.message);
        return;
      }
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
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.sub}>Step {step} of 3 — {step === 1 ? 'Phone' : step === 2 ? 'Verify OTP' : 'Your details'}</Text>

          <GlassCard style={styles.card}>
            {step === 1 && (
              <>
                <Text style={styles.label}>Phone number</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="09…" placeholderTextColor={colors.textDim} />
                <GradientButton label={busy ? 'Sending…' : 'Send OTP'} onPress={() => onSendOtp(false)} disabled={busy || !phone.trim()} />
                <Text style={styles.devHint}>{OTP_DEV_TERMINAL_HINT}</Text>
              </>
            )}
            {step === 2 && (
              <>
                <Text style={styles.label}>Enter 6-digit code sent to {phone}</Text>
                <Text style={styles.devHint}>{OTP_DEV_TERMINAL_HINT}</Text>
                <TextInput style={styles.input} value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} placeholder="000000" placeholderTextColor={colors.textDim} />
                <GradientButton label={busy ? 'Verifying…' : 'Verify'} onPress={onVerifyOtp} disabled={busy || otp.length < 6} />
                <Pressable
                  onPress={() => onSendOtp(true)}
                  disabled={busy || !canResend}
                  style={[styles.resendBtn, (!canResend || busy) && styles.resendBtnDisabled]}
                >
                  <Text style={[styles.resendText, (!canResend || busy) && styles.resendTextDisabled]}>
                    {busy ? 'Sending…' : canResend ? 'Send OTP again' : `Send again in ${countdownLabel}`}
                  </Text>
                </Pressable>
              </>
            )}
            {step === 3 && (
              <>
                <Field label="First name" value={firstName} onChange={setFirstName} />
                <Field label="Last name" value={lastName} onChange={setLastName} />
                <Field label="Email" value={email} onChange={setEmail} autoCapitalize="none" keyboard="email-address" />
                <PasswordField label="Password" value={password} onChangeText={setPassword} containerStyle={{ marginBottom: 4 }} />
                <Text style={styles.hint}>{PASSWORD_HINT}</Text>
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
  scroll: { paddingHorizontal: spacing.lg },
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
  hint: { color: colors.textDim, fontSize: 12, marginBottom: 14, lineHeight: 18 },
  devHint: { color: colors.textDim, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  resendBtn: { marginTop: 14, alignItems: 'center', paddingVertical: 10 },
  resendBtnDisabled: { opacity: 0.55 },
  resendText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  resendTextDisabled: { color: colors.textMuted },
});
