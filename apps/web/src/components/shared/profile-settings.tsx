'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Loader2, MapPin, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import {
  changePassword,
  getProfile,
  updateProfile,
  updateProfileLocation,
  uploadAvatar,
} from '@/lib/profile';
import { useAuthStore } from '@/lib/auth-store';
import { initials } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { FuturisticHero, PanelSelect } from '@/components/dashboard/futuristic-primitives';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED']),
});

const locationSchema = z.object({
  label: z.string().optional(),
  line1: z.string().min(1, 'Street address is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'At least 8 characters').regex(/\d/, 'Include a number'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type LocationForm = z.infer<typeof locationSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export function ProfileSettings() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone ?? '',
          gender: (profile.gender as ProfileForm['gender']) ?? 'UNSPECIFIED',
        }
      : undefined,
  });

  const locationForm = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    values: profile?.defaultAddress
      ? {
          label: profile.defaultAddress.label ?? 'Primary',
          line1: profile.defaultAddress.line1,
          line2: profile.defaultAddress.line2 ?? '',
          city: profile.defaultAddress.city,
          state: profile.defaultAddress.state ?? '',
          postalCode: profile.defaultAddress.postalCode ?? '',
          country: profile.defaultAddress.country ?? 'ET',
        }
      : { label: 'Primary', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'ET' },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  function syncUser(next: Awaited<ReturnType<typeof getProfile>>) {
    setUser({
      id: next.id,
      email: next.email,
      firstName: next.firstName,
      lastName: next.lastName,
      phone: next.phone,
      gender: next.gender,
      avatarUrl: next.avatarUrl,
      roles: next.roles,
      permissions: next.permissions,
    });
    queryClient.setQueryData(['profile'], next);
    queryClient.invalidateQueries({ queryKey: ['me'] });
  }

  const saveProfile = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      syncUser(data);
      toast.success('Profile updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveLocation = useMutation({
    mutationFn: updateProfileLocation,
    onSuccess: (data) => {
      syncUser(data);
      toast.success('Location saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const savePassword = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password changed');
      passwordForm.reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const avatarMut = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (data) => {
      syncUser(data);
      setAvatarPreview(null);
      toast.success('Profile picture updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onPickAvatar(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
    avatarMut.mutate(file);
  }

  if (isLoading || !profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-[28px]" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const avatarSrc = avatarPreview ?? profile.avatarUrl ?? undefined;

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Account settings"
        icon={User}
        title="Profile & Settings"
        description="Manage your identity, contact details, primary location, and account security from one place."
        stats={[
          { label: 'Roles', value: `${profile.roles.length} assigned` },
          { label: 'Member since', value: new Date(profile.createdAt).toLocaleDateString() },
          { label: 'Security', value: 'Password + avatar' },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
            <div className="relative">
              <Avatar className="h-28 w-28 border-2 border-guzo-primary/30">
                {avatarSrc ? <AvatarImage src={avatarSrc} alt="Profile" /> : null}
                <AvatarFallback className="bg-guzo-primary/15 text-2xl text-guzo-primary">
                  {initials(profile.firstName, profile.lastName)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={avatarMut.isPending}
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-guzo-primary text-white shadow-lg"
                aria-label="Upload profile picture"
              >
                {avatarMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => onPickAvatar(e.target.files?.[0])}
              />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                {profile.firstName} {profile.lastName}
              </p>
              <p className="text-sm text-slate-400">{profile.email}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {profile.roles.map((r) => (
                <Badge key={r} variant="secondary">
                  {r.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5 text-guzo-primary" /> Personal information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={profileForm.handleSubmit((v) =>
                  saveProfile.mutate({
                    firstName: v.firstName,
                    lastName: v.lastName,
                    phone: v.phone?.trim() || null,
                    gender: v.gender,
                  }),
                )}
              >
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" {...profileForm.register('firstName')} />
                  {profileForm.formState.errors.firstName && (
                    <p className="text-xs text-destructive">{profileForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" {...profileForm.register('lastName')} />
                  {profileForm.formState.errors.lastName && (
                    <p className="text-xs text-destructive">{profileForm.formState.errors.lastName.message}</p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} disabled className="opacity-70" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input id="phone" placeholder="+251 9XX XXX XXX" {...profileForm.register('phone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <PanelSelect id="gender" {...profileForm.register('gender')}>
                    <option value="UNSPECIFIED">Prefer not to say</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </PanelSelect>
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={saveProfile.isPending}>
                    {saveProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <MapPin className="h-5 w-5 text-guzo-primary" /> Primary location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={locationForm.handleSubmit((v) => saveLocation.mutate(v))}
              >
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="label">Label</Label>
                  <Input id="label" placeholder="Home, Office..." {...locationForm.register('label')} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="line1">Street address</Label>
                  <Input id="line1" {...locationForm.register('line1')} />
                  {locationForm.formState.errors.line1 && (
                    <p className="text-xs text-destructive">{locationForm.formState.errors.line1.message}</p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="line2">Address line 2</Label>
                  <Input id="line2" {...locationForm.register('line2')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...locationForm.register('city')} />
                  {locationForm.formState.errors.city && (
                    <p className="text-xs text-destructive">{locationForm.formState.errors.city.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State / region</Label>
                  <Input id="state" {...locationForm.register('state')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal code</Label>
                  <Input id="postalCode" {...locationForm.register('postalCode')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" {...locationForm.register('country')} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={saveLocation.isPending}>
                    {saveLocation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save location
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-guzo-primary" /> Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid max-w-md gap-4"
                onSubmit={passwordForm.handleSubmit((v) =>
                  savePassword.mutate({
                    currentPassword: v.currentPassword,
                    newPassword: v.newPassword,
                  }),
                )}
              >
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" variant="outline" disabled={savePassword.isPending}>
                  {savePassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Change password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
