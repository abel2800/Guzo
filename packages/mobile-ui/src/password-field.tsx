import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, type TextInputProps, type ViewStyle, type TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from './design';

type Props = Omit<TextInputProps, 'secureTextEntry'> & {
  label?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
};

export function PasswordField({ label, containerStyle, inputStyle, style, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.wrap}>
        <TextInput
          {...props}
          style={[styles.input, inputStyle, style]}
          secureTextEntry={!visible}
          autoCapitalize="none"
          placeholderTextColor={colors.textDim}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          style={styles.eye}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  wrap: { position: 'relative' },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 48,
    color: colors.text,
    fontSize: 16,
  },
  eye: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
