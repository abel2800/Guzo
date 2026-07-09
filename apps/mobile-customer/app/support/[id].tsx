import { useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { addSupportMessage, getSupportTicket } from '@guzo/mobile-shared';
import { GradientButton, GlassCard } from '@guzo/mobile-ui';
import { colors, designStyles, radius, spacing } from '@/lib/design';

export default function SupportThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [body, setBody] = useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['support-ticket', id],
    queryFn: () => getSupportTicket(id!),
    enabled: !!id,
  });

  const reply = useMutation({
    mutationFn: () => addSupportMessage(id!, body.trim()),
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: ['support-ticket', id] });
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{ticket?.subject ?? 'Support'}</Text>
        <View style={styles.back} />
      </View>

      <FlatList
        data={ticket?.messages ?? []}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[designStyles.screenPad, { paddingBottom: 100 }]}
        ListHeaderComponent={
          ticket ? (
            <GlassCard style={{ marginBottom: 12 }}>
              <Text style={styles.ticketMeta}>{ticket.ticketNumber} · {ticket.status}</Text>
              <Text style={styles.category}>{ticket.category ?? 'GENERAL'}</Text>
            </GlassCard>
          ) : isLoading ? <Text style={styles.loading}>Loading…</Text> : null
        }
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.author?.id === ticket?.messages?.[0]?.author?.id ? styles.bubbleLeft : styles.bubbleRight]}>
            <Text style={styles.author}>{item.author?.firstName} {item.author?.lastName}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )}
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="Type a message…"
          placeholderTextColor={colors.textDim}
          multiline
        />
        <GradientButton label="Send" onPress={() => reply.mutate()} disabled={!body.trim() || reply.isPending} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12 },
  back: { width: 40 },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text },
  ticketMeta: { color: colors.textMuted, fontSize: 12 },
  category: { color: colors.primary, fontWeight: '700', marginTop: 4 },
  loading: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  bubble: { maxWidth: '85%', padding: 12, borderRadius: radius.md, marginBottom: 10 },
  bubbleLeft: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.06)' },
  bubbleRight: { alignSelf: 'flex-end', backgroundColor: 'rgba(34,197,94,0.15)' },
  author: { color: colors.textDim, fontSize: 10, fontWeight: '600', marginBottom: 4 },
  body: { color: colors.text },
  time: { color: colors.textDim, fontSize: 10, marginTop: 6 },
  composer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    color: colors.text,
    minHeight: 44,
    maxHeight: 100,
  },
});
