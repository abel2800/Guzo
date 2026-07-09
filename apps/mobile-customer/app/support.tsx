import { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createSupportTicket, listSupportTickets } from '@guzo/mobile-shared';
import { GlassCard, GradientButton } from '@guzo/mobile-ui';
import { colors, designStyles, radius, spacing } from '@/lib/design';

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('GENERAL');

  const { data } = useQuery({ queryKey: ['support-tickets'], queryFn: () => listSupportTickets({ limit: 20 }) });
  const createMut = useMutation({
    mutationFn: () => createSupportTicket({ subject, message: body, category }),
    onSuccess: () => {
      setSubject('');
      setBody('');
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Support</Text>
        <View style={styles.back} />
      </View>
      <FlatList
        ListHeaderComponent={
          <GlassCard style={{ marginBottom: 16 }}>
            <Text style={styles.label}>New ticket</Text>
            <View style={styles.catRow}>
              {['GENERAL', 'DAMAGED', 'MISSING', 'REFUND'].map((c) => (
                <Pressable key={c} onPress={() => setCategory(c)} style={[styles.cat, category === c && styles.catActive]}>
                  <Text style={[styles.catText, category === c && styles.catTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="Subject" placeholderTextColor={colors.textDim} />
            <TextInput style={[styles.input, { minHeight: 80 }]} value={body} onChangeText={setBody} placeholder="Describe the issue" placeholderTextColor={colors.textDim} multiline />
            <GradientButton label="Submit" onPress={() => createMut.mutate()} disabled={!subject || !body || createMut.isPending} />
          </GlassCard>
        }
        data={data?.items ?? []}
        keyExtractor={(t) => t.id}
        contentContainerStyle={designStyles.screenPad}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/support/${item.id}`)}>
            <GlassCard style={{ marginBottom: 10 }}>
              <Text style={styles.ticketSubject}>{item.subject}</Text>
              <Text style={styles.ticketMeta}>{item.status} · {item.priority}</Text>
            </GlassCard>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12 },
  back: { width: 40 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, color: colors.text, marginBottom: 10 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  cat: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  catActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.12)' },
  catText: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  catTextActive: { color: colors.primary },
  ticketSubject: { color: colors.text, fontWeight: '700' },
  ticketMeta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
