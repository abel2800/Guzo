import { router } from 'expo-router';
import { ProfileSettingsScreen } from '@guzo/mobile-ui';
import { useAuth } from '@/lib/auth';

export default function SettingsScreen() {
  const { user, updateUser } = useAuth();

  return (
    <ProfileSettingsScreen
      user={user}
      onUserUpdated={updateUser}
    />
  );
}
