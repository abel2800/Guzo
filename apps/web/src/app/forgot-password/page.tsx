'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ApiResponse } from '@delivery/types';
import { api } from '@/lib/api';
import { verifyOtp } from '@/lib/otp';
import { GuzoLogo } from '@/components/guzo-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { getApiErrorMessage, passwordSchema, PASSWORD_HINT } from '@/lib/validation';
import { OTP_DEV_TERMINAL_HINT, useOtpResendCooldown } from '@/hooks/use-otp-resend';

function parseIdentifier(value: string): { email?: string; phone?: string } {
  const trimmed = value.trim();
  if (trimmed.includes('@')) return { email: trimmed };
  return { phone: trimmed };
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifier, setIdentifier] = useState('');
  const [otpPhone, setOtpPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { canResend, startCooldown, countdownLabel } = useOtpResendCooldown();

  const parsed = parseIdentifier(identifier);

  async function onSendOtp(isResend = false) {
    if (!identifier.trim()) {
      toast.error('Enter your email or phone number');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post<ApiResponse<{ message: string; phone?: string }>>(
        '/auth/forgot-password',
        parsed,
      );
      if (!data.success) throw new Error(data.message);
      if (data.data.phone) {
        setOtpPhone(data.data.phone);
        setStep(2);
        startCooldown();
        if (isResend) setOtp('');
      } else {
        toast.success(data.data.message);
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Could not send OTP.'));
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyOtp() {
    if (!otpPhone || otp.length < 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setBusy(true);
    try {
      await verifyOtp(otpPhone, otp.trim());
      toast.success('Verified — choose a new password');
      setStep(3);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Invalid OTP'));
    } finally {
      setBusy(false);
    }
  }

  async function onResetPassword() {
    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedPassword.success) {
      toast.error(parsedPassword.error.issues[0]?.message ?? 'Invalid password');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const resetTarget = otpPhone ? { phone: otpPhone } : parsed;
      const { data } = await api.post<ApiResponse<{ message: string }>>('/auth/reset-password', {
        ...resetTarget,
        password,
      });
      if (!data.success) throw new Error(data.message);
      toast.success('Password updated');
      router.replace('/login');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Reset failed.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <GuzoLogo />
        </div>
        <Card>
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-foreground">Forgot password</h1>
              <p className="text-sm text-muted-foreground">
                Step {step} of 3 — {step === 1 ? 'Account' : step === 2 ? 'Verify OTP' : 'New password'}
              </p>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email or phone</Label>
                  <Input
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@email.com or 09…"
                    autoComplete="username"
                  />
                </div>
                <Button type="button" className="w-full" disabled={busy || !identifier.trim()} onClick={() => onSendOtp(false)}>
                  {busy ? 'Sending…' : 'Send OTP'}
                </Button>
                <p className="text-xs text-muted-foreground">{OTP_DEV_TERMINAL_HINT}</p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter the code sent to {otpPhone || 'your registered phone'}.
                </p>
                <p className="text-xs text-muted-foreground">{OTP_DEV_TERMINAL_HINT}</p>
                <div className="space-y-2">
                  <Label htmlFor="otp">6-digit code</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    placeholder="000000"
                  />
                </div>
                <Button type="button" className="w-full" disabled={busy || otp.length < 6 || !otpPhone} onClick={onVerifyOtp}>
                  {busy ? 'Verifying…' : 'Verify'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={busy || !canResend}
                  onClick={() => onSendOtp(true)}
                >
                  {canResend ? 'Send OTP again' : `Send again in ${countdownLabel}`}
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <p className="text-xs text-muted-foreground">{PASSWORD_HINT}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <PasswordInput
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button type="button" className="w-full" disabled={busy} onClick={onResetPassword}>
                  {busy ? 'Saving…' : 'Reset password'}
                </Button>
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-guzo-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
