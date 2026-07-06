import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { trackOrder } from '@guzo/mobile-shared';
import { theme } from '@/lib/theme';

/**
 * Deep link entry: guzo-customer://track/GZ-28491
 * Resolves public tracking ref → navigates to order detail.
 */
export default function TrackDeepLinkScreen() {
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ref) return;
    trackOrder(decodeURIComponent(ref))
      .then((order) => router.replace(`/order/${order.id}`))
      .catch(() => setError('Shipment not found'));
  }, [ref]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg, padding: 24 }}>
        <Text style={{ color: '#ef4444', textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
      <ActivityIndicator color={theme.primary} size="large" />
      <Text style={{ color: theme.muted, marginTop: 12 }}>Loading shipment…</Text>
    </View>
  );
}
