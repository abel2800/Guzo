import { Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients } from '@/lib/design';

export function QuickSendFab() {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      style={[styles.fab, { bottom: insets.bottom + 88 }]}
      onPress={() => router.push('/(tabs)/book')}
      accessibilityLabel="Quick send parcel"
    >
      <LinearGradient colors={[...gradients.primary]} style={styles.inner}>
        <Ionicons name="add" size={28} color="#fff" />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    zIndex: 50,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  inner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
