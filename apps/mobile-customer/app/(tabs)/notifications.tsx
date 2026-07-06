import { View, Text, FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { listNotifications, markNotificationRead } from '@guzo/mobile-shared';
import { GlassCard } from '@guzo/mobile-ui';
import { colors, designStyles, radius, spacing } from '@/lib/design';

function alertStyle(type?: string) {
  if (type?.includes('DELIVER')) return { icon: 'checkmark-circle' as const, color: colors.success, bg: 'rgba(34,197,94,0.12)' };
  if (type?.includes('DELAY') || type?.includes('FAIL')) return { icon: 'warning' as const, color: colors.warning, bg: 'rgba(251,191,36,0.12)' };
  if (type?.includes('PROMO')) return { icon: 'gift' as const, color: colors.accentPurple, bg: 'rgba(139,92,246,0.12)' };
  return { icon: 'information-circle' as const, color: colors.info, bg: 'rgba(56,189,248,0.12)' };
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => listNotifications({ limit: 50 }),
  });

  const readMut = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = data?.items.filter((n) => !n.readAt).length ?? 0;

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        {unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unread} new</Text>
          </View>
        )}
      </View>

      <FlatList
        contentContainerStyle={[designStyles.screenPad, { paddingTop: spacing.sm }]}
        data={data?.items ?? []}
        keyExtractor={(n) => n.id}
        refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textDim} />
            <Text style={styles.emptyText}>No alerts yet</Text>
            <Text style={styles.emptySub}>Order updates will appear here</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const style = alertStyle(item.type);
          const isLast = index === (data?.items.length ?? 0) - 1;
          return (
            <View style={styles.timelineRow}>
              <View style={styles.timelineCol}>
                <View style={[styles.timelineDot, { backgroundColor: style.color }]} />
                {!isLast && <View style={styles.timelineLine} />}
              </View>
              <Pressable style={{ flex: 1, marginBottom: 12 }} onPress={() => !item.readAt && readMut.mutate(item.id)}>
                <GlassCard glow={!item.readAt} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconWrap, { backgroundColor: style.bg }]}>
                      <Ionicons name={style.icon} size={20} color={style.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardTime}>{new Date(item.createdAt).toLocaleString()}</Text>
                    </View>
                    {!item.readAt && <View style={styles.newDot} />}
                  </View>
                  <Text style={styles.cardBody}>{item.body}</Text>
                </GlassCard>
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.lg, paddingVertical: 16 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  unreadBadge: { backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  unreadText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineCol: { alignItems: 'center', width: 16, paddingTop: 20 },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  timelineLine: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4 },
  card: { marginBottom: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  cardTime: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  cardBody: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  newDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySub: { color: colors.textDim, fontSize: 14, marginTop: 4 },
});
