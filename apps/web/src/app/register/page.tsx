'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { ApiResponse, LoginResponse } from '@delivery/types';
import { api } from '@/lib/api';
import { sendOtp, verifyOtp } from '@/lib/otp';
import { useAuthStore } from '@/lib/auth-store';
import { GuzoLogo } from '@/components/guzo-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PanelSelect } from '@/components/dashboard/futuristic-primitives';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(9, 'Phone required for customers'),
  password: z.string().min(8, 'At least 8 characters').regex(/\d/, 'Include a number'),
  role: z.enum(['CUSTOMER', 'MERCHANT', 'DRIVER']),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [otp, setOtp] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', password: '', role: 'CUSTOMER' },
  });

  async function onSendOtp() {
    const phone = getValues('phone')?.trim();
    if (!phone) {
      toast.error('Enter your phone number first');
      return;
    }
    setOtpBusy(true);
    try {
      await sendOtp(phone);
      toast.success('OTP sent — check server logs in dev');
      setStep(2);
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
      const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/register', values);
      if (!data.success) throw new Error(data.message);
      setSession(data.data.user, data.data.tokens);
      toast.success('Account created — welcome to GUZO');
      router.replace('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed.';
      toast.error(message);
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
        <Card className="border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-guzo-primary">Join GUZO</p>
              <h1 className="text-2xl font-bold text-white">Create your account</h1>
              <p className="text-sm text-slate-400">Step {step} of 3</p>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input id="phone" {...register('phone')} placeholder="09…" />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <Button type="button" className="w-full" disabled={otpBusy} onClick={onSendOtp}>
                  {otpBusy ? 'Sending…' : 'Send OTP'}
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} placeholder="000000" />
                </div>
                <Button type="button" className="w-full" disabled={otpBusy || otp.length < 6} onClick={onVerifyOtp}>
                  {otpBusy ? 'Verifying…' : 'Verify phone'}
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
                  <Input id="password" type="password" {...register('password')} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">I am a</Label>
                  <PanelSelect id="role" {...register('role')}>
                    <option value="CUSTOMER">Customer</option>
                    <option value="MERCHANT">Merchant</option>
                    <option value="DRIVER">Driver</option>
                  </PanelSelect>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-slate-400">
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
