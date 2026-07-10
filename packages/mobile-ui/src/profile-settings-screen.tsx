import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthUser } from '@delivery/types';
import {
  changePassword,
  getProfile,
  updateProfile,
  uploadAvatar,
} from '@guzo/mobile-shared';
import { GlassCard } from './glass-card';
import { PasswordField } from './password-field';
import { colors, designStyles, radius, spacing } from './design';

type Props = {
  user: AuthUser | null;
  onUserUpdated: (user: AuthUser) => void;
  onBack?: () => void;
};

const GENDERS = [
  { value: 'UNSPECIFIED', label: 'Prefer not to say' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
] as const;

export function ProfileSettingsScreen({ user, onUserUpdated, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [gender, setGender] = useState<typeof GENDERS[number]['value']>(
    (user?.gender as typeof GENDERS[number]['value']) ?? 'UNSPECIFIED',
  );
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    initialData: user ?? undefined,
  });

  const saveProfile = useMutation({
    mutationFn: () =>
      updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
        gender,
      }),
    onSuccess: (updated) => {
      onUserUpdated(updated);
      queryClient.setQueryData(['profile'], updated);
      Alert.alert('Saved', 'Your profile has been updated.');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const savePassword = useMutation({
    mutationFn: () => {
      if (newPassword.length < 8) throw new Error('Password must be at least 8 characters');
      if (newPassword !== confirmPassword) throw new Error('Passwords do not match');
      return changePassword({ currentPassword, newPassword });
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Saved', 'Password updated successfully.');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const avatarUpload = useMutation({
    mutationFn: async () => {
      const ImagePicker = await import('expo-image-picker');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Photo library permission is required');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return null;
      const asset = result.assets[0];
      return uploadAvatar(asset.uri, asset.fileName ?? 'avatar.jpg', asset.mimeType ?? 'image/jpeg');
    },
    onSuccess: (updated) => {
      if (!updated) return;
      onUserUpdated(updated);
      queryClient.setQueryData(['profile'], updated);
      Alert.alert('Saved', 'Profile photo updated.');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const displayUser = profile ?? user;
  const initials =
    `${displayUser?.firstName?.[0] ?? ''}${displayUser?.lastName?.[0] ?? ''}`.toUpperCase() || 'GU';

  return (
    <ScrollView
      style={[designStyles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={[designStyles.screenPad, { paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      {onBack ? (
        <Pressable style={styles.backRow} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
          <Text style={styles.backText}>Back to profile</Text>
        </Pressable>
      ) : null}

      <Text style={styles.title}>Profile & settings</Text>
      <Text style={styles.subtitle}>Update your personal details, photo, and security preferences.</Text>

      <GlassCard style={styles.avatarCard}>
        <Pressable style={styles.avatarBtn} onPress={() => avatarUpload.mutate()} disabled={avatarUpload.isPending}>
          {displayUser?.avatarUrl ? (
            <Image source={{ uri: displayUser.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.cameraBadge}>
            {avatarUpload.isPending ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Ionicons name="camera" size={16} color={colors.text} />
            )}
          </View>
        </Pressable>
        <Text style={styles.avatarHint}>Tap to change photo</Text>
      </GlassCard>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
      ) : (
        <>
          <Text style={styles.sectionLabel}>Personal details</Text>
          <GlassCard style={styles.formCard}>
            <Field label="First name" value={firstName} onChangeText={setFirstName} />
            <Field label="Last name" value={lastName} onChangeText={setLastName} />
            <Field label="Email" value={displayUser?.email ?? ''} editable={false} />
            <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((g) => (
                <Pressable
                  key={g.value}
                  style={[styles.genderChip, gender === g.value && styles.genderChipActive]}
                  onPress={() => setGender(g.value)}
                >
                  <Text style={[styles.genderText, gender === g.value && styles.genderTextActive]}>{g.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={[styles.saveBtn, saveProfile.isPending && styles.saveBtnDisabled]}
              onPress={() => saveProfile.mutate()}
              disabled={saveProfile.isPending}
            >
              {saveProfile.isPending ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.saveBtnText}>Save changes</Text>
              )}
            </Pressable>
          </GlassCard>

          <Text style={styles.sectionLabel}>Security</Text>
          <GlassCard style={styles.formCard}>
            <PasswordField
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              containerStyle={styles.field}
            />
            <PasswordField
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              containerStyle={styles.field}
            />
            <PasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              containerStyle={styles.field}
            />
            <Pressable
              style={[styles.saveBtn, savePassword.isPending && styles.saveBtnDisabled]}
              onPress={() => savePassword.mutate()}
              disabled={savePassword.isPending}
            >
              {savePassword.isPending ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.saveBtnText}>Update password</Text>
              )}
            </Pressable>
          </GlassCard>
        </>
      )}
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  editable = true,
  secureTextEntry,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  editable?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textDim}
        autoCapitalize={secureTextEntry ? 'none' : 'words'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.md },
  backText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: 6, marginBottom: spacing.lg, lineHeight: 20 },
  avatarCard: { alignItems: 'center', marginBottom: spacing.lg, paddingVertical: spacing.lg },
  avatarBtn: { position: 'relative' },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(34,197,94,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 32, fontWeight: '800', color: colors.text },
  cameraBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  avatarHint: { color: colors.textMuted, fontSize: 13, marginTop: 10 },
  sectionLabel: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  formCard: { marginBottom: spacing.lg, gap: 4 },
  field: { marginBottom: 12 },
  fieldLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  inputDisabled: { opacity: 0.65 },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  genderChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  genderChipActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.12)' },
  genderText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  genderTextActive: { color: colors.primary },
  saveBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: colors.bg, fontWeight: '800', fontSize: 15 },
});
