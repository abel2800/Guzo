import { View, Text, StyleSheet } from 'react-native';
import { isOfflineMode } from '@guzo/mobile-shared';
import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const [offline, setOffline] = useState(isOfflineMode());

  useEffect(() => {
    const id = setInterval(() => setOffline(isOfflineMode()), 2000);
    return () => clearInterval(id);
  }, []);

  if (!offline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Offline — showing cached data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251,191,36,0.35)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: { color: '#fbbf24', fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
