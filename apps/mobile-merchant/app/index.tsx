import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { theme } from '@/lib/theme';

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}><ActivityIndicator color={theme.primary} /></View>;
  if (!user?.roles.includes('MERCHANT')) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)/dashboard" />;
}
