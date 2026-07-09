import { View, Text, FlatList, Pressable, StyleSheet, Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listBranches, type Branch } from '@guzo/mobile-shared';
import { GlassCard } from '@guzo/mobile-ui';
import { colors, designStyles, radius, spacing } from '@/lib/design';

const QUEUE_LABELS = ['Quiet', 'Moderate', 'Busy', 'Very busy'];

export default function BranchesScreen() {
  const insets = useSafeAreaInsets();
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => listBranches(),
  });

  const first = branches.find((b) => b.latitude && b.longitude);

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Branch finder</Text>
        <View style={styles.back} />
      </View>

      {first?.latitude && first.longitude ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: first.latitude,
            longitude: first.longitude,
            latitudeDelta: 0.15,
            longitudeDelta: 0.15,
          }}
        >
          {branches
            .filter((b) => b.latitude && b.longitude)
            .map((b) => (
              <Marker
                key={b.id}
                coordinate={{ latitude: b.latitude!, longitude: b.longitude! }}
                title={b.name}
                description={b.line1}
              />
            ))}
        </MapView>
      ) : null}

      <FlatList
        data={branches}
        keyExtractor={(b) => b.id}
        contentContainerStyle={designStyles.screenPad}
        ListEmptyComponent={
          <Text style={styles.empty}>{isLoading ? 'Loading branches…' : 'No branches found'}</Text>
        }
        renderItem={({ item }) => <BranchCard branch={item} />}
      />
    </View>
  );
}

function BranchCard({ branch }: { branch: Branch }) {
  const queue = QUEUE_LABELS[Math.min(branch.queueLevel, 3)] ?? 'Unknown';
  return (
    <GlassCard style={styles.card}>
      <Text style={styles.name}>{branch.name}</Text>
      <Text style={styles.meta}>{branch.line1}, {branch.city}</Text>
      <Text style={styles.meta}>Hours: {branch.openingHours ?? '—'}</Text>
      <View style={styles.row}>
        <View style={styles.queueBadge}>
          <Text style={styles.queueText}>Queue: {queue}</Text>
        </View>
        {branch.phone ? (
          <Pressable onPress={() => Linking.openURL(`tel:${branch.phone}`)}>
            <Ionicons name="call-outline" size={20} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12 },
  back: { width: 40 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  map: { height: 200, marginHorizontal: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.sm },
  card: { marginBottom: 12 },
  name: { color: colors.text, fontWeight: '800', fontSize: 16 },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  queueBadge: { backgroundColor: 'rgba(34,197,94,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  queueText: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});
