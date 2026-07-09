import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { quoteOrder } from '@guzo/mobile-shared';
import { GradientButton, GlassCard } from '@guzo/mobile-ui';
import { colors, designStyles, radius, spacing } from '@/lib/design';

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();
  const [pickupCity, setPickupCity] = useState('Addis Ababa');
  const [dropCity, setDropCity] = useState('Hawassa');
  const [weight, setWeight] = useState('1');
  const [quote, setQuote] = useState('');
  const [error, setError] = useState('');

  async function onCalculate() {
    setError('');
    try {
      const q = await quoteOrder({
        pickup: { line1: pickupCity, city: pickupCity },
        dropoff: { line1: dropCity, city: dropCity },
        package: { weightKg: parseFloat(weight) || 1 },
      });
      setQuote(`${q.currency} ${q.totalAmount.toLocaleString()} (${q.distanceKm.toFixed(1)} km)`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Quote failed');
    }
  }

  return (
    <View style={[designStyles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Shipping calculator</Text>
        <View style={styles.back} />
      </View>
      <View style={designStyles.screenPad}>
        <GlassCard>
          <Text style={styles.label}>From city</Text>
          <TextInput style={styles.input} value={pickupCity} onChangeText={setPickupCity} placeholderTextColor={colors.textDim} />
          <Text style={styles.label}>To city</Text>
          <TextInput style={styles.input} value={dropCity} onChangeText={setDropCity} placeholderTextColor={colors.textDim} />
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholderTextColor={colors.textDim} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {quote ? <Text style={styles.quote}>{quote}</Text> : null}
          <GradientButton label="Calculate" onPress={onCalculate} style={{ marginTop: 12 }} />
        </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12 },
  back: { width: 40 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, color: colors.text },
  quote: { color: colors.primary, fontSize: 20, fontWeight: '800', marginTop: 16 },
  error: { color: '#ef4444', marginTop: 8 },
});
