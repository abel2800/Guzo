import { useState } from 'react';
import {
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
  requestPasswordReset,
  resetPasswordWithOtp,
  verifyOtp,
  validatePassword,
  PASSWORD_HINT,
  OTP_DEV_TERMINAL_HINT,
  useOtpResendCooldown,
} from '@guzo/mobile-shared';
import { GradientButton } from './gradient-button';
import { GlassCard } from './glass-card';
import { PasswordField } from './password-field';
import { colors, gradients, radius, spacing } from './design';

type Props = {
  onBack?: () => void;
  onSuccess?: () => void;
};

function parseIdentifier(value: string): { email?: string; phone?: string } {
  const trimmed = value.trim();
  if (trimmed.includes('@')) return { email: trimmed };
  return { phone: trimmed };
}

export function ForgotPasswordScreen({ onBack, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifier, setIdentifier] = useState('');
  const [otpPhone, setOtpPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { canResend, startCooldown, countdownLabel } = useOtpResendCooldown();

  const parsed = parseIdentifier(identifier);

  async function onSendOtp(isResend = false) {
    setError('');
    if (!identifier.trim()) {
      setError('Enter your email or phone number.');
      return;
    }
    setBusy(true);
    try {
      const res = await requestPasswordReset(parsed);
      if (!res.phone) {
        Alert.alert('Request received', res.message);
        return;
      }
      setOtpPhone(res.phone);
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
    if (!otpPhone) {
      setError('Request a verification code first.');
      return;
    }
    setBusy(true);
    try {
      await verifyOtp(otpPhone, otp.trim());
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    } finally {
      setBusy(false);
    }
  }

  async function onResetPassword() {
    setError('');
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    setBusy(true);
    try {
      const resetTarget = otpPhone ? { phone: otpPhone } : parsed;
      await resetPasswordWithOtp({ ...resetTarget, password });
      Alert.alert('Password updated', 'You can sign in with your new password.', [
        { text: 'OK', onPress: () => (onSuccess ?? onBack)?.() },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setBusy(false);
    }
  }

  const stepLabel = step === 1 ? 'Account' : step === 2 ? 'Verify OTP' : 'New password';

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

          <Text style={styles.title}>Forgot password</Text>
          <Text style={styles.subtitle}>Step {step} of 3 — {stepLabel}</Text>

          <GlassCard style={styles.card}>
            {step === 1 && (
              <>
                <Text style={styles.label}>Email or phone</Text>
                <TextInput
                  style={styles.input}
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="you@email.com or 09…"
                  placeholderTextColor={colors.textDim}
                />
                <GradientButton
                  label={busy ? 'Sending…' : 'Send OTP'}
                  onPress={() => onSendOtp(false)}
                  disabled={busy || !identifier.trim()}
                  loading={busy}
                />
                <Text style={styles.devHint}>{OTP_DEV_TERMINAL_HINT}</Text>
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.label}>
                  Enter 6-digit code{otpPhone ? ` sent to ${otpPhone}` : ''}
                </Text>
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
                  disabled={busy || otp.length < 6 || !otpPhone}
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
                <Text style={styles.label}>New password</Text>
                <PasswordField value={password} onChangeText={setPassword} containerStyle={{ marginBottom: 4 }} />
                <Text style={styles.hint}>{PASSWORD_HINT}</Text>
                <GradientButton
                  label={busy ? 'Saving…' : 'Reset password'}
                  onPress={onResetPassword}
                  disabled={busy || !password}
                  loading={busy}
                />
              </>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  backBtn: { marginBottom: spacing.md, alignSelf: 'flex-start' },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: colors.textMuted, marginBottom: 16 },
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
