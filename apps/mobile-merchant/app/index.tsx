import { Redirect } from 'expo-router';
import { GuzoSplashLoading } from '@guzo/mobile-ui';
import { useAuth } from '@/lib/auth';

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return <GuzoSplashLoading splashSource={require('@/assets/splash.png')} />;
  if (!user?.roles.includes('MERCHANT')) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)/dashboard" />;
}
