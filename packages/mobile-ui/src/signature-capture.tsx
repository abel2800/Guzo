import { useRef, useState } from 'react';
import { View, PanResponder, StyleSheet, Text, Pressable } from 'react-native';
import { colors, radius } from './design';

export type SignatureCaptureProps = {
  onChange: (strokes: Array<Array<{ x: number; y: number }>>) => void;
  height?: number;
};

export function SignatureCapture({ onChange, height = 140 }: SignatureCaptureProps) {
  const [strokes, setStrokes] = useState<Array<Array<{ x: number; y: number }>>>([]);
  const current = useRef<Array<{ x: number; y: number }>>([]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX: x, locationY: y } = evt.nativeEvent;
        current.current = [{ x, y }];
      },
      onPanResponderMove: (evt) => {
        const { locationX: x, locationY: y } = evt.nativeEvent;
        current.current.push({ x, y });
        setStrokes((s) => [...s.slice(0, -1), [...current.current]]);
      },
      onPanResponderRelease: () => {
        const finished = [...current.current];
        if (finished.length > 1) {
          setStrokes((s) => {
            const next = [...s.filter((st) => st !== current.current), finished];
            onChange(next);
            return next;
          });
        }
        current.current = [];
      },
    }),
  ).current;

  const clear = () => {
    setStrokes([]);
    onChange([]);
  };

  return (
    <View>
      <View style={[styles.pad, { height }]} {...pan.panHandlers}>
        {strokes.map((stroke, si) =>
          stroke.map((pt, pi) => (
            <View
              key={`${si}-${pi}`}
              style={[styles.dot, { left: pt.x - 2, top: pt.y - 2 }]}
            />
          )),
        )}
        {strokes.length === 0 && <Text style={styles.hint}>Sign here</Text>}
      </View>
      <Pressable onPress={clear} style={styles.clear}>
        <Text style={styles.clearText}>Clear</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.2)',
    overflow: 'hidden',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  hint: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    color: colors.textDim,
    fontSize: 13,
  },
  clear: { alignSelf: 'flex-end', marginTop: 8, padding: 4 },
  clearText: { color: colors.textMuted, fontSize: 12 },
});
