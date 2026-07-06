import { Pressable, Text, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius } from '@/lib/design';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline';
  style?: ViewStyle;
}

export function GradientButton({ label, onPress, disabled, loading, variant = 'primary', style }: GradientButtonProps) {
  if (variant === 'outline') {
    return (
      <Pressable
        style={[styles.outline, disabled && styles.disabled, style]}
        onPress={onPress}
        disabled={disabled || loading}
      >
        {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.outlineText}>{label}</Text>}
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={[styles.pressable, disabled && styles.disabled, style]}>
      <LinearGradient colors={[...gradients.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
        {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.text}>{label}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { borderRadius: radius.md, overflow: 'hidden' },
  gradient: { paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center' },
  text: { color: colors.bg, fontWeight: '800', fontSize: 16 },
  outline: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  outlineText: { color: colors.text, fontWeight: '600', fontSize: 16 },
  disabled: { opacity: 0.5 },
});
