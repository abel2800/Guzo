import { router } from 'expo-router';
import { SignupScreen } from '@guzo/mobile-ui';
import { useAuth } from '@/lib/auth';

export default function DriverSignupScreen() {
  const { completeSession } = useAuth();

  return (
    <SignupScreen
      role="DRIVER"
      onSuccess={async (res) => {
        await completeSession(res);
        router.replace('/(tabs)/jobs');
      }}
      onSignIn={() => router.replace('/login')}
    />
  );
}
