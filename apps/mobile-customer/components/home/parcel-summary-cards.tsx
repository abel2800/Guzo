import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { CustomerSummary } from '@guzo/mobile-shared';
import { GlassCard } from '@guzo/mobile-ui';
import { colors, radius, spacing } from '@/lib/design';

const CARDS = [
  { key: 'active', label: 'Active', icon: 'radio-outline' as const, color: colors.primary, filter: 'active' },
  { key: 'incoming', label: 'Incoming', icon: 'download-outline' as const, color: '#38bdf8', filter: 'incoming' },
  { key: 'readyForPickup', label: 'Ready', icon: 'hand-left-outline' as const, color: '#fbbf24', filter: 'ready' },
  { key: 'delivered', label: 'Delivered', icon: 'checkmark-circle-outline' as const, color: colors.accent, filter: 'delivered' },
  { key: 'draft', label: 'Draft', icon: 'document-outline' as const, color: colors.textMuted, filter: 'draft' },
] as const;

interface Props {
  parcels?: CustomerSummary['parcels'];
}

export function ParcelSummaryCards({ parcels }: Props) {
  return (
    <View style={styles.grid}>
      {CARDS.map((card) => {
        const count = parcels?.[card.key as keyof NonNullable<CustomerSummary['parcels']>] ?? 0;
        return (
          <Pressable
            key={card.key}
            style={styles.cell}
            onPress={() => router.push({ pathname: '/(tabs)/orders', params: { filter: card.filter } })}
          >
            <GlassCard style={styles.card}>
              <Ionicons name={card.icon} size={20} color={card.color} />
              <Text style={styles.count}>{count}</Text>
              <Text style={styles.label}>{card.label}</Text>
            </GlassCard>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.md },
  cell: { width: '31%', flexGrow: 1 },
  card: { alignItems: 'center', paddingVertical: 14, gap: 4, minHeight: 88 },
  count: { color: colors.text, fontSize: 22, fontWeight: '800' },
  label: { color: colors.textMuted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
});
