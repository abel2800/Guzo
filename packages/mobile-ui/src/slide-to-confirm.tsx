import { useRef, useState } from 'react';
import { View, Text, PanResponder, Animated, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from './design';

export interface SlideToConfirmProps {
  label: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'primary' | 'accent' | 'warning';
}

const THUMB = 52;
const TRACK_W = 300;

export function SlideToConfirm({ label, onConfirm, disabled, loading, tone = 'primary' }: SlideToConfirmProps) {
  const [done, setDone] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const maxSlide = TRACK_W - THUMB - 10;
  const accent = tone === 'warning' ? colors.warning : tone === 'accent' ? colors.accent : colors.primary;

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => !disabled && !loading && !done,
      onPanResponderMove: (_, g) => {
        translateX.setValue(Math.max(0, Math.min(g.dx, maxSlide)));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > maxSlide * 0.82) {
          Animated.spring(translateX, { toValue: maxSlide, useNativeDriver: true, bounciness: 0 }).start(async () => {
            setDone(true);
            await onConfirm();
          });
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  return (
    <View style={[styles.track, { borderColor: `${accent}55` }, disabled && styles.disabled]}>
      <Text style={[styles.label, { color: accent }]} numberOfLines={1}>
        {done ? 'Confirmed' : label}
      </Text>
      <Animated.View
        style={[styles.thumb, { backgroundColor: accent, transform: [{ translateX }] }]}
        {...pan.panHandlers}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons name={done ? 'checkmark' : 'chevron-forward'} size={22} color="#fff" />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_W,
    maxWidth: '100%',
    height: 56,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  disabled: { opacity: 0.45 },
  label: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 14,
    paddingHorizontal: THUMB + 8,
  },
  thumb: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: THUMB,
    height: THUMB - 8,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
