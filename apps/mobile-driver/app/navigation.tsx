import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listOrders, getDriverRoute } from '@guzo/mobile-shared';
import { GlassCard, LiveTrackingMap } from '@guzo/mobile-ui';
import { colors, designStyles } from '@/lib/design';

export default function NavigationScreen() {
  const insets = useSafeAreaInsets();
  const { data: deliveries } = useQuery({ queryKey: ['driver-active-nav'], queryFn: () => listOrders({ limit: 20 }) });
  const { data: route } = useQuery({ queryKey: ['driver-route'], queryFn: getDriverRoute, refetchInterval: 30_000 });

  const active = (deliveries?.items ?? []).find((o) => !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(o.status));
  const drop = active?.dropoffAddress;

  const mapStops = useMemo(() => {
    const stops = route?.stops ?? [];
    return stops
      .filter((s) => s.latitude != null && s.longitude != null)
      .map((s) => ({ latitude: s.latitude!, longitude: s.longitude!, title: `${s.type}: ${s.orderNumber}` }));
  }, [route]);

  const openMaps = () => {
    if (drop?.latitude != null && drop?.longitude != null) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${drop.latitude},${drop.longitude}`);
      return;
    }
    if (drop?.line1) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${drop.line1}, ${drop.city ?? ''}`)}`);
    }
  };

  return (
    <ScrollView style={[designStyles.screen, { paddingTop: insets.top }]} contentContainerStyle={designStyles.screenPad}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>
        <Text style={styles.title}>Navigation</Text>
        <View style={{ width: 24 }} />
      </View>

      {active ? (
        <>
          <GlassCard style={{ marginBottom: 16 }}>
            <Text style={styles.order}>{active.orderNumber}</Text>
            <Text style={styles.meta}>{active.status.replace(/_/g, ' ')}</Text>
            {drop ? <Text style={styles.addr}>{drop.line1}, {drop.city}</Text> : null}
            <Pressable style={styles.navBtn} onPress={openMaps}>
              <Ionicons name="navigate" size={18} color={colors.primary} />
              <Text style={styles.navText}>Open in Google Maps</Text>
            </Pressable>
            {drop?.contactPhone ? (
              <Pressable style={styles.navBtn} onPress={() => Linking.openURL(`tel:${drop.contactPhone}`)}>
                <Ionicons name="call" size={18} color={colors.primary} />
                <Text style={styles.navText}>Call receiver</Text>
              </Pressable>
            ) : null}
          </GlassCard>
          <LiveTrackingMap stops={mapStops.length ? mapStops : undefined} height={280} />
        </>
      ) : (
        <Text style={styles.empty}>No active delivery — accept a job first</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  order: { color: colors.text, fontWeight: '800', fontSize: 18 },
  meta: { color: colors.textMuted, marginTop: 4 },
  addr: { color: colors.text, marginTop: 8 },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  navText: { color: colors.primary, fontWeight: '700' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});
