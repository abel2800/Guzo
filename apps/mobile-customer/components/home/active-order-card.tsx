import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Order } from '@guzo/mobile-shared';
import { ORDER_STATUS_LABELS } from '@guzo/mobile-shared';
import { GlassCard } from '@guzo/mobile-ui';
import { colors, radius } from '@/lib/design';

const STEPS = ['Pickup', 'In transit', 'Delivered'];

function progressForStatus(status: string): number {
  if (status === 'DELIVERED') return 3;
  if (['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PICKED_UP'].includes(status)) return 2;
  if (['CONFIRMED', 'ASSIGNED', 'ACCEPTED'].includes(status)) return 1;
  return 0;
}

export function ActiveOrderCard({ order }: { order: Order }) {
  const step = progressForStatus(order.status);

  return (
    <Pressable onPress={() => router.push(`/order/${order.id}`)}>
      <GlassCard glow>
        <View style={styles.header}>
          <View>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.live}>LIVE</Text>
            </View>
            <Text style={styles.ref}>{order.orderNumber}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{ORDER_STATUS_LABELS[order.status] ?? order.status}</Text>
          </View>
        </View>

        <View style={styles.route}>
          <Ionicons name="location" size={14} color={colors.primary} />
          <Text style={styles.routeText} numberOfLines={1}>
            {order.pickupAddress.city} → {order.dropoffAddress.city}
          </Text>
        </View>

        <View style={styles.progress}>
          {STEPS.map((label, i) => (
            <View key={label} style={styles.stepCol}>
              <View style={[styles.stepDot, i < step && styles.stepDotDone, i === step - 1 && styles.stepDotCurrent]} />
              <Text style={[styles.stepLabel, i < step && styles.stepLabelDone]}>{label}</Text>
            </View>
          ))}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>
        </View>

        <View style={styles.mapPreview}>
          <Ionicons name="map" size={20} color={colors.accent} />
          <Text style={styles.mapText}>Tap to track on live map</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  liveRow: { flexDirection: 'row', alignItems: 'center' },
  live: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginRight: 4 },
  ref: { color: colors.text, fontWeight: '800', fontSize: 17, marginTop: 4 },
  badge: { backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  route: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  routeText: { color: colors.textMuted, fontSize: 13, flex: 1 },
  progress: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, position: 'relative' },
  stepCol: { alignItems: 'center', flex: 1, zIndex: 1 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border, marginBottom: 4 },
  stepDotDone: { backgroundColor: colors.primary },
  stepDotCurrent: { width: 14, height: 14, borderRadius: 7, marginTop: -2 },
  stepLabel: { fontSize: 9, color: colors.textDim, fontWeight: '600' },
  stepLabelDone: { color: colors.textMuted },
  progressTrack: {
    position: 'absolute',
    top: 4,
    left: '16%',
    right: '16%',
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 1 },
  mapPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6,182,212,0.08)',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.2)',
  },
  mapText: { flex: 1, color: colors.accent, fontSize: 13, fontWeight: '600' },
});
