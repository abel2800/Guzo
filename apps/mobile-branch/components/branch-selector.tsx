import { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, colors, radius, spacing } from '@guzo/mobile-ui';
import { useBranch } from '@/lib/branch';

export function BranchSelector() {
  const { branches, branchId, branch, loading, setBranchId } = useBranch();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <GlassCard style={styles.selector}>
        <Text style={styles.loading}>Loading branches…</Text>
      </GlassCard>
    );
  }

  if (branches.length === 0) {
    return (
      <GlassCard style={styles.selector}>
        <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
        <View style={{ flex: 1 }}>
          <Text style={styles.emptyTitle}>No branch assigned</Text>
          <Text style={styles.emptySub}>Ask an admin to assign your account to a branch.</Text>
        </View>
      </GlassCard>
    );
  }

  return (
    <>
      <Pressable onPress={() => setOpen(true)}>
        <GlassCard style={styles.selector}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Working branch</Text>
            <Text style={styles.name}>{branch?.name ?? 'Select branch'}</Text>
            <Text style={styles.meta}>
              {branch?.city ?? '—'} · {branch?.code ?? ''}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={22} color={colors.primary} />
        </GlassCard>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Select branch</Text>
            <FlatList
              data={branches}
              keyExtractor={(item) => item.branchId}
              renderItem={({ item }) => {
                const active = item.branchId === branchId;
                return (
                  <Pressable
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => {
                      setBranchId(item.branchId);
                      setOpen(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionName, active && styles.optionNameActive]}>
                        {item.branch?.name ?? item.branchId}
                      </Text>
                      <Text style={styles.optionMeta}>
                        {item.branch?.city} · {item.branch?.code}
                      </Text>
                      <Text style={styles.optionAddr} numberOfLines={1}>
                        {item.branch?.line1}
                      </Text>
                    </View>
                    {active ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
    marginBottom: 16,
  },
  label: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  name: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 2 },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  loading: { color: colors.textMuted },
  emptyTitle: { color: colors.text, fontWeight: '700' },
  emptySub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '70%',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sheetTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.08)' },
  optionName: { color: colors.text, fontWeight: '700', fontSize: 16 },
  optionNameActive: { color: colors.primary },
  optionMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  optionAddr: { color: colors.textDim, fontSize: 11, marginTop: 2 },
});
