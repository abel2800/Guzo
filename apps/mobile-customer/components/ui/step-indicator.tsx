import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/design';

interface StepIndicatorProps {
  current: number;
  total: number;
  labels?: string[];
}

export function StepIndicator({ current, total, labels }: StepIndicatorProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.dots}>
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          const active = step <= current;
          const isCurrent = step === current;
          return (
            <View key={step} style={styles.dotRow}>
              <View style={[styles.dot, active && styles.dotActive, isCurrent && styles.dotCurrent]}>
                {active && <Text style={styles.dotNum}>{step}</Text>}
              </View>
              {i < total - 1 && <View style={[styles.line, step < current && styles.lineActive]} />}
            </View>
          );
        })}
      </View>
      {labels?.[current - 1] && (
        <Text style={styles.label}>{labels[current - 1]}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dotRow: { flexDirection: 'row', alignItems: 'center' },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.15)' },
  dotCurrent: { borderColor: colors.primary, backgroundColor: colors.primary },
  dotNum: { color: colors.text, fontSize: 11, fontWeight: '700' },
  line: { width: 32, height: 2, backgroundColor: colors.border, marginHorizontal: 4 },
  lineActive: { backgroundColor: colors.primary },
  label: { textAlign: 'center', color: colors.textMuted, fontSize: 13, marginTop: 10, fontWeight: '600' },
});
