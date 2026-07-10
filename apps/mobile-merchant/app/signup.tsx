import { router } from 'expo-router';
import { SignupScreen } from '@guzo/mobile-ui';
import { useAuth } from '@/lib/auth';

export default function MerchantSignupScreen() {
  const { completeSession } = useAuth();

  return (
    <SignupScreen
      role="MERCHANT"
      onSuccess={async (res) => {
        await completeSession(res);
        router.replace('/(tabs)/dashboard');
      }}
      onSignIn={() => router.replace('/login')}
    />
  );
}
