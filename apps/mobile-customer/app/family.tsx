import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { linkFamilyMember, listFamilyMembers } from '@guzo/mobile-shared';
import { GlassCard, GradientButton } from '@guzo/mobile-ui';
import { colors, designStyles, radius, spacing } from '@/lib/design';

const RELATIONS = ['SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER'];

export default function FamilyScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [memberUserId, setMemberUserId] = useState('');
  const [relation, setRelation] = useState('SPOUSE');
  const [label, setLabel] = useState('');

  const { data = [], isLoading } = useQuery({ queryKey: ['family'], queryFn: listFamilyMembers });

  const link = useMutation({
    mutationFn: () => linkFamilyMember({ memberUserId: memberUserId.trim(), relation, label: label.trim() || undefined }),
    onSuccess: () => {
      setMemberUserId('');
      setLabel('');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['family'] });
    },
  });

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Family</Text>
        <Pressable onPress={() => setShowForm((v) => !v)} style={styles.back}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color={colors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={data}
        keyExtractor={(m) => m.id}
        contentContainerStyle={designStyles.screenPad}
        ListHeaderComponent={
          showForm ? (
            <GlassCard style={{ marginBottom: 16 }}>
              <Text style={styles.formLabel}>Link by Guzo user ID</Text>
              <TextInput
                style={styles.input}
                value={memberUserId}
                onChangeText={setMemberUserId}
                placeholder="User ID (from their profile)"
                placeholderTextColor={colors.textDim}
              />
              <View style={styles.relationRow}>
                {RELATIONS.map((r) => (
                  <Pressable key={r} onPress={() => setRelation(r)} style={[styles.relation, relation === r && styles.relationActive]}>
                    <Text style={[styles.relationText, relation === r && styles.relationTextActive]}>{r}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.input}
                value={label}
                onChangeText={setLabel}
                placeholder="Nickname (optional)"
                placeholderTextColor={colors.textDim}
              />
              <GradientButton
                label={link.isPending ? 'Linking…' : 'Link member'}
                onPress={() => link.mutate()}
                disabled={!memberUserId.trim() || link.isPending}
              />
            </GlassCard>
          ) : null
        }
        ListEmptyComponent={<Text style={styles.empty}>{isLoading ? 'Loading…' : 'No family members linked yet'}</Text>}
        renderItem={({ item }) => (
          <GlassCard style={{ marginBottom: 10 }}>
            <Text style={styles.name}>
              {item.member ? `${item.member.firstName} ${item.member.lastName}` : item.relation}
              {item.label ? ` · ${item.label}` : ''}
            </Text>
            <Text style={styles.meta}>{item.relation}</Text>
            {item.member?.guzoId ? <Text style={styles.guzoId}>{item.member.guzoId}</Text> : null}
            {item.member?.phone ? <Text style={styles.meta}>{item.member.phone}</Text> : null}
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
  name: { color: colors.text, fontWeight: '700', fontSize: 16 },
  meta: { color: colors.textMuted, marginTop: 4 },
  guzoId: { color: colors.primary, marginTop: 6, fontWeight: '600' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  formLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  input: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    color: colors.text,
    marginBottom: 10,
  },
  relationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  relation: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  relationActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.12)' },
  relationText: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  relationTextActive: { color: colors.primary },
});
