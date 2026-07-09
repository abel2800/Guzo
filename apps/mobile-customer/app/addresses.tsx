import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listAddresses } from '@guzo/mobile-shared';
import { GlassCard } from '@guzo/mobile-ui';
import { colors, designStyles, spacing } from '@/lib/design';

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const { data = [], isLoading } = useQuery({ queryKey: ['addresses'], queryFn: listAddresses });

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Address book</Text>
        <View style={styles.back} />
      </View>
      <FlatList
        data={data}
        keyExtractor={(a) => a.id}
        contentContainerStyle={designStyles.screenPad}
        ListEmptyComponent={<Text style={styles.empty}>{isLoading ? 'Loading…' : 'No saved addresses'}</Text>}
        renderItem={({ item }) => (
          <GlassCard style={{ marginBottom: 10 }}>
            <Text style={styles.label}>{item.label ?? 'Address'}{item.isDefault ? ' · Default' : ''}</Text>
            <Text style={styles.line}>{item.line1}, {item.city}</Text>
          </GlassCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12 },
  back: { width: 40 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  label: { color: colors.text, fontWeight: '700' },
  line: { color: colors.textMuted, marginTop: 4 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});
