import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPendingRatings, rateOrder } from '@guzo/mobile-shared';
import { GlassCard, GradientButton } from '@guzo/mobile-ui';
import { colors, designStyles, radius } from '@/lib/design';

export default function ReviewsScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data = [], isLoading } = useQuery({ queryKey: ['pending-ratings'], queryFn: getPendingRatings });

  const submit = useMutation({
    mutationFn: (orderId: string) => rateOrder(orderId, rating, comment.trim() || undefined),
    onSuccess: () => {
      setSelectedId(null);
      setComment('');
      setRating(5);
      qc.invalidateQueries({ queryKey: ['pending-ratings'] });
    },
  });

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>
        <Text style={styles.title}>Rate deliveries</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={designStyles.screenPad}
        ListEmptyComponent={<Text style={styles.empty}>{isLoading ? 'Loading…' : 'All caught up — no pending ratings'}</Text>}
        renderItem={({ item }) => (
          <GlassCard style={{ marginBottom: 10 }}>
            <Text style={styles.name}>{item.orderNumber}</Text>
            {selectedId === item.id ? (
              <View style={{ marginTop: 12 }}>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable key={n} onPress={() => setRating(n)}>
                      <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={28} color={colors.warning} />
                    </Pressable>
                  ))}
                </View>
                <TextInput style={[styles.input, { minHeight: 60 }]} value={comment} onChangeText={setComment} placeholder="Optional comment" placeholderTextColor={colors.textDim} multiline />
                <GradientButton label={submit.isPending ? 'Saving…' : 'Submit rating'} onPress={() => submit.mutate(item.id)} disabled={submit.isPending} />
              </View>
            ) : (
              <Pressable style={styles.rateBtn} onPress={() => setSelectedId(item.id)}>
                <Text style={styles.rateBtnText}>Rate this delivery</Text>
              </Pressable>
            )}
          </GlassCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  name: { color: colors.text, fontWeight: '700', fontSize: 16 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  stars: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    color: colors.text,
    marginBottom: 10,
  },
  rateBtn: { marginTop: 10, alignSelf: 'flex-start' },
  rateBtnText: { color: colors.primary, fontWeight: '700' },
});
