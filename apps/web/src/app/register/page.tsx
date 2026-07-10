'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { ApiResponse, RegisterResponse } from '@delivery/types';
import { isRegisterPending } from '@delivery/types';
import { api } from '@/lib/api';
import { sendOtp, verifyOtp } from '@/lib/otp';
import { useAuthStore } from '@/lib/auth-store';
import { GuzoLogo } from '@/components/guzo-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PanelSelect } from '@/components/dashboard/futuristic-primitives';
import { getApiErrorMessage, passwordSchema, PASSWORD_HINT } from '@/lib/validation';
import { OTP_DEV_TERMINAL_HINT, useOtpResendCooldown } from '@/hooks/use-otp-resend';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(9, 'Phone required'),
  password: passwordSchema,
  role: z.enum(['CUSTOMER', 'MERCHANT', 'DRIVER', 'BRANCH_STAFF']),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [otp, setOtp] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const { canResend, startCooldown, countdownLabel } = useOtpResendCooldown();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', password: '', role: 'CUSTOMER' },
  });

  async function onSendOtp(isResend = false) {
    const phone = getValues('phone')?.trim();
    if (!phone) {
      toast.error('Enter your phone number first');
      return;
    }
    setOtpBusy(true);
    try {
      await sendOtp(phone);
      toast.success('OTP sent — check the API server terminal for your code');
      setStep(2);
      startCooldown();
      if (isResend) setOtp('');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to send OTP';
      toast.error(message);
    } finally {
      setOtpBusy(false);
    }
  }

  async function onVerifyOtp() {
    const phone = getValues('phone')?.trim();
    if (!phone || otp.length < 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setOtpBusy(true);
    try {
      await verifyOtp(phone, otp.trim());
      toast.success('Phone verified');
      setStep(3);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid OTP';
      toast.error(message);
    } finally {
      setOtpBusy(false);
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      const { data } = await api.post<ApiResponse<RegisterResponse>>('/auth/register', values);
      if (!data.success) throw new Error(data.message);
      if (isRegisterPending(data.data)) {
        toast.success(data.data.message);
        router.replace('/login');
        return;
      }
      setSession(data.data.user, data.data.tokens);
      toast.success('Account created — welcome to GUZO');
      router.replace('/dashboard');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Registration failed.'));
    }
  }

  return (
    <main className="auth-shell flex min-h-screen items-center justify-center p-6">
      <div className="auth-orb -left-16 top-16 h-56 w-56 bg-guzo-primary/20" />
      <div className="auth-orb bottom-10 right-10 h-64 w-64 bg-blue-500/10" />

      <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <GuzoLogo />
        </div>
        <Card className="border-border bg-muted/40 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-guzo-primary">Join GUZO</p>
              <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
              <p className="text-sm text-muted-foreground">Step {step} of 3</p>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input id="phone" {...register('phone')} placeholder="09…" />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <Button type="button" className="w-full" disabled={otpBusy} onClick={() => onSendOtp(false)}>
                  {otpBusy ? 'Sending…' : 'Send OTP'}
                </Button>
                <p className="text-xs text-muted-foreground">{OTP_DEV_TERMINAL_HINT}</p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Code sent to <span className="font-medium text-foreground">{getValues('phone')}</span>
                </p>
                <p className="text-xs text-muted-foreground">{OTP_DEV_TERMINAL_HINT}</p>
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} placeholder="000000" />
                </div>
                <Button type="button" className="w-full" disabled={otpBusy || otp.length < 6} onClick={onVerifyOtp}>
                  {otpBusy ? 'Verifying…' : 'Verify phone'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={otpBusy || !canResend}
                  onClick={() => onSendOtp(true)}
                >
                  {otpBusy ? 'Sending…' : canResend ? 'Send OTP again' : `Send again in ${countdownLabel}`}
                </Button>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" {...register('firstName')} />
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" {...register('lastName')} />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput id="password" {...register('password')} />
                  <p className="text-xs text-muted-foreground">{PASSWORD_HINT}</p>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">I am a</Label>
                  <PanelSelect id="role" {...register('role')}>
                    <option value="CUSTOMER">Customer — instant access</option>
                    <option value="MERCHANT">Merchant — requires admin approval</option>
                    <option value="DRIVER">Driver — requires admin approval</option>
                    <option value="BRANCH_STAFF">Branch staff — requires admin approval</option>
                  </PanelSelect>
                  <p className="text-xs text-muted-foreground">
                    Drivers, merchants, and branch staff cannot sign in until an admin activates the account.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-guzo-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
