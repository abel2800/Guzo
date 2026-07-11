import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { applyReferralCode, getLoyaltyProfile } from '@guzo/mobile-shared';
import { GlassCard, GradientButton } from '@guzo/mobile-ui';
import { colors, designStyles, radius } from '@/lib/design';

export default function LoyaltyScreen() {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const { data, isLoading, refetch } = useQuery({ queryKey: ['loyalty'], queryFn: getLoyaltyProfile });

  const referral = useMutation({
    mutationFn: () => applyReferralCode(code.trim()),
    onSuccess: () => {
      setCode('');
      refetch();
    },
  });

  return (
    <ScrollView style={[designStyles.screen, { paddingTop: insets.top }]} contentContainerStyle={designStyles.screenPad}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>
        <Text style={styles.title}>Loyalty</Text>
        <View style={{ width: 24 }} />
      </View>

      <GlassCard>
        <Text style={styles.label}>Points balance</Text>
        <Text style={styles.points}>{isLoading ? '…' : data?.loyaltyPoints ?? 0}</Text>
        <Text style={styles.meta}>Earn {data?.pointsPerDelivery ?? 10} points per delivery</Text>
        <Text style={styles.meta}>Your code: {data?.referralCode ?? '—'}</Text>
      </GlassCard>

      <GlassCard style={{ marginTop: 16 }}>
        <Text style={styles.label}>Referral code</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="Enter friend's code"
          placeholderTextColor={colors.textDim}
          autoCapitalize="characters"
        />
        <GradientButton
          label={referral.isPending ? 'Applying…' : 'Apply code'}
          onPress={() => referral.mutate()}
          disabled={!code.trim() || referral.isPending}
        />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  points: { color: colors.primary, fontSize: 36, fontWeight: '800', marginTop: 8 },
  meta: { color: colors.textMuted, marginTop: 6 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    color: colors.text,
    marginVertical: 10,
  },
});
