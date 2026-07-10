import { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, gradients, radius } from '@/lib/design';

const { width } = Dimensions.get('window');
const CARD_W = width - 48;

const PROMOS = [
  { id: '1', title: 'Free express upgrade', sub: 'On your next 3 orders', gradient: gradients.promo1, route: '/(tabs)/book' as const },
  { id: '2', title: '20% off groceries', sub: 'This weekend only', gradient: gradients.promo2, route: '/(tabs)/book' as const },
  { id: '3', title: 'Refer & earn 100 ETB', sub: 'Invite friends to GUZO', gradient: ['#312E81', '#0F172A'] as const, route: '/wallet' as const },
];

export function PromoCarousel() {
  const [idx, setIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 12));
    setIdx(i);
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Offers for you</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={CARD_W + 12}
        decelerationRate="fast"
        contentContainerStyle={{ gap: 12 }}
      >
        {PROMOS.map((p) => (
          <Pressable key={p.id} onPress={() => router.push(p.route)}>
            <LinearGradient colors={[...p.gradient]} style={[styles.card, { width: CARD_W }]}>
              <Text style={styles.title}>{p.title}</Text>
              <Text style={styles.sub}>{p.sub}</Text>
              <View style={styles.cta}>
                <Text style={styles.ctaText}>Claim offer →</Text>
              </View>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {PROMOS.map((p, i) => (
          <View key={p.id} style={[styles.dot, i === idx && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  card: {
    borderRadius: radius.lg,
    padding: 22,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  cta: { marginTop: 12 },
  ctaText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 18, backgroundColor: colors.primary },
});
