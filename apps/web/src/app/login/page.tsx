'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { ApiResponse, LoginResponse } from '@delivery/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { GuzoLogo } from '@/components/guzo-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { FilterChip } from '@/components/dashboard/futuristic-primitives';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

const DEMO = [
  ['Super Admin', 'superadmin@delivery.local'],
  ['Admin', 'admin@delivery.local'],
  ['Customer', 'customer@delivery.local'],
  ['Driver', 'driver@delivery.local'],
  ['Merchant', 'merchant@delivery.local'],
  ['Finance', 'finance@delivery.local'],
] as const;

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  useEffect(() => {
    if (hydrated && accessToken) router.replace('/dashboard');
  }, [hydrated, accessToken, router]);

  async function onSubmit(values: FormValues) {
    try {
      const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', values);
      if (!data.success) throw new Error(data.message);
      setSession(data.data.user, data.data.tokens);
      toast.success('Welcome back to GUZO');
      router.replace('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Login failed. Check your credentials.';
      toast.error(message);
    }
  }

  function quickFill(email: string) {
    setValue('email', email);
  }

  return (
    <main className="auth-shell grid min-h-screen lg:grid-cols-2">
      <div className="auth-orb -left-20 top-20 h-64 w-64 bg-guzo-primary/20" />
      <div className="auth-orb bottom-0 right-1/4 h-72 w-72 bg-emerald-500/10" />

      
      <div className="relative hidden flex-col justify-between border-r border-white/10 bg-white/[0.03] p-12 lg:flex">
        <div className="dashboard-grid absolute inset-0 opacity-40" />
        <GuzoLogo />
        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-guzo-primary/25 bg-guzo-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-guzo-primary">
            Enterprise logistics
          </div>
          <h2 className="text-4xl font-extrabold leading-tight text-white md:text-5xl">
            Moving Ethiopia
            <span className="block text-guzo-primary">Forward.</span>
          </h2>
          <p className="max-w-md text-slate-300">
            One platform for customers, drivers, merchants, warehouses and operations — real-time
            tracking, smart routing and enterprise control.
          </p>
        </div>
        <p className="relative text-sm text-slate-500" suppressHydrationWarning>
          © {new Date().getFullYear()} GUZO Logistics
        </p>
      </div>

      
      <div className="relative flex items-center justify-center p-6">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden">
            <GuzoLogo />
          </div>
          <Card className="border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <CardContent className="space-y-6 p-8">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-guzo-primary">Welcome back</p>
                <h1 className="text-2xl font-bold text-white">Sign in</h1>
                <p className="text-sm text-slate-400">Access your GUZO operations dashboard</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>

              <div className="space-y-3">
                <p className="text-center text-xs text-slate-400">Quick-fill demo emails (use your local seed password)</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {DEMO.map(([label, email]) => (
                    <FilterChip key={email} type="button" onClick={() => quickFill(email)}>
                      {label}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <p className="text-center text-sm text-slate-400">
                No account?{' '}
                <Link href="/register" className="font-medium text-guzo-primary hover:underline">
                  Create one
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
