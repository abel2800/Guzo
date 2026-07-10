import type { ReactNode } from 'react';
import { View, ScrollView, type ScrollViewProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { designStyles, spacing } from './design';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  /** Apply top safe-area inset (notch / Dynamic Island). Default true. */
  topInset?: boolean;
  /** Extra bottom padding for floating tab bar. Default false. */
  tabBar?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
} & Omit<ScrollViewProps, 'style' | 'contentContainerStyle'>;

/** Consistent screen wrapper with safe-area insets for all mobile apps. */
export function Screen({
  children,
  scroll = false,
  topInset = true,
  tabBar = false,
  style,
  contentContainerStyle,
  ...scrollProps
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: topInset ? insets.top + spacing.sm : spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: tabBar ? 120 : Math.max(insets.bottom, spacing.lg),
  };

  if (scroll) {
    return (
      <ScrollView
        style={[designStyles.screen, style]}
        contentContainerStyle={[pad, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...scrollProps}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[designStyles.screen, pad, style]}>
      {children}
    </View>
  );
}

/** Build content padding for screens that manage their own ScrollView. */
export function useScreenPadding(options?: { topInset?: boolean; tabBar?: boolean }) {
  const insets = useSafeAreaInsets();
  const topInset = options?.topInset ?? true;
  const tabBar = options?.tabBar ?? false;
  return {
    paddingTop: topInset ? insets.top + spacing.sm : spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: tabBar ? 120 : Math.max(insets.bottom, spacing.lg),
  } as const;
}
