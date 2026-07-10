import { router } from 'expo-router';
import { ForgotPasswordScreen } from '@guzo/mobile-ui';

export default function MerchantForgotPasswordScreen() {
  return <ForgotPasswordScreen onBack={() => router.back()} onSuccess={() => router.replace('/login')} />;
}
