import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { listInvoices } from '@guzo/mobile-shared';
import { GlassCard, colors, designStyles } from '@guzo/mobile-ui';

export default function InvoicesScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useQuery({ queryKey: ['merchant-invoices'], queryFn: () => listInvoices({ limit: 30 }) });

  return (
    <ScrollView style={[designStyles.screen, { paddingTop: insets.top }]} contentContainerStyle={designStyles.screenPad}>
      <Text style={styles.title}>Invoices</Text>
      <Text style={styles.sub}>Merchant billing and paid shipment invoices.</Text>
      {isLoading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : (
        (data?.items ?? []).map((inv) => (
          <GlassCard key={inv.id} style={styles.card}>
            <Text style={styles.ref}>{inv.invoiceNumber}</Text>
            <Text style={styles.meta}>{inv.status} · {inv.currency} {Number(inv.total).toLocaleString()}</Text>
            <Text style={styles.date}>{new Date(inv.createdAt).toLocaleDateString()}</Text>
          </GlassCard>
        ))
      )}
      {!isLoading && !(data?.items?.length) && <Text style={styles.muted}>No invoices yet.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '900', marginBottom: 6 },
  sub: { color: colors.textMuted, marginBottom: 16 },
  card: { marginBottom: 10 },
  ref: { color: colors.text, fontWeight: '700', fontFamily: 'monospace' },
  meta: { color: colors.primary, marginTop: 4 },
  date: { color: colors.textDim, fontSize: 12, marginTop: 4 },
  muted: { color: colors.textMuted, textAlign: 'center', marginTop: 24 },
});
