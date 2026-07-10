'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { ApiResponse } from '@delivery/types';
import { api } from '@/lib/api';
import { GuzoLogo } from '@/components/guzo-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { getApiErrorMessage, passwordSchema, PASSWORD_HINT } from '@/lib/validation';

const schema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) router.replace('/forgot-password');
  }, [token, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    if (!token) {
      toast.error('Reset link is invalid or expired.');
      return;
    }
    try {
      const { data } = await api.post<ApiResponse<{ message: string }>>('/auth/reset-password', {
        token,
        password: values.password,
      });
      if (!data.success) throw new Error(data.message);
      setDone(true);
      toast.success('Password updated');
      setTimeout(() => router.replace('/login'), 1500);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Reset failed.'));
    }
  }

  return (
    <Card>
      <CardContent className="space-y-6 p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">Set new password</h1>
          <p className="text-sm text-muted-foreground">
            {done ? 'Redirecting to sign in…' : 'Choose a strong new password for your account.'}
          </p>
        </div>
        {!done && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <PasswordInput id="password" {...register('password')} />
              <p className="text-xs text-muted-foreground">{PASSWORD_HINT}</p>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <PasswordInput id="confirmPassword" {...register('confirmPassword')} />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || !token}>
              {isSubmitting ? 'Saving…' : 'Update password'}
            </Button>
            {!token && <p className="text-xs text-destructive">Missing reset token in the link.</p>}
          </form>
        )}
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-guzo-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="auth-shell flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <GuzoLogo />
        </div>
        <Suspense fallback={<Card><CardContent className="p-8">Loading…</CardContent></Card>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
