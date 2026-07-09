import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createMerchantApiKey, listMerchantApiKeys, revokeMerchantApiKey } from '@guzo/mobile-shared';
import { GlassCard, GradientButton, colors, designStyles } from '@guzo/mobile-ui';

export default function ApiKeysScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [label, setLabel] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['merchant-keys'], queryFn: listMerchantApiKeys });

  const createMut = useMutation({
    mutationFn: () => createMerchantApiKey(label || 'mobile'),
    onSuccess: (res) => {
      Alert.alert('API key created', `Copy now — shown once:\n\n${res.apiKey}`);
      setLabel('');
      qc.invalidateQueries({ queryKey: ['merchant-keys'] });
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => revokeMerchantApiKey(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchant-keys'] }),
  });

  return (
    <ScrollView style={[designStyles.screen, { paddingTop: insets.top }]} contentContainerStyle={designStyles.screenPad}>
      <Text style={styles.title}>API keys</Text>
      <GlassCard>
        <TextInput style={styles.input} value={label} onChangeText={setLabel} placeholder="Key label" placeholderTextColor={colors.textDim} />
        <GradientButton label={createMut.isPending ? 'Creating…' : 'Create key'} onPress={() => createMut.mutate()} disabled={createMut.isPending} />
      </GlassCard>
      {isLoading ? <Text style={styles.muted}>Loading…</Text> : null}
      {(data ?? []).map((k) => (
        <GlassCard key={k.id} style={styles.card}>
          <Text style={styles.ref}>{k.label}</Text>
          <Text style={styles.meta}>{k.keyPrefix}… · {k.isActive ? 'Active' : 'Revoked'}</Text>
          {k.isActive && (
            <Pressable onPress={() => revokeMut.mutate(k.id)} style={styles.revoke}>
              <Text style={styles.revokeText}>Revoke</Text>
            </Pressable>
          )}
        </GlassCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '900', marginBottom: 16 },
  input: { backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, color: colors.text, marginBottom: 12 },
  card: { marginTop: 10 },
  ref: { color: colors.text, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  revoke: { marginTop: 8, alignSelf: 'flex-start' },
  revokeText: { color: colors.error, fontWeight: '600' },
  muted: { color: colors.textMuted, marginTop: 16 },
});
