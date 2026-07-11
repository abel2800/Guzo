import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listInsuranceClaims, submitInsuranceClaim } from '@guzo/mobile-shared';
import { GlassCard, GradientButton } from '@guzo/mobile-ui';
import { colors, designStyles, radius } from '@/lib/design';

export default function InsuranceScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [description, setDescription] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['insurance-claims'],
    queryFn: () => listInsuranceClaims({ limit: 30 }),
  });

  const submit = useMutation({
    mutationFn: () => submitInsuranceClaim({ orderId: orderId.trim(), description: description.trim() || undefined }),
    onSuccess: () => {
      setOrderId('');
      setDescription('');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['insurance-claims'] });
    },
  });

  const items = Array.isArray(data) ? data : [];

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>
        <Text style={styles.title}>Insurance claims</Text>
        <Pressable onPress={() => setShowForm((v) => !v)}><Ionicons name={showForm ? 'close' : 'add'} size={24} color={colors.primary} /></Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={designStyles.screenPad}
        ListHeaderComponent={
          showForm ? (
            <GlassCard style={{ marginBottom: 16 }}>
              <TextInput style={styles.input} value={orderId} onChangeText={setOrderId} placeholder="Order ID" placeholderTextColor={colors.textDim} />
              <TextInput style={[styles.input, { minHeight: 80 }]} value={description} onChangeText={setDescription} placeholder="What happened?" placeholderTextColor={colors.textDim} multiline />
              <GradientButton label={submit.isPending ? 'Submitting…' : 'File claim'} onPress={() => submit.mutate()} disabled={!orderId.trim() || submit.isPending} />
            </GlassCard>
          ) : null
        }
        ListEmptyComponent={<Text style={styles.empty}>{isLoading ? 'Loading…' : 'No claims yet'}</Text>}
        renderItem={({ item }) => (
          <GlassCard style={{ marginBottom: 10 }}>
            <Text style={styles.name}>{item.order?.orderNumber ?? item.orderId}</Text>
            <Text style={styles.meta}>{item.status}</Text>
            {item.description ? <Text style={styles.meta}>{item.description}</Text> : null}
          </GlassCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  name: { color: colors.text, fontWeight: '700' },
  meta: { color: colors.textMuted, marginTop: 4 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    color: colors.text,
    marginBottom: 10,
  },
});
