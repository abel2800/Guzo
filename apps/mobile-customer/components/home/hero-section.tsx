import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, gradients, radius, typography } from '@/lib/design';

const QUICK_ACTIONS = [
  { id: 'package', label: 'Send Package', icon: 'cube' as const, route: '/(tabs)/book' },
  { id: 'food', label: 'Food', icon: 'restaurant' as const, route: '/(tabs)/book' },
  { id: 'grocery', label: 'Grocery', icon: 'cart' as const, route: '/(tabs)/book' },
  { id: 'express', label: 'Express', icon: 'flash' as const, route: '/(tabs)/book' },
];

export function HeroSection() {
  return (
    <View style={styles.wrap}>
      <LinearGradient colors={[...gradients.hero]} style={styles.gradient}>
        {/* Floating 3D-style orbs */}
        <View style={[styles.orb, styles.orb1]} />
        <View style={[styles.orb, styles.orb2]} />
        <View style={styles.boxIllustration}>
          <LinearGradient colors={[...gradients.primary]} style={styles.box}>
            <Ionicons name="cube" size={32} color={colors.bg} />
          </LinearGradient>
          <View style={styles.boxShadow} />
        </View>

        <Text style={styles.greeting}>Good day 👋</Text>
        <Text style={styles.headline}>Where do you want to{'\n'}send your order today?</Text>

        <Pressable style={styles.search} onPress={() => router.push('/(tabs)/book')}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Enter pickup or drop-off address…</Text>
          <View style={styles.searchGo}>
            <Ionicons name="arrow-forward" size={16} color={colors.bg} />
          </View>
        </Pressable>

        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable key={a.id} style={styles.quickBtn} onPress={() => router.push(a.route as '/(tabs)/book')}>
              <View style={styles.quickIcon}>
                <Ionicons name={a.icon} size={18} color={colors.primary} />
              </View>
              <Text style={styles.quickLabel} numberOfLines={1}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: -24, marginTop: -8, marginBottom: 8 },
  gradient: {
    paddingTop: 8,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.4 },
  orb1: { width: 120, height: 120, backgroundColor: colors.primary, top: -30, right: -20, opacity: 0.15 },
  orb2: { width: 80, height: 80, backgroundColor: colors.accent, bottom: 40, left: -20, opacity: 0.12 },
  boxIllustration: { position: 'absolute', top: 16, right: 24, alignItems: 'center' },
  box: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  boxShadow: {
    width: 40,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 999,
    marginTop: 8,
    transform: [{ scaleX: 1.2 }],
  },
  greeting: { color: colors.textMuted, fontSize: 14, marginBottom: 4 },
  headline: { ...typography.hero, color: colors.text, marginBottom: 20, maxWidth: '75%' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  searchPlaceholder: { flex: 1, color: colors.textDim, fontSize: 14 },
  searchGo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  quickBtn: { flex: 1, alignItems: 'center' },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: colors.borderGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
});
