import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
import type { LoginResponse } from '@delivery/types';
import { GradientButton } from './gradient-button';
import { GlassCard } from './glass-card';
import { PasswordField } from './password-field';
import { colors, gradients, radius, spacing } from './design';

type SignupRole = 'CUSTOMER' | 'DRIVER' | 'MERCHANT' | 'BRANCH_STAFF';

const ROLE_COPY: Record<SignupRole, { title: string; subtitle: string; pendingNote?: string }> = {
  CUSTOMER: {
    title: 'Create customer account',
    subtitle: 'Book shipments and track parcels instantly.',
  },
  DRIVER: {
    title: 'Apply as a driver',
    subtitle: 'Join the GUZO delivery fleet.',
    pendingNote: 'Driver accounts are reviewed by GUZO admins before you can sign in.',
  },
  MERCHANT: {
    title: 'Register your business',
    subtitle: 'Ship products with GUZO logistics.',
    pendingNote: 'Merchant accounts require admin approval before activation.',
  },
  BRANCH_STAFF: {
    title: 'Branch staff signup',
    subtitle: 'Register to work at a GUZO branch.',
    pendingNote: 'Branch staff accounts are approved by an admin after review.',
  },
};

type Props = {
  role: SignupRole;
  onSuccess: (result: LoginResponse) => void | Promise<void>;
  onBack?: () => void;
  onSignIn?: () => void;
};

export function SignupScreen({ role, onSuccess, onBack, onSignIn }: Props) {
  const insets = useSafeAreaInsets();
  const copy = ROLE_COPY[role];
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
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

  async function onSubmit() {
    setError('');
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setBusy(true);
    try {
      const result = await register({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        role,
      });
      if (isRegisterPending(result)) {
        Alert.alert('Submitted for review', result.message, [{ text: 'OK', onPress: onSignIn }]);
        return;
      }
      await onSuccess(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  const stepLabel = step === 1 ? 'Phone' : step === 2 ? 'Verify OTP' : 'Your details';

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
          {onBack ? (
            <Pressable onPress={onBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
          ) : null}

          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
          {copy.pendingNote ? <Text style={styles.note}>{copy.pendingNote}</Text> : null}
          <Text style={styles.step}>Step {step} of 3 — {stepLabel}</Text>

          <GlassCard style={styles.card}>
            {step === 1 && (
              <>
                <Text style={styles.label}>Phone number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="09…"
                  placeholderTextColor={colors.textDim}
                />
                <GradientButton
                  label={busy ? 'Sending…' : 'Send OTP'}
                  onPress={() => onSendOtp(false)}
                  disabled={busy || !phone.trim()}
                  loading={busy}
                />
                <Text style={styles.devHint}>{OTP_DEV_TERMINAL_HINT}</Text>
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.label}>Enter 6-digit code sent to {phone}</Text>
                <Text style={styles.devHint}>{OTP_DEV_TERMINAL_HINT}</Text>
                <TextInput
                  style={styles.input}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="000000"
                  placeholderTextColor={colors.textDim}
                />
                <GradientButton
                  label={busy ? 'Verifying…' : 'Verify'}
                  onPress={onVerifyOtp}
                  disabled={busy || otp.length < 6}
                  loading={busy}
                />
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
                <Text style={styles.label}>First name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholderTextColor={colors.textDim}
                />
                <Text style={styles.label}>Last name</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholderTextColor={colors.textDim}
                />
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor={colors.textDim}
                />
                <Text style={styles.label}>Password</Text>
                <PasswordField value={password} onChangeText={setPassword} containerStyle={{ marginBottom: 4 }} />
                <Text style={styles.hint}>{PASSWORD_HINT}</Text>
                <GradientButton
                  label={busy ? 'Submitting…' : 'Create account'}
                  onPress={onSubmit}
                  disabled={busy}
                  loading={busy}
                />
              </>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </GlassCard>

          {onSignIn ? (
            <Pressable onPress={onSignIn} style={styles.signInLink}>
              <Text style={styles.signInText}>
                Already have an account? <Text style={styles.signInBold}>Sign in</Text>
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg },
  backBtn: { marginBottom: spacing.md, alignSelf: 'flex-start' },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: colors.textMuted, marginBottom: 8 },
  note: { color: colors.warning, fontSize: 13, marginBottom: 8, lineHeight: 20 },
  step: { color: colors.textMuted, marginBottom: 16 },
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
  signInLink: { marginTop: 20, alignItems: 'center' },
  signInText: { color: colors.textMuted },
  signInBold: { color: colors.primary, fontWeight: '700' },
});
