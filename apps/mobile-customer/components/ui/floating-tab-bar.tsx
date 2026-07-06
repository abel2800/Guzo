import { useEffect, useRef } from 'react';
import { View, Pressable, Text, StyleSheet, Animated, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, radius, shadow } from '@/lib/design';

const TABS: { name: string; label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'book', label: 'Send', icon: 'cube-outline', iconActive: 'cube' },
  { name: 'notifications', label: 'Alerts', icon: 'notifications-outline', iconActive: 'notifications' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

function TabIcon({ name, focused, onPress }: { name: string; focused: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const tab = TABS.find((t) => t.name === name);
  if (!tab) return null;

  useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.18, useNativeDriver: true, speed: 50, bounciness: 12 }),
        Animated.spring(scale, { toValue: 1.08, useNativeDriver: true, speed: 40, bounciness: 8 }),
      ]).start();
    } else {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    }
  }, [focused, scale]);

  return (
    <Pressable onPress={onPress} style={styles.tab} accessibilityRole="button">
      <Animated.View style={[styles.iconWrap, focused && styles.iconWrapActive, { transform: [{ scale }] }]}>
        {focused && <View style={styles.glow} />}
        <Ionicons name={focused ? tab.iconActive : tab.icon} size={22} color={focused ? colors.primary : colors.textMuted} />
      </Animated.View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{tab.label}</Text>
    </Pressable>
  );
}

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={[styles.pill, shadow.tabBar]}>
        {Platform.OS === 'web' ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,23,42,0.92)' }]} />
        ) : (
          <BlurView intensity={Platform.OS === 'ios' ? 60 : 40} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.row}>
          {state.routes
            .filter((r) => TABS.some((t) => t.name === r.name))
            .map((route) => {
              const idx = state.routes.indexOf(route);
              const focused = state.index === idx;
              return (
                <TabIcon
                  key={route.key}
                  name={route.name}
                  focused={focused}
                  onPress={() => {
                    const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
                  }}
                />
              );
            })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pill: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceGlass,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tab: { alignItems: 'center', flex: 1, paddingVertical: 4 },
  iconWrap: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  iconWrapActive: { backgroundColor: 'rgba(34,197,94,0.12)' },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  tabLabel: { fontSize: 10, fontWeight: '600', color: colors.textDim, marginTop: 2 },
  tabLabelActive: { color: colors.primary },
});
