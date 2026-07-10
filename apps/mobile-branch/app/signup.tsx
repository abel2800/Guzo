import { router } from 'expo-router';
import { SignupScreen } from '@guzo/mobile-ui';

export default function BranchSignupScreen() {
  return (
    <SignupScreen
      role="BRANCH_STAFF"
      onSuccess={() => router.replace('/login')}
      onSignIn={() => router.replace('/login')}
    />
  );
}
