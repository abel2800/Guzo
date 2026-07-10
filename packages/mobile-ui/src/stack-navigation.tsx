import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

type Palette = { bg: string; text: string };

/** Shared stack header with a consistent back chevron for all GUZO mobile apps. */
export function createStackScreenOptions(palette: Palette): NativeStackNavigationOptions {
  return {
    headerStyle: { backgroundColor: palette.bg },
    headerTintColor: palette.text,
    headerTitleStyle: { fontWeight: '700' },
    headerShadowVisible: false,
    headerBackTitle: '',
    contentStyle: { backgroundColor: palette.bg },
    headerBackVisible: false,
    headerLeft: ({ canGoBack }) =>
      canGoBack ? (
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ marginLeft: 4, padding: 4 }}
        >
          <Ionicons name="chevron-back" size={26} color={palette.text} />
        </Pressable>
      ) : undefined,
  };
}
