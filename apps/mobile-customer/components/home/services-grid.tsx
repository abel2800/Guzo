import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radius } from '@/lib/design';

const SERVICES = [
  { id: 'parcel', title: 'Parcel', desc: 'Same-day delivery', icon: 'cube-outline' as const, colors: ['#1E3A5F', '#0F172A'] as const },
  { id: 'express', title: 'Express', desc: 'Under 2 hours', icon: 'flash-outline' as const, colors: ['#064E3B', '#0F172A'] as const },
  { id: 'scheduled', title: 'Scheduled', desc: 'Pick your time', icon: 'calendar-outline' as const, colors: ['#4C1D95', '#0F172A'] as const },
  { id: 'bulk', title: 'Business', desc: 'Volume rates', icon: 'business-outline' as const, colors: ['#7C2D12', '#0F172A'] as const },
];

export function ServicesGrid() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick services</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {SERVICES.map((s) => (
          <Pressable key={s.id} onPress={() => router.push('/(tabs)/book')} style={styles.cardWrap}>
            <LinearGradient colors={[...s.colors]} style={styles.card}>
              <View style={styles.iconCircle}>
                <Ionicons name={s.icon} size={22} color={colors.primary} />
              </View>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.desc}>{s.desc}</Text>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  scroll: { gap: 12, paddingRight: 8 },
  cardWrap: { width: 140 },
  card: {
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 130,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34,197,94,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { color: colors.text, fontWeight: '700', fontSize: 15 },
  desc: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
